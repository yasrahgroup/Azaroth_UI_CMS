import { DEFAULT_SETTINGS } from '../constants/defaultSettings';

export function brandDocumentTitle(title: string, brandName: string): string {
  const brand = brandName.trim() || DEFAULT_SETTINGS.header.brandName;
  const brandedTitle = title.replace(/Azaroth(?: Tech-Hive)?/gi, brand).trim();
  return brandedTitle.toLowerCase().includes(brand.toLowerCase())
    ? brandedTitle
    : `${brand} | ${brandedTitle}`;
}
