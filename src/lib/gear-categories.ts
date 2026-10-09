// Gear article categories: stored as English keys in gear_articles.category,
// shown in Spanish. Single map for /gear, the homepage preview and the admin.
export const GEAR_CATEGORY_LABEL: Record<string, string> = {
  boots: "Botas",
  poles: "Bastones",
  backpacks: "Mochilas",
  tents: "Casas de campaña",
  clothing: "Ropa",
  cameras: "Fotografía",
  accessories: "Accesorios",
};

/** Spanish label for a stored category; unknown keys are shown as stored. */
export function gearCategoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  return GEAR_CATEGORY_LABEL[category] ?? category;
}
