# Umbra, Raycast, and Light/Dark Mode wallpapers

**Date:** 2026-07-24
**Scope:** First-party product pages, first-party source code, and the two local
Raycast HEIC files supplied for the planned English/Ukrainian article.

## Editorial conclusion

The cleanest personal story is not that Equinox or the Raycast Wallpaper extension
cannot handle appearance. Both can. The distinction is that the author's actual need
is unusually small and specific: keep one chosen image for Light Mode, another for Dark
Mode, and make the desktop follow macOS appearance.

Umbra maps directly to that mental model. Equinox is a broader wallpaper-creation tool,
while the Raycast extension treats appearance as a filter over its wallpaper catalogue
and random-rotation workflow. A precise line for the post would be:

> Raycast Wallpaper understands light and dark wallpapers, but not as the persistent
> pair I wanted. Umbra does.

“Equinox was overkill for this job” should remain an explicitly personal judgement,
not a general verdict on the app.

## Verified product claims

### Equinox

- Equinox is free and open source. It creates macOS-native dynamic wallpapers and is
  licensed under MIT
  ([Equinox product site](https://equinoxmac.com/);
  [official GitHub repository](https://github.com/rlxone/Equinox)).
- It supports three wallpaper types: Solar, Time, and Appearance. Appearance mode needs
  two images—one for Light Mode and one for Dark Mode—and the exported wallpaper changes
  with system appearance
  ([product site](https://equinoxmac.com/);
  [official README](https://github.com/rlxone/Equinox#appearance-wallpaper)).
- This means “Equinox cannot do it” would be inaccurate. The fair comparison is that
  Equinox creates and exports a native dynamic wallpaper, with additional solar and
  scheduled workflows, while the author only wanted to assign and maintain one
  appearance pair.

### Umbra

- Replay currently presents **Umbra 1.5** as a simple menu-bar app for assigning
  separate wallpapers to macOS light and dark appearances and toggling Dark Mode from
  the menu bar
  ([Umbra product page](https://replay.software/umbra);
  [Umbra help](https://replay.software/help/umbra)).
- The product page says **“Pay what you like”**; it does not describe Umbra as simply
  free. It requires macOS Big Sur 11.5 or later, and the help page says it is a
  Universal Binary for Intel and Apple silicon
  ([product page](https://replay.software/umbra);
  [help](https://replay.software/help/umbra)).
- It accepts JPG, HEIC, PNG, and PSD images; supports drag and drop; can select a
  specific HEIC variant; supports per-display wallpaper configuration; and says it
  keeps wallpapers, settings, and appearance synced with System Settings
  ([Umbra product page](https://replay.software/umbra)).
- Safe wording for the core behavior: “I give Umbra one image for Light Mode and one
  for Dark Mode, and it keeps that pair in sync with macOS appearance.” This stays
  within Replay’s stated behavior without speculating about implementation details.

### Echo and the Replay relationship

- Echo and Umbra are both products of Replay. Both product pages use the same footer:
  “Made by Replay,” naming Alasdair Monk and Hector Simpson
  ([Umbra](https://replay.software/umbra);
  [Echo](https://replay.software/echo)).
- Replay describes Echo as an SSH + Mosh client for iPhone and iPad. The page currently
  advertises **$2.99**, requires iOS 26+, and highlights Keychain, Face ID, Mosh,
  hardware-keyboard/iPad support, and use with terminal-based coding agents
  ([Echo product page](https://replay.software/echo)).
- The Echo mention works best as a short aside establishing prior trust in Replay.
  “I use it less now because ChatGPT has remote access and Claude has Dispatch” is the
  author's experience, not a claim that needs to be attributed to Replay or turned into
  a feature comparison.

## What the Raycast Wallpaper extension actually does

- The extension manifest defines exactly two commands:
  **Set Raycast Wallpaper** and **Auto Switch Raycast Wallpaper**
  ([manifest](https://github.com/raycast/extensions/blob/main/extensions/raycast-wallpaper/package.json);
  [Store listing](https://www.raycast.com/koinzhang/raycast-wallpaper)).
- **Set Raycast Wallpaper** browses and applies Raycast’s official catalogue. Its
  “Respect System Appearance” preference only shows entries classified for the current
  system appearance
  ([manifest](https://github.com/raycast/extensions/blob/main/extensions/raycast-wallpaper/package.json);
  [listing hook](https://github.com/raycast/extensions/blob/main/extensions/raycast-wallpaper/src/hooks/hooks.ts)).
- **Auto Switch Raycast Wallpaper** periodically chooses a random non-excluded entry.
  With “Respect System Appearance” enabled, it first filters the catalogue to the
  current light/dark classification
  ([manifest](https://github.com/raycast/extensions/blob/main/extensions/raycast-wallpaper/package.json);
  [auto-switch source](https://github.com/raycast/extensions/blob/main/extensions/raycast-wallpaper/src/auto-switch-raycast-wallpaper.ts)).
- The catalogue classifies `mono_dark_distortion_1` as dark and
  `mono_light_distortion_1` as light. The action panel also lets the user override an
  entry’s classification
  ([appearance map](https://github.com/raycast/extensions/blob/main/extensions/raycast-wallpaper/src/utils/appearance-utils.ts);
  [wallpaper actions](https://github.com/raycast/extensions/blob/main/extensions/raycast-wallpaper/src/components/action-on-raycast-wallpaper.tsx)).
- Therefore the extension does support appearance in a meaningful but different way:
  it filters a browsing/random-rotation pool. The inspected manifest and source do not
  expose a command or preference for assigning one fixed Light wallpaper and one fixed
  Dark wallpaper as a persistent pair. That last statement is an inference from the
  current two-command manifest and implementation, not a claim made by Raycast.

## The two supplied Raycast wallpapers

Raycast’s official wallpaper page lists both files as **6016 × 3388** HEIC downloads:

- [`mono_light_distortion_1.heic`](https://misc-assets.raycast.com/wallpapers/mono_light_distortion_1.heic)
- [`mono_dark_distortion_1.heic`](https://misc-assets.raycast.com/wallpapers/mono_dark_distortion_1.heic)

Source and attribution:
[Raycast Wallpapers](https://www.raycast.com/wallpapers).

Local inspection with macOS `sips` found that the supplied files have the same names,
dimensions, HEIC format, and sRGB profile as expected:

| Local file | Dimensions | Format | Profile |
| --- | ---: | --- | --- |
| `mono_light_distortion_1.heic` | 6016 × 3388 | HEIC | sRGB IEC61966-2.1 |
| `mono_dark_distortion_1.heic` | 6016 × 3388 | HEIC | sRGB IEC61966-2.1 |

The local bytes were not compared with a fresh official download, so this is strong
filename/metadata consistency, not a byte-identity claim.

## Attribution and redistribution caution

- Raycast intentionally provides direct download buttons and says its wallpapers were
  shared for its community to download
  ([wallpaper catalogue](https://www.raycast.com/wallpapers);
  [Raycast’s wallpaper article](https://www.raycast.com/blog/making-a-raycast-wallpaper)).
- Neither the wallpaper catalogue nor the direct HEIC downloads display a separate
  reuse/redistribution license. The Raycast extension repository’s MIT license covers
  the extension source; it should not be presented as a license for the remotely hosted
  wallpaper artwork.
- Raycast’s current Terms of Service say Service Content is for personal use and, unless
  expressly authorized, prohibit copying or distributing it
  ([Terms, “Service Content, Software and Trademarks”](https://www.raycast.com/terms-of-service#service-content-software-and-trademarks)).

Conservative publishing recommendation:

1. Link to the two official HEIC downloads and credit **Raycast Wallpapers**.
2. Do not copy the full-resolution HEIC files into the public blog repository or offer
   them as first-party downloads without explicit permission from Raycast.
3. Use the author’s own Umbra/Raycast screenshots as the article illustrations, with a
   nearby Raycast credit and catalogue link. A screenshot is better editorial evidence
   of the workflow than republishing the raw artwork, but this recommendation is not a
   legal determination.

Attribution is good editorial practice, but attribution alone is not a substitute for a
license to redistribute the original files.

## Suggested article spine

1. Trying Light Mode again exposed a tiny but persistent mismatch: the interface changed
   while the wallpaper did not.
2. Wallpaper is not decoration for the author; it materially changes how macOS feels.
3. Equinox can create the required dynamic asset, but its creation/export workflow and
   broader solar/time features were more machinery than this preference needed.
4. Raycast Wallpaper is excellent for discovering, downloading, and rotating Raycast’s
   catalogue. Its appearance awareness is pool-based rather than pair-based.
5. Umbra’s two-slot Light/Dark model exactly matches the desired outcome.
6. Brief Replay/Echo aside, then finish on the broader point: small, deliberate OS
   choices are part of making a computer feel personal.
