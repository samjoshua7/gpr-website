# GPR PRINTERS WEBAPP — PRE-PUBLICATION STOREFRONT POLISH

## MOBILE-FIRST HERO, PRODUCT GALLERY, NAVIGATION & CATALOG UX FIXES

You are working on the EXISTING GPR Printers WebApp.

Current general stack/context:
- React
- Vite
- Supabase
- Vercel
- Existing Admin Portal
- Existing customer-facing storefront

The storefront is now close to public release.

This task is a POLISHING + BUG-FIX + MOBILE UX pass on the existing implementation.

DO NOT rebuild the storefront.
DO NOT replace working architecture unnecessarily.
DO NOT create duplicate systems where equivalent functionality already exists.
DO NOT assume component names, table names, routes, state libraries, carousel libraries, or database structures without inspecting the repository first.

The current source code and Supabase schema are the authority.


# 1. PRIMARY PRIORITY — MOBILE FIRST

IMPORTANT:

The majority of GPR's storefront customers are expected to browse and order using MOBILE PHONES.

Desktop remains supported, but for ALL changes in this task:

MOBILE UX IS THE PRIMARY DESIGN TARGET.

Every implementation decision involving:
- navigation
- hamburger menus
- search
- filters
- carousels
- product images
- sticky elements
- scrolling
- touch targets
- responsive spacing
- breadcrumbs
- product cards

must be tested and optimized for mobile first.

Do not simply shrink the desktop UI.


# 2. MANDATORY INSPECTION BEFORE CHANGING CODE

Before implementation, inspect the current codebase and identify:

1. Storefront header/navigation implementation.
2. Mobile hamburger/menu implementation.
3. Hero carousel component.
4. Hero Admin Management page.
5. Hero banner database/schema/configuration.
6. Product card component(s).
7. Product detail page.
8. Product image/gallery architecture.
9. Catalog page.
10. Search/filter implementation.
11. Catalog sidebar implementation.
12. Routing/navigation implementation.
13. Scroll restoration/scroll-position behavior.
14. Existing responsive breakpoints/layout patterns.
15. Current data-fetching and caching patterns.
16. Current product-image storage/data model.
17. Whether any carousel/slider library is already installed.
18. Whether product images already support multiple records/images.
19. Existing Supabase migrations/RLS relating to affected data.

Also reproduce the reported problems BEFORE fixing them.

Do not guess their causes.

After inspection, produce a concise implementation plan.

If the changes can be implemented safely within the existing architecture, proceed.

If a DATABASE SCHEMA, RLS, AUTHORIZATION, or destructive architectural change is required, STOP before applying that specific change and explain:
- why it is necessary,
- what will change,
- migration impact,
- RLS/security impact,
- backward compatibility.

Do not silently modify production-sensitive database architecture.


# 3. HERO CAROUSEL — REMOVE ARROWS AND DOTS

## Current requirement

The customer-facing hero currently contains previous/next controls such as:

<
>

and indicator dots such as:

● ● ●

Remove these customer-facing navigation controls.

Replace them with a clean TIME/PROGRESS INDICATOR positioned near the bottom of the hero.


## Intended interaction

Conceptually:

━━━━━━━━━━━━━━━━━━

The active slide should have a horizontal progress bar.

The progress should animate:

LEFT → RIGHT

over the configured display duration.

When the progress reaches 100%:

1. Move to the next hero banner.
2. Reset progress.
3. Start the next banner's timer.
4. Continue cycling through active banners.

After the final banner, continue according to the existing carousel looping behavior unless inspection shows a reason not to.


## IMPORTANT

Do not fake this using an animation whose duration differs from the actual carousel timer.

The visual progress indicator and slide transition MUST use the same effective duration/source of truth so they cannot drift apart.


# 4. HERO PROGRESS UI

Keep the progress UI minimal and appropriate for mobile.

If multiple banners exist, use a clean segmented progress treatment if it fits the existing design.

Example concept:

━━━  ━━━  ━━━

where:
- completed slides can appear completed,
- current slide visibly progresses,
- upcoming slides remain unfilled.

Do not introduce large controls that obscure the banner.

Requirements:
- mobile friendly
- responsive width
- minimal vertical space
- visually integrated with existing GPR theme
- no layout shift
- no overlapping banner content
- accessible where appropriate

If only one active banner exists, do not render unnecessary carousel navigation/progress UI unless it adds value.


# 5. HERO AUTO-SWITCH DURATION — ADMIN CONTROL

First inspect the existing hero carousel and determine its CURRENT auto-switch duration.

Do not invent or silently replace the current value.

Add an appropriate admin control on the EXISTING Hero Banner Management page so the carousel timing can be configured without editing source code.


## Desired admin field

Example:

Auto-slide duration
[ 5 ] seconds

