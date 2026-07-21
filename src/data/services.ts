import type { Bilingual } from '@/types/domain'

export interface ServiceCategory {
  id: string
  slug: string
  name: Bilingual
  icon: string
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'sc-electrician', slug: 'electrician', icon: 'bolt', name: { en: 'Electrician', ar: 'كهربائي' } },
  { id: 'sc-plumber', slug: 'plumber', icon: 'pipe', name: { en: 'Plumber', ar: 'سباك' } },
  { id: 'sc-painter', slug: 'painter', icon: 'paint', name: { en: 'Painter', ar: 'دهّان' } },
  { id: 'sc-tiler', slug: 'tiler', icon: 'tiles', name: { en: 'Tiler', ar: 'مبلّط' } },
  { id: 'sc-carpenter', slug: 'carpenter', icon: 'wood', name: { en: 'Carpenter', ar: 'نجار' } },
  { id: 'sc-mason', slug: 'mason', icon: 'brick', name: { en: 'Mason', ar: 'بنّاء' } },
  { id: 'sc-contractor', slug: 'general-contractor', icon: 'helmet', name: { en: 'General Contractor', ar: 'مقاول عام' } },
  { id: 'sc-aluminium', slug: 'aluminium-installer', icon: 'window', name: { en: 'Aluminium Installer', ar: 'فني ألمنيوم' } },
  { id: 'sc-waterproof', slug: 'waterproofing', icon: 'water', name: { en: 'Waterproofing Specialist', ar: 'أخصائي عزل مائي' } },
  { id: 'sc-ac', slug: 'ac-technician', icon: 'snow', name: { en: 'AC Technician', ar: 'فني تكييف' } },
]

export interface Professional {
  id: string
  name: Bilingual
  businessName: string
  serviceCategoryIds: string[]
  areasServed: string[]
  yearsExperience: number
  rating: number
  reviewCount: number
  completedJobs: number
  startingPriceMinor: number
  siteVisitFeeMinor: number
  verified: boolean
  emergency: boolean
  languages: string[]
}

export const PROFESSIONALS: Professional[] = [
  { id: 'pro-1', name: { en: 'Khaled Mansour', ar: 'خالد منصور' }, businessName: 'BrightVolt Electrical', serviceCategoryIds: ['sc-electrician'], areasServed: ['zone-central', 'zone-north'], yearsExperience: 12, rating: 4.8, reviewCount: 156, completedJobs: 320, startingPriceMinor: 8000, siteVisitFeeMinor: 5000, verified: true, emergency: true, languages: ['ar', 'en'] },
  { id: 'pro-2', name: { en: 'Samir Haddad', ar: 'سمير حداد' }, businessName: 'AquaFix Plumbing', serviceCategoryIds: ['sc-plumber'], areasServed: ['zone-central', 'zone-suburb'], yearsExperience: 9, rating: 4.6, reviewCount: 98, completedJobs: 210, startingPriceMinor: 6000, siteVisitFeeMinor: 4000, verified: true, emergency: true, languages: ['ar'] },
  { id: 'pro-3', name: { en: 'Lina Nasser', ar: 'لينا ناصر' }, businessName: 'Colora Painting Co.', serviceCategoryIds: ['sc-painter'], areasServed: ['zone-central', 'zone-north', 'zone-suburb'], yearsExperience: 7, rating: 4.9, reviewCount: 74, completedJobs: 140, startingPriceMinor: 5000, siteVisitFeeMinor: 0, verified: true, emergency: false, languages: ['ar', 'en'] },
  { id: 'pro-4', name: { en: 'Omar Fadel', ar: 'عمر فاضل' }, businessName: 'Precision Tiling', serviceCategoryIds: ['sc-tiler'], areasServed: ['zone-central', 'zone-industrial'], yearsExperience: 15, rating: 4.7, reviewCount: 203, completedJobs: 410, startingPriceMinor: 7000, siteVisitFeeMinor: 5000, verified: true, emergency: false, languages: ['ar', 'en'] },
  { id: 'pro-5', name: { en: 'Youssef Karim', ar: 'يوسف كريم' }, businessName: 'MasterCraft Carpentry', serviceCategoryIds: ['sc-carpenter'], areasServed: ['zone-north', 'zone-suburb'], yearsExperience: 20, rating: 4.9, reviewCount: 187, completedJobs: 360, startingPriceMinor: 9000, siteVisitFeeMinor: 6000, verified: true, emergency: false, languages: ['ar'] },
  { id: 'pro-6', name: { en: 'Hassan Ali', ar: 'حسن علي' }, businessName: 'SolidBuild Contracting', serviceCategoryIds: ['sc-contractor', 'sc-mason'], areasServed: ['zone-central', 'zone-north', 'zone-industrial', 'zone-suburb'], yearsExperience: 18, rating: 4.5, reviewCount: 66, completedJobs: 95, startingPriceMinor: 20000, siteVisitFeeMinor: 8000, verified: true, emergency: false, languages: ['ar', 'en'] },
  { id: 'pro-7', name: { en: 'Rami Saleh', ar: 'رامي صالح' }, businessName: 'DryShield Waterproofing', serviceCategoryIds: ['sc-waterproof'], areasServed: ['zone-central', 'zone-suburb'], yearsExperience: 11, rating: 4.7, reviewCount: 52, completedJobs: 130, startingPriceMinor: 12000, siteVisitFeeMinor: 6000, verified: true, emergency: false, languages: ['ar', 'en'] },
  { id: 'pro-8', name: { en: 'Tariq Aziz', ar: 'طارق عزيز' }, businessName: 'CoolAir Services', serviceCategoryIds: ['sc-ac'], areasServed: ['zone-central', 'zone-north'], yearsExperience: 8, rating: 4.4, reviewCount: 89, completedJobs: 175, startingPriceMinor: 7000, siteVisitFeeMinor: 4000, verified: false, emergency: true, languages: ['ar', 'en'] },
]
