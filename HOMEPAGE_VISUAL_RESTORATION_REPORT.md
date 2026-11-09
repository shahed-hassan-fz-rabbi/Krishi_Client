# Homepage Visual Restoration Report

## Hero image and preservation

- Recovered the exact committed image from Git commit `e24de81` (`public/images/hero.jpeg`, 722,637 bytes; Git blob `ba33bc267d6e3b2a61a9be6a19fe2a4dd4bb794f`) and restored it at the existing path.
- The recovered image visibly contains repeated Vecteezy watermarks. The user explicitly chose to keep this exact original after the watermark was disclosed. It was not edited or replaced.
- The hero content, wording, CTA labels, and overall placement remain. The image now renders through `next/image` with `fill`, `sizes="100vw"`, and preload, retaining `object-cover` placement.
- **Hero button root cause:** the shared button defaults to `primary` (`bg-emerald text-white`), while the hero supplied conflicting `bg-white text-forest` classes. Tailwind utility ordering meant the label color could resolve to white against the white button. Added dedicated `hero` and `heroOutline` variants with one unambiguous foreground/background pair and visible focus rings.
- **Overlay root cause:** the gradient overlay was a sibling rendered before the image, so the image painted over it. Placed the same gradient above the image and reduced its opacity slightly to show more of the field while keeping white hero copy readable.

## Homepage improvements

- Fixed feature and workflow translation lookups that passed bare keys instead of the `landing.*` namespace; browser accessibility text had shown raw keys such as `featureRainfall` and `step1Title`.
- Workflow step numbers now localize in Bangla.
- Kept the corrected NASA POWER description precise: daily gridded climate data includes meteorological reanalysis and satellite-derived solar parameters. Clarified planned SMAP coverage as near-surface soil moisture at satellite-grid scale; GPM and MODIS remain marked planned. MODIS is described as NDVI/EVI indices, not disease diagnosis.
- Aligned Bangla evidence text with English: current historical climate summaries are descriptive and crop-specific recommendations are not currently available.
- Fixed footer feature destinations to the existing Climate, Rainfall, Soil Moisture, and Vegetation routes.
- Added expanded/collapsed and controlled-navigation semantics to the mobile menu and localized its accessible label.
- Removed the extra footer top margin after the About section, which already had generous bottom padding.
- Reviewed Features, How It Works, Data Sources, About, supported districts, public navigation, and footer. No sections were removed and no unsupported statistics, testimonials, or partnerships were added.

## Theme and responsive review

- Hero CTA variants have fixed white/forest contrast and white focus rings over the forest overlay, independent of global Light/Dark content tokens.
- Non-hero sections continue using semantic surface, text, and border tokens; the content grids and footer retain their responsive breakpoints.
- Source-level checks covered desktop/tablet/mobile CSS behavior and Light/Dark classes. The requested viewport-by-viewport visual check could not be completed: local browser use is disabled in Work settings, and native browser screenshot capture timed out. No browser visual pass is claimed.
- Browser accessibility text was available and exposed the missing translation namespace; that issue was fixed. No screenshot evidence is available.

## Files changed for this task

- `app/page.js`
- `components/ui/Button.js`
- `components/layout/PublicChrome.js`
- `lib/i18n/translations.js`
- `tests/auth.ui.alignment.test.js` (updated its now-obsolete assertion that the hero image must be absent, consistent with the user's explicit restore decision)
- `tests/home.page.audit.test.js`
- `public/images/hero.jpeg` (restored byte-for-byte from Git)

## Verification

- Client tests: **107 passed, 0 failed**.
- Production build: **passed**, with 23 route entries generated.
- Focused ESLint on homepage, button, public chrome, and related tests: **passed, 0 errors and 0 warnings**.
- The original image was visually inspected and its watermark disclosed before the user selected keeping it.
- No backend/API, environment, deployment, commit, or push changes were made.

## Remaining issue

- The requested visual viewport/theme/language matrix still requires a browser session. The exact original asset is watermarked by Vecteezy; a clean licensed original would remove that visual limitation, but no substitute has been used.
