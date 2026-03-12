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

export const saveLevelState = async (chapterId: number, level: number, cells: number[]) => {
  try {
    const key = `level_state_${chapterId}_${level}`;
    await AsyncStorage.setItem(key, JSON.stringify(cells));
  } catch (e) {
    console.error("Failed to save level state", e);
  }
};

export const getLevelState = async (chapterId: number, level: number) => {
  try {
    const key = `level_state_${chapterId}_${level}`;
    const saved = await AsyncStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};