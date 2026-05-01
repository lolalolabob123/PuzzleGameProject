export type ShopItemCategory = "theme" | "powerup" | "cosmetic";

export interface ShopItem {
  id: string;
  category: ShopItemCategory;
  name: string;
  description?: string;
  price: number;
  iconName?: string;
  image?: any;
  consumable?: boolean;
  effect?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "storm",
    category: "theme",
    name: "Storm Set",
    description: "Blue & Black on a stormy backdrop.",
    price: 250,
    iconName: "cloud",
  },
  {
        id: "sunlit",
    category: "theme",
    name: "Sunlit Set",
    description: "Warm yellow on muted grey.",
    price: 250,
    iconName: "sun-o",
  },
  {
        id: "shadow",
    category: "theme",
    name: "Shadow Set",
    description: "Sharp contrast for dark mode lovers.",
    price: 300,
    iconName: "mon-o",
  },
  {
    id: "hints-pack-1",
    category: "powerup",
    name: "1 Hints",
    description: "One hint, one chance.",
    price: 12,
    iconName: "lightbulb-o",
    consumable: true,
    effect: "extra-hints",
  },
  {
    id: "hints-pack-5",
    category: "powerup",
    name: "5 Hints",
    description: "Stuck? Use a hint to reveal a cell.",
    price: 50,
    iconName: "lightbulb-o",
    consumable: true,
    effect: "extra-hints",
  },
  {
    id: "skip-level",
    category: "powerup",
    name: "Skip Token",
    description: "Skip one level you can't crack",
    price: 100,
    iconName: "forward",
    consumable: true,
    effect: "skip-tokens",
  },
];