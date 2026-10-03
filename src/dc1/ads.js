// Ads. On iOS/Android they come from AdMob through the Capacitor plugin; on
// the web there are none unless ?adsim is in the URL, which plays a fake
// 2-second "ad" so the flow can be tested in a browser.
//
// Formats and where they go:
// - rewarded: REVIVE (once per run) and 2x CASH on LEVEL CLEAR. Player's choice.
// - interstitial: between Street Sweep levels only, at most every 2 levels and
//   every 2 minutes, never in a player's first session. Never on death/retry.

// Google's public test units. Replace with the real ones from AdMob before release.
export const AD_UNITS = {
  ios: { rewarded: "ca-app-pub-3940256099942544/1712485313", interstitial: "ca-app-pub-3940256099942544/4411468910" },
  android: { rewarded: "ca-app-pub-3940256099942544/5224354917", interstitial: "ca-app-pub-3940256099942544/1033173712" },
};
export const USING_TEST_ADS = AD_UNITS.ios.rewarded.startsWith("ca-app-pub-3940256099942544/");

export const INTERSTITIAL_EVERY_LEVELS = 2;
export const INTERSTITIAL_MIN_GAP_MS = 120_000;

// pure: may an interstitial play now?
export function shouldShowInterstitial({ levelsSinceAd, msSinceAd, sessions, removeAds = false }) {
  if (removeAds) return false;
  if (sessions <= 1) return false; // never in the first session
  if (levelsSinceAd < INTERSTITIAL_EVERY_LEVELS) return false;
  if (msSinceAd < INTERSTITIAL_MIN_GAP_MS) return false;
  return true;
}

const native = () => typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
const platform = () => (typeof window !== "undefined" && window.Capacitor?.getPlatform?.()) || "web";
const simulated = () => typeof location !== "undefined" && new URLSearchParams(location.search).has("adsim");

let admob = null;
let ready = false;
let lastInterstitial = 0;
let levelsSinceAd = 0;

async function plugin() {
  if (admob) return admob;
  const m = await import("@capacitor-community/admob");
  admob = m.AdMob;
  return admob;
}

export const adsAvailable = () => native() || simulated();

// once at launch on native: tracking prompt (iOS), consent form (EU), SDK init
export async function initAds() {
  if (!native() || ready) return;
  try {
    const AdMob = await plugin();
    try {
      const st = await AdMob.trackingAuthorizationStatus();
      if (st.status === "notDetermined") await AdMob.requestTrackingAuthorization();
    } catch {}
    try {
      const info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === "REQUIRED") await AdMob.showConsentForm();
    } catch {}
    await AdMob.initialize({ initializeForTesting: USING_TEST_ADS });
    ready = true;
    prepareRewarded();
  } catch (e) {
    console.warn("ads unavailable", e);
  }
}

const unit = (kind) => (AD_UNITS[platform()] || AD_UNITS.ios)[kind];
async function prepareRewarded() {
  try {
    await (await plugin()).prepareRewardVideoAd({ adId: unit("rewarded") });
  } catch {}
}

function fakeAd(label) {
  return new Promise((resolve) => {
    const el = document.createElement("div");
    el.className = "dc-fake-ad";
    el.textContent = `${label} (simulated ad)`;
    document.body.appendChild(el);
    setTimeout(() => (el.remove(), resolve(true)), 2000);
  });
}

// resolves true only if the player watched to the end and earned the reward
export async function showRewarded() {
  if (simulated()) return fakeAd("REWARDED");
  if (!native()) return false;
  try {
    const AdMob = await plugin();
    if (!ready) await initAds();
    const reward = await AdMob.showRewardVideoAd();
    prepareRewarded();
    lastInterstitial = Date.now(); // a rewarded ad resets the interstitial clock
    levelsSinceAd = 0;
    return !!reward && (reward.amount ?? 1) > 0;
  } catch {
    prepareRewarded();
    return false;
  }
}

// called on every LEVEL CLEAR -> NEXT; plays an interstitial only when allowed
export async function maybeInterstitial(sessions) {
  levelsSinceAd++;
  if (!adsAvailable()) return false;
  if (!shouldShowInterstitial({ levelsSinceAd, msSinceAd: Date.now() - lastInterstitial, sessions })) return false;
  levelsSinceAd = 0;
  lastInterstitial = Date.now();
  if (simulated()) return fakeAd("INTERSTITIAL");
  try {
    const AdMob = await plugin();
    await AdMob.prepareInterstitial({ adId: unit("interstitial") });
    await AdMob.showInterstitial();
    return true;
  } catch {
    return false;
  }
}
