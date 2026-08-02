// Material UI custom shadow scale (25 levels)
export const shadows = [
  'none',
  // 1: Subtle resting card
  '0px 1px 3px 0px rgba(15, 23, 42, 0.04), 0px 1px 2px 0px rgba(15, 23, 42, 0.02)',
  // 2: Medium resting card
  '0px 4px 6px -1px rgba(15, 23, 42, 0.05), 0px 2px 4px -2px rgba(15, 23, 42, 0.03)',
  // 3: Soft elevated card
  '0px 8px 12px -2px rgba(15, 23, 42, 0.06), 0px 4px 6px -2px rgba(15, 23, 42, 0.04)',
  // 4: Hover card / Button hover
  '0px 10px 15px -3px rgba(15, 23, 42, 0.08), 0px 4px 6px -4px rgba(15, 23, 42, 0.04)',
  // 5: Soft Popover / Menu dropdown
  '0px 12px 20px -4px rgba(15, 23, 42, 0.09), 0px 6px 8px -4px rgba(15, 23, 42, 0.05)',
  // 6: Deep card hover
  '0px 16px 24px -4px rgba(15, 23, 42, 0.10), 0px 8px 10px -4px rgba(15, 23, 42, 0.05)',
  // 7: Floating action button
  '0px 20px 25px -5px rgba(15, 23, 42, 0.12), 0px 8px 10px -6px rgba(15, 23, 42, 0.05)',
  // 8: Dialog resting
  '0px 25px 30px -5px rgba(15, 23, 42, 0.14), 0px 10px 12px -6px rgba(15, 23, 42, 0.06)',
  // 9 - 24: High elevation modal shadows
  ...Array(16).fill('0px 25px 50px -12px rgba(15, 23, 42, 0.20)'),
];
