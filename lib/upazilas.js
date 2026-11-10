/**
 * Krishi Mama — Upazila Registry (Client).
 * Official BBS 2020 Admin-3 boundaries for supported districts.
 */

export const DISTRICT_UPAZILAS = {
  cumilla: [
    { code: "adarsha_sadar", nameEn: "Adarsha Sadar", nameBn: "আদর্শ সদর" },
    { code: "sadar_dakshin", nameEn: "Sadar Dakshin", nameBn: "সদর দক্ষিণ" },
    { code: "barura", nameEn: "Barura", nameBn: "বরুড়া" },
    { code: "brahmanpara", nameEn: "Brahmanpara", nameBn: "ব্রাহ্মণপাড়া" },
    { code: "burichang", nameEn: "Burichang", nameBn: "বুড়িচং" },
    { code: "chandina", nameEn: "Chandina", nameBn: "চান্দিনা" },
    { code: "chauddagram", nameEn: "Chauddagram", nameBn: "চৌদ্দগ্রাম" },
    { code: "daudkandi", nameEn: "Daudkandi", nameBn: "দাউদকান্দি" },
    { code: "debidwar", nameEn: "Debidwar", nameBn: "দেবিদ্বার" },
    { code: "homna", nameEn: "Homna", nameBn: "হোমনা" },
    { code: "laksam", nameEn: "Laksam", nameBn: "লাকসাম" },
    { code: "lalmai", nameEn: "Lalmai", nameBn: "লালমাই" },
    { code: "meghna", nameEn: "Meghna", nameBn: "মেঘনা" },
    { code: "monohargonj", nameEn: "Monohargonj", nameBn: "মনোহরগঞ্জ" },
    { code: "muradnagar", nameEn: "Muradnagar", nameBn: "মুরাদনগর" },
    { code: "nangalkot", nameEn: "Nangalkot", nameBn: "নাঙ্গলকোট" },
    { code: "titas", nameEn: "Titas", nameBn: "তিতাস" },
  ],
  chattogram: [
    { code: "anwara", nameEn: "Anwara", nameBn: "আনোয়ারা" },
    { code: "banshkhali", nameEn: "Banshkhali", nameBn: "বাঁশখালী" },
    { code: "boalkhali", nameEn: "Boalkhali", nameBn: "বোয়ালখালী" },
    { code: "chandanaish", nameEn: "Chandanaish", nameBn: "চন্দনাইশ" },
    { code: "fatikchhari", nameEn: "Fatikchhari", nameBn: "ফটিকছড়ি" },
    { code: "hathazari", nameEn: "Hathazari", nameBn: "হাটহাজারী" },
    { code: "karnaphuli", nameEn: "Karnaphuli", nameBn: "কর্ণফুলী" },
    { code: "lohagara", nameEn: "Lohagara", nameBn: "লোহাগাড়া" },
    { code: "mirsharai", nameEn: "Mirsharai", nameBn: "মীরসরাই" },
    { code: "patiya", nameEn: "Patiya", nameBn: "পটিয়া" },
    { code: "rangunia", nameEn: "Rangunia", nameBn: "রাঙ্গুনিয়া" },
    { code: "raozan", nameEn: "Raozan", nameBn: "রাউজান" },
    { code: "sandwip", nameEn: "Sandwip", nameBn: "সন্দ্বীপ" },
    { code: "satkania", nameEn: "Satkania", nameBn: "সাতকানিয়া" },
    { code: "sitakunda", nameEn: "Sitakunda", nameBn: "সীতাকুণ্ড" },
  ],
};

export const SUPPORTED_CROPS = [
  {
    code: "monsoon_aman",
    nameEn: "Transplanted Aman Rice",
    nameBn: "রোপা আমন ধান",
    seasonEn: "Kharif-II",
    seasonBn: "খরিপ-২",
    typicalVarieties: ["BRRI dhan87", "BRRI dhan49", "BRRI dhan71", "Binadhan-7"],
    durationDays: 135,
  },
  {
    code: "boro_rice",
    nameEn: "Boro Rice",
    nameBn: "বোরো ধান",
    seasonEn: "Rabi",
    seasonBn: "রবি",
    typicalVarieties: ["BRRI dhan28", "BRRI dhan29", "BRRI dhan89", "BRRI dhan92"],
    durationDays: 155,
  },
  {
    code: "aus_rice",
    nameEn: "Aus Rice",
    nameBn: "আউশ ধান",
    seasonEn: "Kharif-I",
    seasonBn: "খরিপ-১",
    typicalVarieties: ["BRRI dhan48", "BRRI dhan82", "BRRI dhan85"],
    durationDays: 110,
  },
  {
    code: "mustard",
    nameEn: "Mustard",
    nameBn: "সরিষা",
    seasonEn: "Rabi",
    seasonBn: "রবি",
    typicalVarieties: ["BARI Sarisha-14", "BARI Sarisha-15", "BARI Sarisha-17", "Binasharisha-9"],
    durationDays: 80,
  },
];

export const LAND_UNITS = [
  { code: "decimal", nameEn: "Decimal", nameBn: "শতাংশ", factorToDecimal: 1 },
  { code: "acre", nameEn: "Acre", nameBn: "একর", factorToDecimal: 100 },
  { code: "hectare", nameEn: "Hectare", nameBn: "হেক্টর", factorToDecimal: 247.1 },
  { code: "bigha", nameEn: "Bigha", nameBn: "বিঘা", factorToDecimal: 33 },
  { code: "katha", nameEn: "Katha", nameBn: "কাঠা", factorToDecimal: 1.65 },
];

export function getUpazilasForDistrict(districtCode) {
  if (!districtCode) return [];
  const lower = districtCode.trim().toLowerCase();
  return DISTRICT_UPAZILAS[lower] || [];
}
