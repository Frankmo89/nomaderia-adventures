export const PARK_NAMES = [
  "Yosemite National Park",
  "Zion National Park",
  "Grand Canyon National Park",
  "Rocky Mountain National Park",
  "Glacier National Park",
  "Sequoia & Kings Canyon",
  "Mount Whitney / Inyo NF",
  "Coyote Buttes North (The Wave)",
  "Joshua Tree National Park",
  "Death Valley National Park",
  "Yellowstone National Park",
  "Bryce Canyon National Park",
] as const;

export type ParkName = (typeof PARK_NAMES)[number];
