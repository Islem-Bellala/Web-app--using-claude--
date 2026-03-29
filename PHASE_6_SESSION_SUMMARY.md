# Phase 6 Session Summary
> Executed: 2026-03-29

---

## Tasks Completed

### 6A — Tailwind Setup + Branding Rename ✅

**Tailwind v4 infrastructure:**
- Installed `tailwindcss@4.2.2`, `@tailwindcss/postcss`, `@tailwindcss/forms`, `postcss`, `autoprefixer`
- Created `frontend/postcss.config.js` with `@tailwindcss/postcss` plugin
- Created `frontend/src/styles/globals.css` with:
  - `@import "tailwindcss"` (Tailwind v4, no config file needed)
  - `@variant dark (&:where(.dark, .dark *))` for class-based dark mode
  - `@theme` block with `--color-bunyan-*` tokens mapped to current design colors (LIGHT/DARK from AppColors)
  - Base styles: box-sizing, fixed viewport heights on html/body/#root, scrollbar styling
- Updated `frontend/src/main.tsx` to import `./styles/globals.css`

**Dark mode wiring:**
- Updated `frontend/src/stores/uiStore.ts` to:
  - Apply/remove `.dark` class on `document.documentElement` on every toggle
  - Persist theme choice to `localStorage` key `bunyan-theme`
  - Read from localStorage on module init (synchronous, before React renders)

**Branding — 0 StructCalc remaining:**
- `frontend/index.html`: page title → `Bunyan`
- `frontend/src/App.tsx`: sidebar → `بنيان Bunyan`
- `frontend/src/components/auth/LoginPage.tsx`: login title → `بنيان Bunyan`
- `frontend/src/components/general/ProjectParams.tsx`: page header → `BUNYAN — PARAMÈTRES`
- Comments updated in SpectrumChart, BaseShearPage, index.css

---

### 6B — Fixed Viewport + Layout Components + Kill Zoom ✅

**New files:**
- `frontend/src/theme.ts` — shared `DARK`/`LIGHT` AppColors constants + `getColors(isDark)` helper
- `frontend/src/components/layout/Sidebar.tsx` — standalone sidebar reading from `useUIStore` + `useAuthStore`; all 4 nav groups; bottom logout/theme toggle
- `frontend/src/components/layout/Topbar.tsx` — 48px topbar: logo left, project name center, save/theme/avatar/logout right
- `frontend/src/components/layout/Layout.tsx` — fixed viewport shell: `100vh × 100vw overflow-hidden` → Topbar + [Sidebar + scrollable main]

**App.tsx simplified:** 263 → 29 lines (auth gate only)

**zoom: check:** No `zoom:` properties existed in the codebase (already clean).

**Layout structure:**
```
html/body/#root — height:100%, overflow:hidden (via globals.css)
Layout — height:100vh, width:100vw, overflow:hidden, flex-column
  Topbar — height:48px, flexShrink:0
  body-row — flex:1, overflow:hidden, flex-row
    Sidebar — width:220px, flexShrink:0, height:100%
    main — flex:1, overflowY:auto  ← ONLY scroll area
```

---

### 6C — ProjectParams Two-Row Layout ✅

**New layout:**
```
Page header (flexShrink:0)
Body (flex:1, flex-column, overflow:hidden)
  ROW 1 (flex:0 0 58%, flex-row, 3 cols)
    Col 1 — 210px  — Identification (name, engineer, ref, date)
    Col 2 — 250px  — Paramètres sismiques (wilaya→zone, site, group, QF, R, CT)
    Col 3 — flex:1 — Géométrie et masses (stories table, W, hn)
  ROW 2 (flex:1, full width)
    Left 320px — Tx/Ty/Vxd/Vyd 2×2 grid + status checklist
    Right flex:1 — drx/dry displacement table (scrolls internally)
```

**Key fixes:**
- Outer container: `height: 100%` + `overflow: hidden` (was `minHeight: 100vh`)
- Each column card has `overflowY: auto` (scrolls independently)
- Displacement table scrolls internally
- Accessibility: added `title` attributes to all unlabelled `<select>` and story `<input>` elements

---

### 6D — Dark Mode Polish + Final Cleanup ✅

**Dark mode verification:**
- All components use `c: AppColors` (computed from DARK/LIGHT constants in theme.ts) for all colors
- `html.dark` class correctly toggles via uiStore
- Theme persists across page refreshes via localStorage
- Anti-flash script added to `<head>` in index.html (reads localStorage, applies `.dark` class synchronously before React loads)

**Fixes:**
- `Layout.tsx` ComingSoon: replaced hardcoded `'#94a3b8'` with `c.textMuted`
- No other hardcoded non-white colors found in components

**Cleanup:**
- Deleted orphaned `frontend/src/index.css` (no longer imported after globals.css)
- Fixed `index.html` script src: `main.jsx` → `main.tsx`

---

## Final Verification

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Clean |
| `npx tsc --noEmit` | ✅ 0 errors |
| `grep -ri "structcalc"` | ✅ 0 results |
| `grep -r "zoom:"` | ✅ 0 results |
| Backend tests | ✅ 73/73 passed |
| App.tsx lines | ✅ 29 lines |

---

## Architecture Rules Applied (Phase 6)

1. ✅ Fixed viewport: `h-screen w-screen overflow-hidden` on root
2. ✅ Only main content area scrolls (+ individual columns in ProjectParams)
3. ✅ No `zoom:` hacks anywhere
4. ✅ Current visual identity kept (same colors, same feel)
5. ✅ Tailwind v4 infrastructure in place; inline styles coexist
6. ✅ Dark mode via `.dark` class on `<html>` + Tailwind `@variant dark`
7. ✅ French UI text, English code
8. ✅ Component behavior unchanged
9. ✅ `بنيان Bunyan` branding everywhere, no `StructCalc` remaining
