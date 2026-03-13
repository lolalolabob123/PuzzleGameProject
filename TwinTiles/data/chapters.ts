export type Level = {
  id: number;
  grid: number[];
};

export type Chapter = {
  title: string;
  levels: Level[];
};

export const chapters: Record<number, Chapter> = {
  1: {
    title: "Chapter 1: The Basics",
    levels: [
      // LEVEL 1: Introduction to Duos (4x4)
      { id: 1, grid: [1, 0, 0, 2, 0, 0, 2, 0, 0, 1, 0, 0, 2, 0, 0, 1] },

      // LEVEL 2: Introduction to Sandwiches (4x4)
      { id: 2, grid: [0, 2, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 2, 0, 2, 1] },

      // LEVEL 3: Combining Duo and Sandwich (4x4)
      { id: 3, grid: [2, 2, 0, 1, 0, 0, 1, 0, 0, 1, 0, 2, 1, 0, 0, 0] },

      // LEVEL 4: First "Thinker" (4x4 - fewer starters)
      { id: 4, grid: [0, 0, 1, 0, 2, 0, 0, 2, 2, 0, 1, 0, 0, 0, 0, 1] },

      // LEVEL 5: Perfecting 4x4 (Only 5 starters)
      { id: 5, grid: [1, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 0, 1, 0, 0] },

      // LEVEL 6: Introduction to 6x6 (High starter count)
      { id: 6, grid: [
        1, 1, 0, 2, 0, 2,
        0, 0, 2, 0, 0, 0,
        2, 0, 0, 1, 1, 0,
        0, 1, 0, 0, 2, 2,
        0, 0, 0, 2, 0, 0,
        2, 2, 0, 0, 1, 1
      ]},

      // LEVEL 7: 6x6 Counting Rows (Check for 3 of each color)
      { id: 7, grid: [
        0, 0, 2, 2, 0, 0,
        1, 0, 0, 0, 0, 1,
        1, 0, 2, 0, 2, 0,
        0, 0, 2, 0, 0, 2,
        0, 2, 0, 0, 1, 1,
        0, 0, 0, 1, 0, 0
      ]},

      // LEVEL 8: Advanced 6x6 (Focus on columns)
      { id: 8, grid: [
        0, 1, 0, 0, 2, 2,
        0, 1, 0, 0, 0, 0,
        2, 0, 0, 1, 0, 1,
        2, 0, 1, 1, 0, 0,
        0, 0, 0, 0, 2, 0,
        1, 0, 2, 2, 0, 0
      ]},

      // LEVEL 9: The "No Guessing" Challenge
      { id: 9, grid: [
        0, 0, 0, 0, 0, 2,
        1, 1, 0, 2, 0, 0,
        0, 0, 0, 0, 1, 1,
        0, 2, 2, 0, 0, 0,
        0, 0, 1, 0, 2, 2,
        1, 0, 0, 0, 0, 0
      ]},

      // LEVEL 10: Chapter 1 Finale (Complex logic)
      { id: 10, grid: [
        0, 0, 1, 0, 0, 2,
        0, 2, 0, 0, 0, 0,
        0, 2, 0, 1, 1, 0,
        0, 0, 0, 0, 0, 1,
        2, 2, 0, 1, 0, 0,
        0, 0, 0, 0, 2, 2
      ]},
    ]
  }
};