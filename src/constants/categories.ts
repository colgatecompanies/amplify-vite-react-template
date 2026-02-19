export const EQUIPMENT_CATEGORIES = [
  'Tractors',
  'Planting/Seeding',
  'Application',
  'Harvest',
  'Tillage',
  'Construction',
  'Other',
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];
