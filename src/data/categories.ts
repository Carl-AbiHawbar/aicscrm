import type { Bilingual } from '@/types/domain'

export interface Category {
  id: string
  slug: string
  name: Bilingual
  icon: string
  navKey: string
}

export const CATEGORIES: Category[] = [
  { id: 'cat-building', slug: 'building-materials', navKey: 'buildingMaterials', icon: 'brick', name: { en: 'Building Materials', ar: 'مواد البناء' } },
  { id: 'cat-tools', slug: 'tools-equipment', navKey: 'toolsEquipment', icon: 'tool', name: { en: 'Tools & Equipment', ar: 'العدد والمعدات' } },
  { id: 'cat-electrical', slug: 'electrical', navKey: 'electrical', icon: 'bolt', name: { en: 'Electrical', ar: 'الكهرباء' } },
  { id: 'cat-plumbing', slug: 'plumbing', navKey: 'plumbing', icon: 'pipe', name: { en: 'Plumbing', ar: 'السباكة' } },
  { id: 'cat-paint', slug: 'paint-finishing', navKey: 'paintFinishing', icon: 'paint', name: { en: 'Paint & Finishing', ar: 'الدهانات والتشطيبات' } },
  { id: 'cat-flooring', slug: 'flooring-tiles', navKey: 'flooringTiles', icon: 'tiles', name: { en: 'Flooring & Tiles', ar: 'الأرضيات والبلاط' } },
  { id: 'cat-doors', slug: 'doors-panels', navKey: 'doorsPanels', icon: 'door', name: { en: 'Doors & Panels', ar: 'الأبواب والألواح' } },
  { id: 'cat-garden', slug: 'garden-outdoor', navKey: 'gardenOutdoor', icon: 'tree', name: { en: 'Garden & Outdoor', ar: 'الحدائق والخارجية' } },
  { id: 'cat-safety', slug: 'safety-equipment', navKey: 'safetyEquipment', icon: 'helmet', name: { en: 'Safety Equipment', ar: 'معدات السلامة' } },
]

export const BRANDS = [
  { id: 'brand-alfa', name: { en: 'AlfaBuild', ar: 'ألفا بيلد' } },
  { id: 'brand-titan', name: { en: 'Titan Tools', ar: 'تيتان تولز' } },
  { id: 'brand-aqua', name: { en: 'AquaFlow', ar: 'أكوا فلو' } },
  { id: 'brand-volt', name: { en: 'VoltLine', ar: 'فولت لاين' } },
  { id: 'brand-colora', name: { en: 'Colora', ar: 'كولورا' } },
]
