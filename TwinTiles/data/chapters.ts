import { getFixedLevel } from "../utils/levelGenerator";

export interface Level {
  id: number;
  size: number;
  grid: number[];
}

export interface Chapter {
  title: string;
  levels: Level[];
}

const generateChapterLevels = (chapterId: number, totalLevels: number): Level[] => {
  return Array.from({ length: totalLevels }, (_, i) => {
    const levelId = i + 1;
    const size = levelId <= 5 ? 4 : 6;
    const difficulty = Math.min(0.4 + (i * 0.03), 0.7); 

    return {
      id: levelId,
      size: size,
      grid: getFixedLevel(chapterId, levelId, size, difficulty)
    };
  });
};

export const chapters: Record<number, Chapter> = {
  1: { title: "Chapter 1: The Basics", levels: generateChapterLevels(1, 10) },
  2: { title: "Chapter 2: Intermediate", levels: generateChapterLevels(2, 10) },
  3: { title: "Chapter 3: Advanced", levels: generateChapterLevels(3, 10) },
  4: { title: "Chapter 4: The Master", levels: generateChapterLevels(4, 10) }
};