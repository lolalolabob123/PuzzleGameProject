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
    // If AsyncStorage fails, return null so the game can still be played (just not saved)
    console.warn("AsyncStorage not available:", e);
    return null;
  }
};