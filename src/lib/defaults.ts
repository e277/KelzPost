import seedData from "@/db/seed-data.json";

/** Initial settings and categories for a fresh database (from src/db/seed-data.json). */
export const DEFAULT_SETTINGS: Record<string, string> = seedData.settings;
export const DEFAULT_CATEGORIES: string[] = seedData.categories;
