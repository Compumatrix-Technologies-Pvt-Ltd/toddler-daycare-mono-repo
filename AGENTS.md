# PROJECT CODING & DESIGN STANDARDS (MANDATORY RULE FILE)

> **CRITICAL RULE FOR ALL AI AGENTS**:
> Any agent modifying or adding code in this repository **MUST READ THIS RULE FILE FIRST** before making any edits.
> You must adhere strictly to every principle documented below on every task.

---

## 1. Modular Component-Based Architecture
- **No Monolithic Files**: Do NOT put entire pages and modals into a single massive file (e.g. 1,000+ line `page.tsx`).
- **Organize in `src/components/`**: Break down features into modular, cohesive, single-responsibility components:
  - `Header.tsx`: Navbar, branding, language switcher, navigation links.
  - `SearchBar.tsx`: Top search matrix, selectors, filter triggers.
  - `ResultsHeader.tsx`: Results summary title and bulk inquiry trigger.
  - `KitaCard.tsx`: Individual daycare card with image, badges, ratings, tags, actions.
  - `KitaList.tsx`: Scrollable list with custom Figma-styled scrollbar.
  - `MapSection.tsx`: Interactive map with custom sun pins and active popup.
  - `KitaDetail.tsx`: Active daycare photo gallery, availability card, other dates, specs.
  - `Footer.tsx`: Footer branding, links, copyright.
  - `modals/EnquiryModal.tsx`: Comprehensive Enquiry Form matching Figma node 183:2021 (Supports "To: This Provider Only", "To: All Map Results", "To: All My Favourites", secure inquiry dispatch).
  - `EnquiryConfirmation.tsx`: Confirmation screen matching Figma node 183:2573 ("5. Enquiry Confirmation Page") displaying Reference ID, Contacted Caretakers, 30-Day Map Visibility, and return actions.
  - `modals/FilterModal.tsx`: Advanced filter options.
  - `modals/ImageGalleryModal.tsx`: High-resolution photo gallery lightbox modal with thumbnail strip, keyboard navigation, and daycare inquiry trigger.
  - `FavoriteCard.tsx`: Individual favorite daycare card matching Figma node 213:1120 with 140x140 thumbnail, saved badge, rating pill, teacher title, address/distance, feature chips, vacancy badge, inquiry button, profile button, and remove action.
  - `CaretakerProfileDrawer.tsx`: Dedicated right-side sliding profile drawer matching Figma node 213:1120 ("6b. Favorites Page - Caretaker View Profile Drawer") with interactive map preview, 3-photo grid, daycare specs, next available card, other dates, and inquiry trigger.
  - `Favorites Page (app/favorites/page.tsx)`: Dedicated route matching Figma node 183:2630 and 213:1120 displaying Guest Session Warning Banner, dynamic session-based favorites synced with `apps/web/src/app/page.tsx`, shortlist clearing, bulk inquiry trigger, profile drawer, and empty states.
- **Strict Typing**: Use dedicated TypeScript interfaces in `src/types/` for all entities (`Kita`, `FilterState`, `Translation`, etc.).

---

## 2. 100% Mobile Responsiveness on Every Page (Mandatory Standard)
- **Mobile First & Responsive Across All Breakpoints**:
  Every single screen, component, modal, sheet, and drawer MUST look stunning, remain fully readable, and operate smoothly across:
  - **Compact Mobile (320px – 390px)**: iPhone SE, compact Android devices.
  - **Standard Mobile (391px – 640px)**: Modern smartphones (iPhone, Pixel, Galaxy).
  - **Tablets & Foldables (641px – 1024px)**: iPads, tablets, narrow split-screen viewports.
  - **Desktops & Wide Displays (1025px+)**: Laptops and large monitors (max container width: `1360px`).