or another UI consistent with the existing Admin Portal.

The exact storage architecture should follow the existing hero configuration architecture.


## Requirements

- Clearly label the setting.
- Show the current configured/default duration.
- Validate the input.
- Prevent unreasonable values.
- Persist the setting using the existing architecture.
- Store/use a sensible unit consistently (seconds or milliseconds).
- Customer storefront must consume this setting.
- Progress animation must use the same duration.
- Avoid a database request every time a slide changes.
- Existing banners must continue working after this change.

If timing is currently hardcoded and no appropriate hero settings model exists, inspect the architecture and choose the smallest maintainable solution.

Do NOT create a large generic settings/CMS system solely for one field.

Document the previous duration and the resulting implementation in the final report.


# 6. PRODUCT DETAIL PAGE — WRONG INITIAL SCROLL POSITION

Reported reproducible example:

/products/promise-verse-sticker

When this product detail route is opened, the page sometimes/consistently lands near the BOTTOM rather than the TOP.

The customer must manually scroll upward.

This is incorrect.


## Required behavior

When navigating from another storefront page INTO A NEW PRODUCT DETAIL PAGE:

the customer should begin at the intended top of the product detail content.

Investigate the actual cause first.

Potential areas to inspect include, but are not limited to:
- router scroll restoration
- preserved browser scroll position
- shared layout scroll container
- route transitions
- focus behavior
- image/gallery effects
- anchor/hash behavior
- component lifecycle
- reused page containers

Do NOT assume that adding:

window.scrollTo(0, 0)

somewhere globally is automatically the correct fix.

Avoid breaking desirable browser behavior such as returning to the user's previous catalog position when using Back, if the current architecture supports that.

Test:
Catalog → Product A
Catalog → Promise Verse Sticker
Product A → Product B
browser Back
direct product URL load
mobile navigation


# 7. PRODUCT DETAIL MOBILE HAMBURGER MENU BUG

Reported context:

The hamburger/navigation works on previous storefront pages but does NOT work correctly on product detail pages.

Example product route:

/products/promise-verse-sticker

Breadcrumb context resembles:

Home
>
Catalog
>
Christmas & New Year 2027
>
Promise Verse Sticker


## Required investigation

Compare the working header/menu on:
- Homepage
- Catalog

against:
- Product Detail

Identify why the hamburger becomes non-functional specifically in the product-detail context.

Check actual implementation for:
- duplicate headers
- incorrect stacking context / z-index
- invisible overlay intercepting touches
- pointer-events
- event propagation
- layout positioning
- stale menu state
- route-specific header differences
- product gallery overlays
- breadcrumb layering
- fixed/sticky elements
- mobile drawer mounting
- scroll locking

Do not patch the symptom with arbitrary z-index values without identifying the cause.


## Required result

The SAME storefront mobile navigation experience should work consistently across:
- Homepage
- Catalog
- Product details
- other customer-facing storefront routes

Test actual TOUCH/CLICK behavior at mobile widths.

Opening, closing, navigation and overlay dismissal must all work.


# 8. MULTIPLE PRODUCT IMAGES — UP TO 5 IMAGES

IMPORTANT BUSINESS REQUIREMENT:

A product does NOT necessarily have only one image.

A product may contain:

1 to 5 product images.

First inspect the existing product image architecture.

Determine whether:
- multiple images already exist in Supabase/data,
- there is an existing product_images relationship,
- images are stored as an array,
- admin management already supports multiple images,
- or the storefront is simply rendering only the first image.

REUSE existing functionality where possible.

Do not create a duplicate gallery model.


# 9. PRODUCT DETAIL IMAGE GALLERY

On the product detail page, display all available product images in a mobile-friendly gallery/carousel.

Requirements:
- Up to 5 images.
- Swipe/drag interaction on touch devices where appropriate.
- Clear indication when multiple images exist.
- Smooth transitions.
- Correct aspect ratio.
- No stretched/compressed artwork.
- No major layout shift while images load.
- Avoid giant image heights on phones.
- Graceful behavior for only one image.
- Appropriate image loading strategy.
- Preserve image quality.

Do not auto-scroll product-detail images so aggressively that a customer cannot inspect an image.

If the existing project already has a suitable carousel implementation, reuse it instead of adding another dependency.


# 10. PRODUCT CARDS — MULTIPLE IMAGE SLIDES

Product images should NOT be limited to the detail page.

Where customer-facing PRODUCT CARDS are used, support the available product images appropriately.

This includes relevant locations such as:
- Homepage Featured Products
- Catalog
- Category/product listings
- Other reusable storefront product-card locations

IMPORTANT:

First inspect whether these views share the same ProductCard component.

If so, implement the behavior centrally where practical rather than duplicating logic.


## Card behavior

For products with multiple images, provide a subtle way to cycle/show those images.

