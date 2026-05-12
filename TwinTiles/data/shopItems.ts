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
    description: "Electric blue on deep slate.",
    price: 250,
    iconName: "cloud",
  },
  {
    id: "sunset",
    category: "theme",
    name: "Sunset Set",
    description: "Coral and saffron warmth.",
    price: 250,
    iconName: "sun-o",
  },
  {
    id: "forest",
    category: "theme",
    name: "Forest Set",
    description: "Emerald and earth tones.",
    price: 250,
    iconName: "tree",
  },
  {
    id: "neon",
    category: "theme",
    name: "Neon Set",
    description: "Magenta and cyan on near-black.",
    price: 300,
    iconName: "moon-o",
  },
  {
    id: "hints-pack-1",
    category: "powerup",
    name: "1 Hint",
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
    description: "Skip one level you can't crack.",
    price: 100,
    iconName: "forward",
    consumable: true,
    effect: "skip-tokens",
  },
];