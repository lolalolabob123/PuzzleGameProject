import { getChapterProgress, getAllLevelStars } from "../utils/progress";
import { chapters } from "./chapters";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  iconName: string;
  reward: number;
  isEarned: () => Promise<boolean>;
};

/**
 * Batched helper: Reads all star ratings in a single pass to avoid
 * storage waterfalls when evaluating progress across all chapters.
 */
const countLevelsWithStarsBatched = async (minStars: number): Promise<number> => {
  const allStars = await getAllLevelStars();

  let count = 0;
  for (const chapterIdStr of Object.keys(chapters)) {
    const chapterId = Number(chapterIdStr);
    for (const lvl of chapters[chapterId].levels) {
      const starKey = `${chapterId}_${lvl.id}`;
      const stars = allStars[starKey] ?? 0;
      if (stars >= minStars) count++;
    }
  }
  return count;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    title: "First Steps",
    description: "Complete your first level.",
    iconName: "flag",
    reward: 25,
    isEarned: async () => (await countLevelsWithStarsBatched(1)) >= 1,
  },
  {
    id: "triple-three",
    title: "Triple Threat",
    description: "Earn 3 stars on 3 levels.",
    iconName: "star",
    reward: 75,
    isEarned: async () => (await countLevelsWithStarsBatched(3)) >= 3,
  },
  {
    id: "dedicated",
    title: "Dedicated Solver",
    description: "Complete 10 levels.",
    iconName: "trophy",
    reward: 100,
    isEarned: async () => (await countLevelsWithStarsBatched(1)) >= 10,
  },
  {
    id: "chapter-1",
    title: "Chapter One",
    description: "Complete every level in Chapter 1.",
    iconName: "bookmark",
    reward: 150,
    isEarned: async () => {
      const { solved, total } = await getChapterProgress(1);
      return total > 0 && solved >= total;
    },
  },
  {
    id: "chapter-1-perfect",
    title: "Chapter One Master",
    description: "Earn 3 stars on every level in Chapter 1.",
    iconName: "diamond",
    reward: 300,
    isEarned: async () => {
      const { totalStars, maxStars } = await getChapterProgress(1);
      return maxStars > 0 && totalStars >= maxStars;
    },
  },
  {
    id: "all-chapters",
    title: "Completionist",
    description: "Complete every chapter.",
    iconName: "crown",
    reward: 500,
    isEarned: async () => {
      const chapterIds = Object.keys(chapters).map(Number);

      const allProgress = await Promise.all(
        chapterIds.map((id) => getChapterProgress(id))
      );

      return allProgress.every(
        ({ solved, total }) => total > 0 && solved >= total
      );
    },
  },
];