Because the site is MOBILE FIRST:
- Do not depend on hover.
- Support touch/swipe if appropriate.
- Keep controls minimal.
- Do not clutter small cards with large arrows.
- Do not make accidental horizontal swipes trigger unwanted navigation.

If automatic card-image rotation is considered, ensure it does NOT result in dozens of independently running timers causing performance problems.

Choose a lightweight approach based on the existing architecture.

For products with one image:
render them normally without unnecessary gallery controls.


# 11. PRODUCT IMAGE PERFORMANCE

This is important because several product cards may appear simultaneously.

Do NOT:
- preload every full-resolution gallery image for every product immediately,
- introduce one heavy carousel instance per card without evaluating performance,
- fetch images individually with excessive requests if data can be queried efficiently,
- cause continuous re-renders across the catalog.

Use the project's existing image optimization/lazy-loading patterns where available.

The first product image should remain the primary/initial image.


# 12. CATALOG SEARCH + FILTER CONTROLS DISAPPEAR WHILE SCROLLING

Current problem:

On the catalog page, the search bar and filter-selection controls scroll away.

The existing LEFT filter/sidebar remains available differently.

The customer needs quick access to search/filtering while browsing products.


## Desktop

Inspect the current catalog layout first.

Preferred direction:

LEFT SIDEBAR
- Categories
- Subcategories
- Other real filters
- Filter selections / clear controls where appropriate

MAIN CONTENT
- Compact search/sort/results toolbar
- Product grid

Keep important filtering/search functionality accessible while scrolling.

Prefer appropriate CSS sticky positioning inside the existing layout rather than arbitrary fixed positioning.

Account for:
- storefront header height
- stacking context
- footer
- long filter lists
- viewport height
- no horizontal overflow


# 13. CATALOG — MOBILE UX IS DIFFERENT

DO NOT simply make a permanent desktop left sidebar appear on a phone.

For mobile, prioritize product browsing space.

Use the most appropriate existing responsive pattern, such as:

[ Search products... ]
[ Filters ] [ Sort ]

The exact design should follow existing components and styling.


## Mobile requirements

Search should remain conveniently accessible while browsing.

If appropriate, use a compact sticky search/filter toolbar beneath the main storefront header.

The toolbar must NOT consume an excessive portion of the screen.

Filters should open through the existing/best responsive pattern:
- drawer,
- sheet,
- collapsible panel,
or equivalent.

Requirements:
- easy one-handed use
- clear close button
- clear/reset filters
- selected-filter indication/count if useful
- state preserved after closing
- no horizontal overflow
- no background scroll bugs
- no controls hidden under browser/header UI
- touch targets appropriately sized
- products remain visible quickly


# 14. MOBILE BREADCRUMBS

Review the product-detail breadcrumb because long paths such as:

Home > Catalog > Christmas & New Year 2027 > Promise Verse Sticker

can become problematic on narrow screens.

Do not allow breadcrumbs to:
- force horizontal page overflow,
- cover header controls,
- interfere with hamburger interactions,
- create huge multi-line blocks.

Use an appropriate responsive treatment while preserving useful navigation.


# 15. SCROLL / STICKY INTERACTION AUDIT

Because this task modifies several scrolling/sticky components, verify their interaction together.

On mobile there may be:
- Main storefront header
- Search/filter toolbar
- Hero progress UI
- Product gallery
- Breadcrumbs
- Filter drawer

Ensure they do not fight for z-index or screen space.

Avoid:
- nested unnecessary scroll containers
- body-scroll lock remaining active after closing menus
- double scrollbars
- sticky elements covering content
- sticky toolbar covering anchors/page headings
- accidental horizontal scrolling


# 16. ACCESSIBILITY / TOUCH UX

For all modified customer-facing UI:

- Touch targets should be comfortably tappable.
- Interactive controls need appropriate accessible labels.
- Images require meaningful existing alt text/fallback behavior where supported.
- Keyboard behavior should remain usable on desktop.
- Focus should not become trapped after closing menus/drawers.
- Avoid inaccessible gesture-only functionality where a reasonable alternative is required.
- Respect reduced-motion preferences where practical for automatic animations.

For hero auto-rotation, inspect the current accessibility behavior and avoid making it worse.


# 17. DO NOT CHANGE UNRELATED FUNCTIONALITY

This task is NOT permission to redesign:
- checkout
- pricing
- GST
- authentication
- customer accounts
- order creation
- ERP modules
- admin navigation
- unrelated product schema
- GPR branding

Preserve existing functionality.

Do not make broad refactors merely because a different architecture looks cleaner.


# 18. PERFORMANCE REQUIREMENTS

This storefront is about to become public.

Do not introduce avoidable regressions.

