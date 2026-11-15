export const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.dashboard', icon: '📊', end: true },
  {
    path: '/users',
    labelKey: 'nav.users',
    icon: '👥',
    children: [
      { path: '/users/couriers', labelKey: 'nav.couriers' },
      { path: '/users/clients', labelKey: 'nav.clients' },
    ],
  },
  { path: '/deliveries', labelKey: 'nav.deliveries', icon: '📦' },
  { path: '/returns', labelKey: 'nav.returns', icon: '↩️' },
  { path: '/karya', labelKey: 'nav.karya', icon: '🛵' },
  { path: '/disputes', labelKey: 'nav.disputes', icon: '⚖️' },
  { path: '/ratings', labelKey: 'nav.ratings', icon: '⭐' },
];
