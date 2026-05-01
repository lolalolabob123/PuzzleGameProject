import AsyncStorage from "@react-native-async-storage/async-storage";

// New economy: every player gets a one-time grant of 3 free hints when they
// first launch the app. Once consumed, they're gone — additional hints are
// purchased from the shop and tracked via the "extra-hints" effect counter
// in utils/coins.ts. No timers, no replenishment.

const FREE_HINTS_KEY = "FREE_HINTS_REMAINING";
const FREE_HINTS_INITIAL = 3;

const isInitialised = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(FREE_HINTS_KEY);
  return raw !== null;
};

const ensureInitialised = async (): Promise<number> => {
  if (await isInitialised()) {
    const raw = await AsyncStorage.getItem(FREE_HINTS_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  await AsyncStorage.setItem(FREE_HINTS_KEY, String(FREE_HINTS_INITIAL));
  return FREE_HINTS_INITIAL;
};

export const getFreeHintsRemaining = async (): Promise<number> => {
  try {
    return await ensureInitialised();
  } catch {
    return 0;
  }
};

export const consumeFreeHint = async (): Promise<boolean> => {
  const remaining = await ensureInitialised();
  if (remaining <= 0) return false;
  await AsyncStorage.setItem(FREE_HINTS_KEY, String(remaining - 1));
  return true;
};

// Used by the "Wipe All Data" reset path so a fresh start re-grants the 3.
export const resetFreeHints = async (): Promise<void> => {
  await AsyncStorage.removeItem(FREE_HINTS_KEY);
};

// ─── Back-compat alias (older imports) ──────────────────────────────────────
// Kept so callers that haven't migrated yet still compile. Prefer the new
// names above in any new code.
export const getFreeHintAvailable = getFreeHintsRemaining;
export const recordFreeHintUsed = consumeFreeHint;
