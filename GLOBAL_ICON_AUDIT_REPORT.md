# Global Icon Audit — Krishi Mama Frontend

## Scope and method

Audited every App Router page, shared layout, component, hook, and frontend library module under `app/`, `components/`, `hooks/`, and `lib/`. Scans covered pictographic emoji, common decorative/status glyphs, inline SVG usage, and imports from alternate icon libraries. Then inspected UI glyph matches and preserved content, brand assets, charts, and GIS marker visuals.

### Routes inspected

| Route | Source |
|---|---|
| `/` | `app/page.js` |
| `/login` | `app/login/page.js` |
| `/register` | `app/register/page.js` |
| `/location-onboarding` | `app/location-onboarding/page.js` |
| `/dashboard` | `app/(app)/dashboard/page.js` |
| `/my-farm` | `app/(app)/my-farm/page.js` |
| `/my-farm/new` | `app/(app)/my-farm/new/page.js` |
| `/my-farm/plan` | `app/(app)/my-farm/plan/page.js` |
| `/my-farm/[id]` | `app/(app)/my-farm/[id]/page.js` |
| `/my-farm/[id]/edit` | `app/(app)/my-farm/[id]/edit/page.js` |
| `/assistant` | `app/(app)/assistant/page.js` |
| `/handoff` | `app/(app)/handoff/page.js` |
| `/climate` | `app/(app)/climate/page.js` |
| `/rainfall` | `app/(app)/rainfall/page.js` |
| `/soil-moisture` | `app/(app)/soil-moisture/page.js` |
| `/vegetation` | `app/(app)/vegetation/page.js` |
| `/map` | `app/(app)/map/page.js` |
| `/crop-calendar` | `app/(app)/crop-calendar/page.js` |
| `/data-sources` | `app/(app)/data-sources/page.js` |
| `/settings` | `app/(app)/settings/page.js` |

Shared surfaces inspected include application and public layouts, sidebar and mobile navigation, brand mark, switchers, notification center, auth hero, form inputs, buttons, cards, metric cards, badges, tables, tooltips, empty/loading/error states, charts, GIS map, and provider components.

## Findings and replacements

- `lucide-react` is installed and used throughout the application. No imports from React Icons, Heroicons, Font Awesome, Bootstrap Icons, Iconoir, or Phosphor were found.
- Replaced the completed farm activity date's Unicode `✓` with Lucide `CheckCircle2`.
- Replaced the notification “view farm” text arrow with Lucide `ArrowRight`.
- Replaced the three decorative bullet glyphs in the crop planning summary with small CSS dots, avoiding text glyphs as decoration.
- The earlier responsive/navigation audit replaced two farm activity date `📅` glyphs with Lucide `Calendar`.
- Navigation now has clear active states with route-aware matching. Existing icons remain semantic Lucide icons and decorative icon sizes/strokes use the surrounding component's consistent role sizing.
- Other bullet separators in prose/metadata and crop rotation arrows in the handoff labels are textual separators or meaningful sequence notation, not icon substitutes; they remain text.

## Remaining exceptions

- Google OAuth buttons use the official multicolor Google mark as inline SVG. This is a third-party brand mark, not a UI icon, and should retain its official shape and colors.
- The Krishi Mama logo image is preserved as supplied.
- `components/auth/AuthHeroPanel.js` contains decorative topographic/field-terrace SVG artwork, not an icon.
- `components/map/DistrictGisMap.js` creates inline SVG sensor glyphs (temperature, soil-water layers, and vegetation) inside Leaflet `DivIcon` HTML. These are small, consistent white outline markers required by the Leaflet HTML marker interface. The GIS map and scientific visual encoding were preserved.
- Recharts output and map/GeoJSON visualizations are data graphics, not icon systems.
- The remaining `public/file.svg`, `public/globe.svg`, `public/next.svg`, and `public/vercel.svg` are unused starter assets; no frontend page or component references them. They were left in place.

## Light and dark mode

Reviewed changed icons in both theme contexts: completion status uses explicit emerald light/dark text classes; the notification arrow inherits its theme-aware action link color; the crop summary dots use the semantic `muted` token. Existing semantic theme tokens and page-specific dark variants remain in use. No browser screenshot/interactive theme session was performed, so this is a source-level theme check, not visual browser certification.

## Verification results

- Source scan across `app/`, `components/`, `hooks/`, and `lib/`: **0 pictographic emoji matches** after replacements.
- Alternate icon library import scan: **0 matches**.
- Added `tests/global.icon.audit.test.js`, which checks for emoji in frontend source and alternate icon-library imports.
- `npm test`: **102 passed, 0 failed**.
- `npm run build`: **passed**, all 23 generated route entries completed.
- Focused ESLint on the changed UI files: **blocked by existing `react-hooks/set-state-in-effect` errors** in `NotificationCenter.js` (`refreshUnreadCount()` and `loadNotifications()` invoked from effects). The icon-only changes introduced no additional lint findings.
- No backend/API changes, deploy, commit, or push were performed for this audit.
