# Objective
Transform the application from an AI-generated CRUD interface into mature desktop business software (like Vyapar or Tally) by refining the centralized UI/UX design system.

# Decisions Made
- **Border Radius**: Reduced `density.radius` and `radiusSm` to 2px, and `radiusLg` to 4px in the central theme to eliminate the childish/rounded aesthetic.
- **Density**: Reduced default button heights, table padding (now 4px 8px), and input padding to maximize information density on screen.
- **Typography**: Scaled down oversized `h1` through `h6` font sizes in the theme.
- **Sidebar**: Flattened the sidebar navigation. Removed the floating rounded active state pill and replaced it with a professional, full-width dark background highlight with a left-colored border.
- **Avatars**: Removed the childish colored circular avatars from data tables (Customers page) to emphasize readability and data density.

# Files Modified
- `src/theme/components.js`: Updated radii, paddings, and button/input sizes globally.
- `src/theme/typography.js`: Adjusted heading sizes.
- `src/components/layout/AppShell.jsx`: Redesigned the sidebar branding, active states, and padding.
- `src/features/customers/page.jsx`: Updated the horizontal toolbar for density, removed avatars from the data table.

# Remaining UI Issues
- Several feature pages still need their individual toolbars and spacing audited to fully match the new dense design. (e.g., Invoices, Inventory, Dashboard).
- The `src/theme/palette.js` could use a review of text grays for further contrast improvements across disabled states.
- Modal dialogs (like `CustomerDialog.jsx`) might still have oversized padding or large empty areas.

# Known Risks
- Components that used hardcoded spacing instead of theme `density` tokens might look out of proportion now that the base theme is smaller.

# Next Exact Task
- **Audit `Dashboard`, `Invoices`, and `JobCards` pages** to remove explicit component heights/paddings that clash with the new global density, and remove any remaining circular avatars from data tables.
