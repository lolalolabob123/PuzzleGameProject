import AsyncStorage from "@react-native-async-storage/async-storage";

const PROGRESS_KEY = "GAME_PROGRESS";

export const unlockNextLevel = async (chapterId: number, completedLevel: number) => {
  try {
    const rawProgress = await AsyncStorage.getItem(PROGRESS_KEY);
    let progress = rawProgress ? JSON.parse(rawProgress) : {};

    const chapterKey = `chapter_${chapterId}`;
    const currentUnlocked = progress[chapterKey] || 1;

    if (completedLevel >= currentUnlocked) {
      progress[chapterKey] = completedLevel + 1;
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      console.log(`Unlocked Level ${completedLevel + 1} for Chapter ${chapterId}`);
    }
  } catch (error) {
    console.error("Error saving progress:", error);
  }
};

export const getChapterProgress = async (chapterId: number): Promise<number> => {
  try {
    const rawProgress = await AsyncStorage.getItem(PROGRESS_KEY);
    const progress = rawProgress ? JSON.parse(rawProgress) : {};
    return progress[`chapter_${chapterId}`] || 1;
  } catch {
    return 1;
  }
};

export const saveLevelState = async (chapterId: number, levelId: number, state: number[]) => {
  const key = `level_state_${chapterId}_${levelId}`;
  await AsyncStorage.setItem(key, JSON.stringify(state));
};

export const getLevelState = async (chapterId: number, levelId: number) => {
  try {
    const key = `level_state_${chapterId}_${levelId}`;
    const saved = await AsyncStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.warn("AsyncStorage not available:", e);
    return null;
  }
};

export const resetChapterProgress = async (chapterId: number) => {
  try {
    const rawProgress = await AsyncStorage.getItem(PROGRESS_KEY);
    let progress = rawProgress ? JSON.parse(rawProgress) : {};
    
    progress[`chapter_${chapterId}`] = 1;
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

    const allKeys = await AsyncStorage.getAllKeys();

    const keysToRemove = allKeys.filter(key => 
      key.startsWith(`level_state_${chapterId}_`) || 
      key.startsWith(`stars_${chapterId}_`)
    );

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }

    console.log(`Chapter ${chapterId} wiped: progress, states, and stars.`);
  } catch (e) {
    console.error("Failed to fully reset chapter", e);
  }
};

export const clearAllGameData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    
    // Identify every key used by the app
    const gameKeys = keys.filter(key => 
      key.startsWith('chapter_') ||
      key.startsWith('level_state_') ||
      key.startsWith('stars_') ||
      key === 'GAME_PROGRESS'
    );
    
    if (gameKeys.length > 0) {
      await AsyncStorage.multiRemove(gameKeys);
    }
    
    console.log("Global reset: All game data and stars wiped.");
  } catch (e) {
    console.error("Failed to clear all game data", e);
  }
};

export const saveLevelStars = async (chapterId: number, level: number, stars: number) => {
  try {
    const key = `stars_${chapterId}_${level}`;
    const existingStars = await AsyncStorage.getItem(key);
    
    // Only update if the new score is better than the old one
    if (!existingStars || stars > parseInt(existingStars)) {
      await AsyncStorage.setItem(key, stars.toString());
    }
  } catch (e) {
    console.error("Failed to save stars", e);
  }
};

export const getLevelStars = async (chapterId: number, level: number) => {
  try {
    const key = `stars_${chapterId}_${level}`;
    const stars = await AsyncStorage.getItem(key);
    return stars ? parseInt(stars) : 0;
  } catch (e) {
    return 0;
  }
};