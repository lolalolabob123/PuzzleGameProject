import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  COINS: "USER_COINS",
  OWNED: "OWNED_ITEMS",
};

const EFFECT_KEY_PREFIX = "@effect_";

// --- EFFECT / POWER-UP TOKEN STORAGE ---

export async function getEffectCount(effect: string): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(`${EFFECT_KEY_PREFIX}${effect}`);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function incrementEffect(effect: string, by = 1): Promise<void> {
  try {
    const current = await getEffectCount(effect);
    const updated = current + by;
    await AsyncStorage.setItem(`${EFFECT_KEY_PREFIX}${effect}`, updated.toString());
  } catch (error) {
    console.error("Error incrementing effect:", error);
  }
}

export async function useEffectToken(effect: string): Promise<boolean> {
  try {
    const current = await getEffectCount(effect);
    if (current <= 0) return false;

    await AsyncStorage.setItem(
      `${EFFECT_KEY_PREFIX}${effect}`,
      (current - 1).toString()
    );
    return true;
  } catch {
    return false;
  }
}

// Alias consumeEffect to useEffectToken for backward compatibility
export const consumeEffect = async (effect: string, count = 1): Promise<boolean> => {
  let success = true;
  for (let i = 0; i < count; i++) {
    const used = await useEffectToken(effect);
    if (!used) {
      success = false;
      break;
    }
  }
  return success;
};

// --- GENERAL STORAGE HELPERS ---

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