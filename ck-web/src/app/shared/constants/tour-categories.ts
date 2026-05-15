export const TOUR_CATEGORIES = [
  { key: 'letne',      label: 'Letné dovolenky' },
  { key: 'jednodnove', label: 'Jednodňové výlety' },
  { key: 'silvester',  label: 'Silvester' },
  { key: 'lyzovacky',  label: 'Lyžovačky' },
  { key: 'pute',       label: 'Púte' },
] as const;

export type TourCategoryKey = typeof TOUR_CATEGORIES[number]['key'];
