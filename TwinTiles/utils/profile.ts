import AsyncStorage from "@react-native-async-storage/async-storage";

export type Profile = {
  name: string;
  avatarId: string;
  equippedTheme: string;
  unlockedThemes: string[];
};

const KEY = "USER_PROFILE";

export const DEFAULT_PROFILE: Profile = {
  name: "Player",
  avatarId: "default",
  equippedTheme: "classic",
  unlockedThemes: ["classic", "ink"], // Free starting themes
};

export const getProfile = async (): Promise<Profile> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;

    const parsed = JSON.parse(raw);
    
    // Merge stored values with defaults to guarantee new fields exist
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      unlockedThemes: Array.isArray(parsed?.unlockedThemes)
        ? Array.from(new Set([...DEFAULT_PROFILE.unlockedThemes, ...parsed.unlockedThemes]))
        : DEFAULT_PROFILE.unlockedThemes,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
};

export const saveProfile = async (profile: Profile): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to save profile:", error);
  }
};

export const clearProfile = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    console.error("Failed to clear profile:", error);
  }
};