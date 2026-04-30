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
    id: "theme-mono",
    category: "theme",
    name: "Monochrome Theme",
    description: "Clean black & white style",
    price: 200,
    iconName: "circle-o",
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