# Raptor Street: App Store launch kit

The game is built and wired. This file covers what is left, and who does it.

- **Bundle ID:** `com.synergiinsights.raptorstreet`
- **Team:** Synergi Insights (`CD9F4JR9G3`)
- **Devices:** iPhone only, landscape only
- **Ads:** AdMob through `@capacitor-community/admob`. The app currently uses **Google's test IDs**: test ads show and pay nothing.

## 1. AdMob (owner, about 20 minutes)

1. Sign in at https://admob.google.com with the Synergi Google account.
2. **Apps → Add app → iOS → "not yet published"**, and name it Raptor Street. Copy the **App ID** (`ca-app-pub-XXXX~YYYY`).
3. Add two ad units to that app and copy each unit ID (`ca-app-pub-XXXX/ZZZZ`):
   - **Rewarded**, named "revive and double cash"
   - **Interstitial**, named "between levels"
4. Payments: add the business bank and tax info. AdMob pays monthly once you pass $100.
5. Privacy & messaging: create the **GDPR** message (EU consent) and the **IDFA explainer** message. The app already calls the consent form and the tracking prompt; this step makes AdMob serve them.
6. Send Claude the three IDs, or put them in yourself:
   - App ID → `ios/App/App/Info.plist` → `GADApplicationIdentifier`
   - Unit IDs → `src/dc1/ads.js` → `AD_UNITS.ios`
7. Before submitting, refresh the SKAdNetwork list in `Info.plist` from Google's current list: https://developers.google.com/admob/ios/privacy/strategies (it changes).

**Never tap your own live ads** on a real device. AdMob bans accounts for that. Test with the test IDs, or register your phone as a test device.

## 2. App Store Connect record (owner, about 30 minutes)

1. https://appstoreconnect.apple.com → **Apps → + → New App**.
2. Fill in:
   - Platform: iOS
   - Name: **Raptor Street** (if taken, try "Raptor Street: Dino Blaster")
   - Language: English (US)
   - Bundle ID: `com.synergiinsights.raptorstreet` (register it first under Certificates, IDs & Profiles → Identifiers if it doesn't appear)
   - SKU: `raptorstreet`
3. **Pricing:** Free.
4. **Category:** Games → Action, with Arcade as the secondary.
5. **Age rating questionnaire.** Answer honestly; this is the one that can get the app pulled later.
   - Cartoon or fantasy violence: **Frequent/Intense**
   - Realistic violence: **Infrequent/Mild**. The blood and decapitation are cartoon-style, but a reviewer may judge otherwise.
   - Everything else: None
   - Expect **13+**, possibly **16+**. The in-game GORE switch doesn't change the rating, because the default is on.
6. **App Privacy (the nutrition label).** Answer "Yes, we collect data", then declare:

   | Data type | Linked to user | Used for tracking | Purpose |
   |---|---|---|---|
   | Device ID | No | Yes | Third-party advertising |
   | Advertising data | No | Yes | Third-party advertising |
   | Coarse location (from IP, by AdMob) | No | Yes | Third-party advertising |
   | Product interaction | No | Yes | Third-party advertising, analytics |
   | Crash data | No | No | App functionality |
   | Performance data | No | No | App functionality |

   This matches `ios/App/App/PrivacyInfo.xcprivacy`. If one changes, change both.
7. **Privacy policy URL** (required). Host a short page saying:
   - The game itself stores progress only on the device.
   - Ads are served by Google AdMob, which may collect a device identifier and coarse location to show ads.
   - Link Google's policy: https://policies.google.com/technologies/ads
   - Tracking happens only if the player allows it in the iOS prompt.

   A `/raptor-street/privacy` page on synergi-insights.com would do.
8. **Support URL:** any page with a contact email.

## 3. Listing copy (ready to paste)

- **Subtitle (30 characters):** `Blast dinos. Grab the cash.`
- **Promotional text:**

  > The dinosaurs took the city. It's just you, a bat, and a gun barn full of firepower. How long can you last?

- **Description:**

  > The dinosaurs have taken over the streets, and they bite.
  >
  > Walk the city, blast raptors, loot the shops for cash and ammo, and gear up at the Gun Barn with 25 weapons: pistols, shotguns, SMGs, rifles, a flamethrower, a buzz-saw launcher, rockets and a laser.
  >
  > • STREET SWEEP: endless levels that get tougher every round
  > • SURVIVAL: hold out as long as you can on four maps (Jungle, Wasteland, Cherry Village and the Cavern) while weapons drop from the sky
  > • Make your fighter: the Kid or the Brawler, with your own hair, colors and jersey number
  > • Upgrade every gun, swing your bat to shake off the biters, and watch out for the big green brutes
  > • Hand-inked comic art and over-the-top cartoon gore (switch it off anytime)
  >
  > Free to play. Watch an optional ad to revive or to double your cash.

- **Keywords (100 characters):** `dinosaur,shooter,zombie,arcade,retro,raptor,gun,survival,action,side scroller,blood,offline`
- **What's New (1.0):** `Welcome to Raptor Street.`

## 4. Screenshots (Claude can generate)

App Store Connect needs iPhone screenshots at **6.9" (1320×2868)** or **6.5" (1284×2778)**. Since the app is landscape, take them landscape: 2868×1320. Suggested set of five:

1. A street fight
2. A pack biting the kid, with blood
3. The Gun Barn shop
4. The Survival map picker
5. The character creator

These come from the simulator with `xcrun simctl io booted screenshot`.

## 5. Build and submit (owner, at the Mac)

```sh
cd raptor-street            # this repo
npm install
npm run ios:sync            # builds the game and copies it into the app
npm run ios:open            # opens Xcode
```

In Xcode:
1. Select the **App** target → **Signing**. The team is already set to Synergi; let it manage signing.
2. Set the destination to **Any iOS Device**, then **Product → Archive**.
3. In the Organizer: **Distribute App → App Store Connect → Upload**.
4. In App Store Connect: wait for the build to finish processing, attach it to version 1.0, add the screenshots, then **Submit for Review**.

## Watch-outs

- **The name and the art must stay original.** Never mention Dino Cap or Triniti in the listing, keywords or screenshots. Guideline 4.1 (copycats) and 5.2.1 (IP) put the whole Synergi account at risk.
- **The seller shows as "Synergi Insights"** next to the payroll app.
- **ATT:** the tracking prompt appears on first launch. Expect most players to decline; ads still serve, at lower rates.
- **Rejection risk under 4.3 (spam):** reviewers sometimes reject wrapped web games that feel like a website. This one is full-screen, offline, with touch controls and no browser chrome, which is the right side of that line. Mention "built with Capacitor, all content bundled" in the review notes.