Pay particular attention to:
- multiple product images
- product-card galleries
- hero progress animation
- hero timer
- catalog sticky controls
- mobile drawers
- scroll listeners
- unnecessary React re-renders
- duplicate Supabase requests

Prefer CSS-based animation where appropriate.

Avoid continuously updating React state every few milliseconds merely to animate a progress bar if CSS can safely represent the same timer.

Do not add a new dependency unless the existing stack genuinely lacks the required capability.


# 19. RESPONSIVE TEST MATRIX

Do not validate this only at desktop width.

Test representative widths, including approximately:

Mobile:
- 320px
- 360px
- 375px
- 390px
- 430px

Tablet:
- 768px

Desktop:
- 1024px+
- typical larger desktop width

Use the project's existing breakpoints where applicable rather than creating arbitrary conflicting breakpoints.


# 20. REQUIRED FUNCTIONAL TESTING

## Hero

Verify:
- Previous/next arrows removed.
- Dot indicators removed.
- Progress/timing indicators render correctly.
- Progress fills left → right.
- Progress duration matches actual slide duration.
- Slide changes at completion.
- Loop behavior works.
- One-banner case works.
- Mobile rendering works.
- Desktop rendering works.
- Admin can view/change duration.
- Saved duration survives refresh.
- Invalid duration is rejected/handled.


## Product detail scroll

Verify:
- Direct URL starts correctly.
- Catalog → Product starts correctly.
- Product → Product starts correctly.
- Promise Verse Sticker no longer opens at bottom.
- Browser Back behavior remains sensible.


## Mobile navigation

Verify:
- Homepage hamburger.
- Catalog hamburger.
- Product detail hamburger.
- Open.
- Close.
- Tap navigation.
- Overlay dismissal.
- Scroll lock release.
- No invisible layer intercepts taps.


## Product images

Verify:
- 1 image.
- 2 images.
- 5 images.
- Detail gallery.
- Product cards.
- Mobile swipe/touch.
- Desktop interaction.
- Missing/broken image fallback if existing system supports it.
- No distortion.


## Catalog

Verify:
- Search works.
- Filters work.
- Search/filter access remains convenient while scrolling.
- Desktop sidebar behavior.
- Mobile filter UI.
- Filter state preservation.
- Reset filters.
- Sort if currently supported.
- No unwanted horizontal scrollbar.


# 21. REGRESSION TESTING

After implementation verify:

- Homepage loads.
- Hero works.
- Catalog loads.
- Category filtering works.
- Product detail routes work.
- Product cards navigate correctly.
- Header navigation works.
- Mobile hamburger works.
- Admin Portal still works.
- Hero Management still works.
- Product Management still works.
- Authentication remains functional.
- Existing Supabase RLS/security is not weakened.
- Existing product data remains compatible.
- Vite production build succeeds.
- No new console errors.
- No missing imports.
- No undefined variables.
- No obvious mobile overflow.


# 22. REQUIRED IMPLEMENTATION REPORT

After completing the safe changes, report:

1. Root cause of the Promise Verse Sticker scroll-position bug.
2. Root cause of the product-detail hamburger bug.
3. Previous hero auto-slide duration.
4. How hero duration is now configured.
5. How hero progress timing stays synchronized.
6. Existing product-image architecture discovered.
7. How 1–5 images are handled.
8. Product-card image behavior.
9. Product-detail gallery behavior.
10. Catalog desktop sticky behavior.
11. Catalog mobile search/filter behavior.
12. Files modified.
13. Files created.
14. Database/schema changes, if any.
15. Supabase migration changes, if any.
16. RLS/security changes, if any.
17. New dependencies, if any, and why they were necessary.
18. Responsive testing performed.
19. Functional testing performed.
20. Production build result.
21. Remaining limitations/issues.

DO NOT claim testing that was not actually performed.


# 23. FINAL PRIORITY ORDER

Implement/debug in this order:

1. Inspect/reproduce existing behavior.
2. Fix product-detail initial scroll position.
3. Fix product-detail mobile hamburger/navigation.
4. Implement hero progress/timer UI.
5. Add safe admin control for hero slide duration.
6. Implement/reuse 1–5 product image gallery support.
7. Apply multi-image behavior to reusable product cards.
8. Improve catalog sticky search/filter UX.
9. Perform dedicated mobile UX polish.
10. Regression test.
11. Run production build.
12. Report exact changes and findings.


# FINAL INSTRUCTION

This is the FINAL POLISHING STAGE before making the GPR customer storefront public.

Treat stability as more important than unnecessary refactoring.

Inspect first.
Reuse existing architecture.
Fix root causes rather than symptoms.
Optimize customer-facing behavior MOBILE FIRST.
Do not invent database structures or business logic.
Do not weaken security.
Do not disturb working ERP/Admin functionality.
Do not claim success without testing.

Proceed carefully with the existing GPR design and architecture.