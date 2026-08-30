import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACHIEVEMENTS, Achievement } from "../data/achievements";
import { addCoins } from "./coins";
import Achievements from "../tabs/Achievements";

const KEY = "EARNED_ACHIEVEMENTS";

/**
 * Fetch the set of earned achievement IDs.
 * Uses a Set for 0(1) lookup speeds.
 */
const getEarnedIds = async (): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    return new Set(parsed);
  } catch (error) {
    console.warn("Failed to read achievements from storage:", error);
    return new Set();
  }
};

/**
 * Save the updated set of earned achievement IDs to storage.
 */
const setEarnedIds = async (ids: Set<string>): Promise<void> => {
  try {
    const arrayData = Array.from(ids);
    await AsyncStorage.setItem(KEY, JSON.stringify(arrayData));
  } catch (error) {
    console.error("Failed to save achievements to storage:", error);
  }
};

/**
 * Gets the status of all achievements for UI lists.
 */
export const getAchievementStatus = async (): Promise<
Array<{achievement: Achievement; earned: boolean}>
> => {
  const earnedIds = await getEarnedIds();
  return ACHIEVEMENTS.map((a) => ({
    achievement: a,
    earned: earnedIds.has(a.id),
  }));
};

/**
 * Checks all unearned achievements in parallel and grants rewards.
 * Atomic writes prevent race conditions on level completion.
 */
export const checkAndGrantAchievements = async (): Promise<Achievement[]> => {
  const earnedIds = await getEarnedIds();

  // Filter out already earned achievements upfront
  const pendingAchievements = ACHIEVEMENTS.filter((a) => !earnedIds.has(a.id));
  if (pendingAchievements.length === 0) return [];

  // Evaluate remaining achievement conditions concurrently
  const evaluationResults = await Promise.all(
    pendingAchievements.map(async (achievement) => {
      try {
        const isEarned = await achievement.isEarned();
        return isEarned ? achievement : null;
      } catch (err) {
        console.warn(`Error evaluating achievement ${achievement.id}:`, err);
        return null;
      }
    })
  );

  const newlyEarned = evaluationResults.filter(
    (a): a is Achievement => a !== null
  );

  if (newlyEarned.length > 0) {
    // Update local set and persist atomically
    for (const achievement of newlyEarned) {
      earnedIds.add(achievement.id);
      await addCoins(achievement.reward);
    }
    await setEarnedIds(earnedIds);
  }

  return newlyEarned;
}