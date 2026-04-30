import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  COINS: "USER_COINS",
  OWNED: "OWNED_ITEMS",
  EFFECTS: "ITEM_EFFECTS",
};

const getParsed = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const getCoins = async (): Promise<number> => {
  return getParsed<number>(KEYS.COINS, 0);
};

export const addCoins = async (delta: number): Promise<number> => {
  const current = await getCoins();
  const next = Math.max(0, current + delta);
  await AsyncStorage.setItem(KEYS.COINS, JSON.stringify(next));
  return next;
};

// Returns true if the spend succeeded; false if not enough coins.
export const spendCoins = async (cost: number): Promise<boolean> => {
  const current = await getCoins();
  if (current < cost) return false;
  await AsyncStorage.setItem(KEYS.COINS, JSON.stringify(current - cost));
  return true;
};

export const getOwnedItemIds = async (): Promise<string[]> => {
  return getParsed<string[]>(KEYS.OWNED, []);
};

export const markOwned = async (itemId: string): Promise<void> => {
  const owned = await getOwnedItemIds();
  if (!owned.includes(itemId)) {
    owned.push(itemId);
    await AsyncStorage.setItem(KEYS.OWNED, JSON.stringify(owned));
  }
};

export const getEffectCount = async (effect: string): Promise<number> => {
  const map = await getParsed<Record<string, number>>(KEYS.EFFECTS, {});
  return map[effect] ?? 0;
};

export const incrementEffect = async (effect: string, by = 1): Promise<void> => {
  const map = await getParsed<Record<string, number>>(KEYS.EFFECTS, {});
  map[effect] = (map[effect] ?? 0) + by;
  await AsyncStorage.setItem(KEYS.EFFECTS, JSON.stringify(map));
};