- **Mandatory Mobile UX Patterns**:
  1. **Segmented Mobile View Switcher**:
     - On screens below `1024px` (`< lg`), the interface must provide an intuitive segmented switcher (e.g. `[Liste]` ⟷ `[Karte & Details]`).
     - Tapping a daycare card on mobile automatically switches the active view to `Karte & Details` so users immediately see photos, specs, and next available dates without tedious scrolling.
     - A visible, styled "← Back to List" (`t.results.backToList`) button must always allow effortless return to the list view.
  2. **Touch Targets (Minimum 44x44px)**:
     - All clickable buttons, icon toggles (favorite hearts, hamburger button, language switcher), and interactive links must have a minimum bounding tap area of **44x44px** (or minimum `40px` with generous tap padding) to adhere to WCAG and mobile touch usability standards.
     - Dropdowns and input fields must have a minimum height of `42px` to prevent misclicks on touch screens.
  3. **Zero Horizontal Overflow or Clipping**:
     - Never allow `overflow-x` scrolling on the `body` or main layout.
     - Use `w-full`, flexible grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-12`), and flex wrapping (`flex-wrap`).
     - Truncate long daycare titles or location strings with `truncate` or `line-clamp` so they never stretch parent cards beyond the viewport width.
  4. **Modals & Overlays Ergonomics**:
     - Modals must be vertically centered and scrollable if height is constrained: `max-h-[92vh] overflow-y-auto`.
     - The modal overlay must allow vertical scroll (`overflow-y-auto`) so the modal is never cut off on devices with on-screen software keyboards or in landscape orientation.
     - Modal close buttons must be easily tapable (`w-10 h-10` rounded touch target) with proper `aria-label`.
     - Sticky CTA action buttons inside modals must remain accessible without being obscured.
  5. **Horizontal Swipeable Sub-carousels**:
     - Horizontal pill groups (such as "Other Dates" in daycare details) must use `overflow-x-auto pb-1.5 scrollbar-none` on mobile, allowing silky smooth finger swiping while wrapping comfortably on desktop.
  6. **Map Section Responsiveness**:
     - Map container scales gracefully: `h-[220px]` on compact screens, `h-[280px]` on tablets, `h-[300px]` on desktop.
     - Active map pin tooltips must stay within viewport bounds (`max-w-[190px] sm:max-w-[220px]`).

---

## 3. 100% Browser Zoom & Desktop Sizing Standard (Mandatory Rule)
- **Proper View on 100% Zoom (1024px – 1440px Viewports)**:
  All screens, components, panels, headers, and KPI cards MUST look balanced, properly proportioned, and never feel blown up, squished, or forced offscreen at standard **100% browser zoom** (specifically on 1366x768 and 1080p displays with 125%/150% Windows scaling).
- **Header & Navigation Sizing**:
  - **No Awkward Wrapping**: All header navigation items, locked status badges, and brand subtitles MUST use `whitespace-nowrap` and `shrink-0` to prevent labels from breaking into multiple lines or colliding with buttons.
  - **Compact Header Height**: Use `px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3` (avoid `px-12 py-4` which consumes excessive horizontal and vertical space).
  - **Nav Spacing**: Desktop nav links use `gap-3 xl:gap-6 text-[13px] xl:text-[14px]`.
  - **Action Pills**: Language switchers and profile pills must have compact heights (`min-h-[36px] sm:min-h-[40px]`) and scaled text (`text-[13px] xl:text-[14px]`).
- **Main Container Spacing**:
  - Container padding: `py-4 sm:py-6 space-y-4 sm:space-y-5` with `max-w-[1360px]` (or `max-w-[1240px]` for profiles/forms). Never use `py-10 sm:py-12 space-y-8` which forces needless vertical scrolling.
- **Flexbox Layouts & `min-w-0` Rule**:
  - On two-column desktop layouts (e.g. Gantt Calendar + Booking Details, or List + Map):
    - Always add `min-w-0` to the primary flexible child (`flex-1 min-w-0`) to prevent internal scrollable tables or divs from blowing out the flex layout.
    - Side panels (such as `BookingDetailsPanel`) must be responsive: `w-full lg:w-[320px] xl:w-[350px] shrink-0` (avoid hardcoded `376px+` widths that crush the main content).
- **Card & Component Scale**:
  - **KPI & Stat Overview Cards**: `p-3 sm:p-3.5 lg:p-4 rounded-xl`, titles `text-[10px] sm:text-[11px] font-bold uppercase`, metrics `text-[18px] sm:text-[20px] xl:text-[22px] font-bold`, margins `my-1 sm:my-1.5`.
  - **Toolbar Controls & Buttons**: Heights of `h-7.5 sm:h-8 px-2.5 sm:px-3 text-xs` for action buttons (Baseline, Auto Schedule AI, Export, Fullscreen).

---

## 4. SVG Icon Standards (Figma & Free SVG Sources)
- **Always Use SVG Icons**: Never use raster images (PNG, JPG) or generic text placeholders for icons or UI indicators.
- **Primary Source: Downloaded directly from Figma**:
  - Extract and use exact vector SVG code from Figma design nodes (`viewBox`, `path`, `stroke`, `fill`, `strokeWidth`, `strokeLinecap`, `strokeLinejoin`).
- **Alternative Source: Free SVG Icon Libraries**:
  - If a particular icon is missing from Figma or a new UI action is needed, use free, clean vector SVGs from reputable icon libraries (e.g. **Lucide Icons**, **Heroicons**, **Feather Icons**, or **SVG Repo** for free downloads).
- **Implementation Standards**:
  - Implement as clean, inline `<svg>` elements with `currentColor` (or Figma design token colors) so they effortlessly respond to hover states, theme changes, and dark/light accents.
  - Scale icons consistently: `w-3.5 h-3.5` for micro-badges, `w-4 h-4` for standard buttons/links, `w-5 h-5` for tabs/navigation, and `w-7 h-7` to `w-8 h-8` for feature/stat headers.
  - Always include accessible titles or `aria-label` / `aria-hidden="true"` where appropriate.

---

## 5. Multi-Language Support (German & English) - Zero Hardcoded Strings
- **No Hardcoded Strings in UI**: Every single piece of user-facing text (labels, buttons, placeholders, badges, tags, modal copy, error messages, footer links) MUST be loaded from the centralized translation system in `@repo/shared` (`packages/shared/src/i18n/`).
- **Supported Languages**:
  1. **German (`de`)**: In `packages/shared/src/i18n/de.ts` matching original German Figma designs (Kindertagespflege, Freie Plätze, etc.).
  2. **English (`en`)**: In `packages/shared/src/i18n/en.ts` with complete, natural English translations (Toddler Daycare Search, Available Spots, Send Inquiry, etc.).
- **Language Switcher**: Provide a visible, elegant language toggle in the header (`DE` | `EN`) with flag indicators (`🇩🇪 DE` | `🇬🇧 EN`) that instantly switches the entire application without page reload.
- **Persistent Selection**: Language preference is stored in state/localStorage.

---

## 6. Proper Typography & Exact Figma Styling
- **Typography**:
  - Headings: `Plus Jakarta Sans` (font weights: 600, 700, 800)
  - Body & UI: `DM Sans` (font weights: 400, 500, 600)
  - Exact font sizes and line heights from Figma (`text-[17px]`, `text-[11px]`, etc.)
- **Figma Color Tokens**:
  - Primary Background: `#FAF7F2` (warm cream)
  - Main Cards: `#FFFFFF` with `#E5DDD2` subtle border
  - Primary Accent (CTA Buttons): `#A12D3A` (crimson/wine red), hover `#88222E`
  - Secondary Accent (Bulk Actions): `#F3A712` / `#EAA000` (golden amber)
  - Dark Headings / Text: `#1E1B18`
  - Muted Subtitles: `#7A6E62`
  - Vacancy Mint Green: `#F0FDF4` container, `#16A34A` / `#15803D` text & dot
  - Rating Badge: `#FEF3C7` background with `#78350F` text
  - Custom Scrollbar: `#855C1B` thumb, `#F3ECE2` track
  - Footer Background: `#E9E4DC` with `#DED7CB` border

---

## 7. Clean Code & Build Verification
- Always test and verify with `pnpm build` before completing a task.
- Zero TypeScript errors, zero ESLint warnings, and zero broken image paths.

---

## 8. Node.js Express Backend Architecture & API Contract (Mandatory Standard)
- **Unified Node.js Express REST Backend**:
  - The application backend is powered by **Node.js + Express** (`apps/backend` utilizing modular Express router architecture).
  - Both client applications — **`apps/web`** (public family search, daycare booking, and caretaker portal) and **`apps/admin`** (administrative control, caretaker verification, work permit approval, and platform governance) — are built to integrate seamlessly with this Node.js Express REST API backend.
- **Contract & Integration Standards for AI Agents**:
  1. **RESTful API Conventions**:
     - Follow standard REST API resource routes using modular Express routers (`/api/v1/...`):
       - `GET /api/v1/...` for queries with standard pagination (`page`, `per_page`, `sort`, `filter`).
       - `POST /api/v1/...` for resource creation (with `Accept: application/json` and `Content-Type: application/json`).
       - `PUT` / `PATCH /api/v1/...` for updates.
       - `DELETE /api/v1/...` for deletions.
     - API response structure:
       - Success envelope: `{ "data": ..., "meta": { "current_page": 1, "last_page": ..., "total": ... } }`.
       - Validation error envelope (HTTP 422 / 400): `{ "message": "The given data was invalid.", "errors": { "field_name": ["Specific error message"] } }`.
  2. **Authentication & Session Tokens**:
     - Use `Authorization: Bearer <token>` or secure HTTP-only cookie sessions for authenticated requests.
     - Differentiate permissions between Admin roles (`admin:access`, permit approval, platform settings) and Caretaker/Parent roles using shared constants and RBAC from `@repo/shared`.
  3. **Centralized Schemas & Endpoints in `@repo/shared`**:
     - All shared endpoints (`packages/shared/src/constants/api-routes.ts`), permissions (`permissions.ts`), types (`types/`), and Zod schemas (`schemas/`) must mirror the Express API route handlers, data models, and request validations to ensure 100% type safety and zero contract drift.
  4. **Resilient Data Layer & Mock Fallbacks**:
     - Use `@tanstack/react-query` / Axios / `fetch` for server-state caching, optimistic updates, and error handling.
     - Maintain comprehensive mock fixtures and seeded route handlers mirroring JSON resources so UI screens in both `apps/web` and `apps/admin` remain fully testable, demonstrable, and interactive during development.

