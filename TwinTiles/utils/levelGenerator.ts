import seedrandom from "seedrandom";

export interface Cage {
  indices: number[];
  target?: number;
}

/**
 * Validates a local Takuzu placement.
 *
 * Rules:
 * 1. No three identical playable cells consecutively.
 * 2. A void (-1) physically breaks a sequence.
 * 3. A colour cannot exceed half of the playable cells in a row/column.
 */
const isValid = (
  grid: number[],
  index: number,
  color: number,
  size: number
): boolean => {
  if (!grid || index < 0 || index >= grid.length) {
    return false;
  }

  const row = Math.floor(index / size);
  const col = index % size;

  /*
   * HORIZONTAL CONSECUTIVE CHECK
   */
  if (
    col >= 2 &&
    grid[index - 1] === color &&
    grid[index - 2] === color
  ) {
    return false;
  }

  if (
    col <= size - 3 &&
    grid[index + 1] === color &&
    grid[index + 2] === color
  ) {
    return false;
  }

  if (
    col >= 1 &&
    col <= size - 2 &&
    grid[index - 1] === color &&
    grid[index + 1] === color
  ) {
    return false;
  }

  /*
   * VERTICAL CONSECUTIVE CHECK
   */
  if (
    row >= 2 &&
    grid[index - size] === color &&
    grid[index - 2 * size] === color
  ) {
    return false;
  }

  if (
    row <= size - 3 &&
    grid[index + size] === color &&
    grid[index + 2 * size] === color
  ) {
    return false;
  }

  if (
    row >= 1 &&
    row <= size - 2 &&
    grid[index - size] === color &&
    grid[index + size] === color
  ) {
    return false;
  }

  /*
   * COLOUR DISTRIBUTION
   */
  let rowVoids = 0;
  let colVoids = 0;

  for (let i = 0; i < size; i++) {
    if (grid[row * size + i] === -1) rowVoids++;
    if (grid[i * size + col] === -1) colVoids++;
  }

  const maxRowColor = Math.ceil((size - rowVoids) / 2);
  const maxColColor = Math.ceil((size - colVoids) / 2);

  let rowCount = 0;
  for (let i = 0; i < size; i++) {
    const idx = row * size + i;
    if (idx !== index && grid[idx] === color) {
      rowCount++;
    }
  }
  if (rowCount + 1 > maxRowColor) return false;

  let colCount = 0;
  for (let i = 0; i < size; i++) {
    const idx = i * size + col;
    if (idx !== index && grid[idx] === color) {
      colCount++;
    }
  }
  if (colCount + 1 > maxColColor) return false;

  return true;
};

/**
 * Checks that every empty slot still has at least one legal colour.
 */
const hasValidMoves = (grid: number[], size: number): boolean => {
  return grid.every((val, idx) => {
    if (val !== 0) return true;
    return (
      isValid(grid, idx, 1, size) ||
      isValid(grid, idx, 2, size)
    );
  });
};

/**
 * Validates a completed grid.
 */
const isGridFullyValid = (grid: number[], size: number): boolean => {
  const rowStrings: string[] = [];
  const colStrings: string[] = [];

  for (let line = 0; line < size; line++) {
    let rowC1 = 0, rowC2 = 0, rowVoids = 0;
    let colC1 = 0, colC2 = 0, colVoids = 0;
    let rowStr = "";
    let colStr = "";

    for (let i = 0; i < size; i++) {
      const rVal = grid[line * size + i];
      rowStr += rVal;
      if (rVal === -1) rowVoids++;
      else if (rVal === 1) rowC1++;
      else if (rVal === 2) rowC2++;

      const cVal = grid[i * size + line];
      colStr += cVal;
      if (cVal === -1) colVoids++;
      else if (cVal === 1) colC1++;
      else if (cVal === 2) colC2++;
    }

    const rowPlayable = size - rowVoids;
    const colPlayable = size - colVoids;

    if (Math.abs(rowC1 - rowC2) > rowPlayable % 2) return false;
    if (Math.abs(colC1 - colC2) > colPlayable % 2) return false;

    if (rowStrings.includes(rowStr)) return false;
    rowStrings.push(rowStr);

    if (colStrings.includes(colStr)) return false;
    colStrings.push(colStr);
  }

  return true;
};

/**
 * Generates a complete valid grid using backtracking.
 */
function fillGrid(grid: number[], index: number, size: number, rng: () => number): boolean {
  if (!grid || !Array.isArray(grid)) {
    throw new Error('Invalid grid');
  }

  if (index === grid.length) {
    return isGridFullyValid(grid, size);
  }

  if (grid[index] !== 0) {
    return fillGrid(grid, index + 1, size, rng);
  }

  const choices = rng() > 0.5 ? [1, 2] : [2, 1];

  for (const color of choices) {
    if (isValid(grid, index, color, size)) {
      grid[index] = color;
      if (fillGrid(grid, index + 1, size, rng)) {
        return true;
      }
      grid[index] = 0;
    }
  }
  return false;
}

/**
 * Counts the number of complete solutions up to a limit.
 */
/**
 * Counts the number of complete solutions up to a limit, honoring both Takuzu rules and cages.
 */
const countSolutions = (
  grid: number[],
  index: number,
  size: number,
  cages: Cage[] = [],
  limit: number = 2
): number => {
  if (!grid) return 0;
  if (index === grid.length) return isGridFullyValid(grid, size) ? 1 : 0;

  if (grid[index] !== 0) {
    return countSolutions(grid, index + 1, size, cages, limit);
  }

  let total = 0;
  for (const color of [1, 2]) {
    if (!isValid(grid, index, color, size)) continue;
    if (cages.length > 0 && !cagePermits(grid, index, color, cages)) continue;

    grid[index] = color;
    total += countSolutions(grid, index + 1, size, cages, limit);
    grid[index] = 0;

    if (total >= limit) return total;
  }

  return total;
};

/**
 * Checks whether a colour can be placed into a cage.
 */
const cagePermits = (
  grid: number[],
  index: number,
  color: number,
  cages: Cage[]
): boolean => {
  for (const cage of cages) {
    if (cage.target === undefined || !cage.indices.includes(index)) {
      continue;
    }

    let sum = color;
    let empties = 0;

    for (const idx of cage.indices) {
      if (idx === index) continue;
      const v = grid[idx];
      if (v === 0) empties++;
      else if (v > 0) sum += v;
    }

    if (empties === 0) {
      if (sum !== cage.target) return false;
    } else {
      if (sum + empties > cage.target) return false;
      if (sum + empties * 2 < cage.target) return false;
    }
  }
  return true;
};

/**
 * Performs one round of logical deductions.
 */
const deduceOnce = (
  grid: number[],
  size: number,
  cages: Cage[]
): number => {
  let filled = 0;

  /*
   * 1. LINE CAPACITY
   */
  for (let line = 0; line < size; line++) {
    let rowC1 = 0, rowC2 = 0, rowVoids = 0;
    let colC1 = 0, colC2 = 0, colVoids = 0;

    for (let i = 0; i < size; i++) {
      const rVal = grid[line * size + i];
      if (rVal === 1) rowC1++;
      if (rVal === 2) rowC2++;
      if (rVal === -1) rowVoids++;

      const cVal = grid[i * size + line];
      if (cVal === 1) colC1++;
      if (cVal === 2) colC2++;
      if (cVal === -1) colVoids++;
    }

    const maxRowColor = Math.ceil((size - rowVoids) / 2);
    if (rowC1 === maxRowColor || rowC2 === maxRowColor) {
      const fillWith = rowC1 === maxRowColor ? 2 : 1;
      for (let i = 0; i < size; i++) {
        const idx = line * size + i;
        if (grid[idx] === 0) {
          grid[idx] = fillWith;
          filled++;
        }
      }
    }

    const maxColColor = Math.ceil((size - colVoids) / 2);
    if (colC1 === maxColColor || colC2 === maxColColor) {
      const fillWith = colC1 === maxColColor ? 2 : 1;
      for (let i = 0; i < size; i++) {
        const idx = i * size + line;
        if (grid[idx] === 0) {
          grid[idx] = fillWith;
          filled++;
        }
      }
    }
  }

  /*
   * 2. CELL DEDUCTIONS
   */
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== 0) continue;

    const canBe1 = isValid(grid, i, 1, size) && cagePermits(grid, i, 1, cages);
    const canBe2 = isValid(grid, i, 2, size) && cagePermits(grid, i, 2, cages);

    if (!canBe1 && !canBe2) return -1;

    if (canBe1 && !canBe2) {
      grid[i] = 1;
      filled++;
    } else if (canBe2 && !canBe1) {
      grid[i] = 2;
      filled++;
    }
  }

  return filled;
};

/**
 * Uses a one-cell lookahead when normal deductions reach a stalemate.
 */
const deduceWithLookahead = (
  grid: number[],
  size: number,
  cages: Cage[]
): number => {
  let filled = 0;

  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== 0) continue;

    for (const testColor of [1, 2]) {
      if (!isValid(grid, i, testColor, size) || !cagePermits(grid, i, testColor, cages)) {
        continue;
      }

      const testGrid = [...grid];
      testGrid[i] = testColor;

      let progress = 0;
      let invalid = false;
      do {
        progress = deduceOnce(testGrid, size, cages);
        if (progress < 0) {
          invalid = true;
          break;
        }
      } while (progress > 0);

      if (invalid) {
        const oppositeColor = testColor === 1 ? 2 : 1;
        if (isValid(grid, i, oppositeColor, size) && cagePermits(grid, i, oppositeColor, cages)) {
          grid[i] = oppositeColor;
          filled++;
          return filled;
        } else {
          return -1;
        }
      }
    }
  }

  return filled;
};

/**
 * Determines whether a puzzle can be solved using deduction.
 */
const isSolvableByDeduction = (
  startingGrid: number[],
  size: number,
  cages: Cage[]
): boolean => {
  const grid = [...startingGrid];

  while (grid.some((c) => c === 0)) {
    let progress = deduceOnce(grid, size, cages);

    if (progress < 0) return false;

    if (progress === 0) {
      progress = deduceWithLookahead(grid, size, cages);
      if (progress <= 0) return false;
    }
  }

  return true;
};

/**
 * Generates a deterministic level.
 */
export const getFixedLevel = (
  chapterId: number,
  levelId: number,
  size: number,
  difficulty: number,
  voids: number[] = []
): number[] => {
  const seed = `v6-ch-${chapterId}-lvl-${levelId}-diff-${difficulty}`;
  const rng = seedrandom(seed);
  const fullGrid = new Array(size * size).fill(0);

  for (const v of voids) {
    if (v >= 0 && v < fullGrid.length) {
      fullGrid[v] = -1;
    }
  }

  if (!fillGrid(fullGrid, 0, size, rng)) {
    console.error(`Puzzle generation failed for chapter ${chapterId} level ${levelId}`);
    return new Array(size * size).fill(0);
  }

  const puzzle = [...fullGrid];
  const positions = Array.from({ length: size * size }, (_, i) => i);

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const targetRemove = Math.floor(positions.length * difficulty);
  let removedCount = 0;

  for (const pos of positions) {
    if (removedCount >= targetRemove) break;
    if (puzzle[pos] === -1) continue;

    const backup = puzzle[pos];
    puzzle[pos] = 0;

    if (
      !isSolvableByDeduction(puzzle, size, []) ||
      !hasValidMoves(puzzle, size)
    ) {
      puzzle[pos] = backup;
    } else {
      removedCount++;
    }
  }

  return puzzle;
};

/**
 * Returns the exact completed solution for a level.
 */
export const getFullSolution = (
  chapterId: number,
  levelId: number,
  size: number,
  difficulty: number = 0.55,
  voids: number[] = []
): number[] => {
  const seed = `v6-ch-${chapterId}-lvl-${levelId}-diff-${difficulty}`;
  const rng = seedrandom(seed);
  const fullGrid = new Array(size * size).fill(0);

  for (const v of voids) {
    if (v >= 0 && v < fullGrid.length) {
      fullGrid[v] = -1;
    }
  }

  if (!fillGrid(fullGrid, 0, size, rng)) {
    console.error(`Solution generation failed for chapter ${chapterId} level ${levelId}`);
    return new Array(size * size).fill(0);
  }

  return fullGrid;
};

/**
 * Generates deterministic void positions.
 */
export const getSeededVoids = (
  levelId: number,
  size: number,
  count: number
): number[] => {
  const rng = seedrandom(`v6-chapter-3-voids-${levelId}`);
  const voids: number[] = [];
  const rowCounts = new Array(size).fill(0);
  const colCounts = new Array(size).fill(0);
  const positions = Array.from({ length: size * size }, (_, i) => i);

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const pos of positions) {
    if (voids.length >= count) break;
    const r = Math.floor(pos / size);
    const c = pos % size;

    if (rowCounts[r] < 1 && colCounts[c] < 1) {
      voids.push(pos);
      rowCounts[r]++;
      colCounts[c]++;
    }
  }

  return voids;
};

/**
 * Generates connected cage groups.
 */
const generateCages = (
  size: number,
  rng: any
): number[][] => {
  const total = size * size;
  const assigned = new Array<number>(total).fill(-1);
  const groups: number[][] = [];
  const order = Array.from({ length: total }, (_, i) => i);

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const neighbors = (idx: number) => {
    const r = Math.floor(idx / size);
    const c = idx % size;
    const out: number[] = [];
    if (r > 0) out.push(idx - size);
    if (r < size - 1) out.push(idx + size);
    if (c > 0) out.push(idx - 1);
    if (c < size - 1) out.push(idx + 1);
    return out;
  };

  for (const seed of order) {
    if (assigned[seed] !== -1) continue;

    const targetSize = 4 + Math.floor(rng() * 3);
    const group = [seed];
    assigned[seed] = groups.length;

    while (group.length < targetSize) {
      const frontier: number[] = [];
      for (const cell of group) {
        for (const n of neighbors(cell)) {
          if (assigned[n] === -1 && !frontier.includes(n)) {
            frontier.push(n);
          }
        }
      }

      if (frontier.length === 0) break;

      const pick = frontier[Math.floor(rng() * frontier.length)];
      assigned[pick] = groups.length;
      group.push(pick);
    }

    groups.push(group);
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i].length !== 1) continue;
    const only = groups[i][0];

    for (const n of neighbors(only)) {
      const otherId = assigned[n];
      if (otherId !== -1 && otherId !== i && groups[otherId]) {
        groups[otherId].push(only);
        assigned[only] = otherId;
        groups.splice(i, 1);

        for (let k = 0; k < assigned.length; k++) {
          if (assigned[k] > i) assigned[k]--;
        }
        break;
      }
    }
  }

  return groups;
};

/**
 * Chapter 4 cage puzzle generator.
 */
export const getChapter4Level = (
  levelId: number,
  size: number,
  difficulty: number
): {
  grid: number[];
  cages: Cage[];
} => {
  const seed = `v5-chapter-4-level-${levelId}`;
  const rng = seedrandom(seed);
  const solution = new Array(size * size).fill(0);

  if (!fillGrid(solution, 0, size, rng)) {
    console.error(`Chapter 4 level ${levelId} solution generation failed`);
    return {
      grid: new Array(size * size).fill(0),
      cages: [],
    };
  }

  const groups = generateCages(size, rng);
  const hideChance = Math.min(0.45, 0.25 + levelId * 0.01);

  const cages: Cage[] = groups.map((g) => {
    const sum = g.reduce((acc, i) => acc + solution[i], 0);
    const hide = rng() < hideChance;
    return {
      indices: g,
      target: hide ? undefined : sum,
    };
  });

  const puzzle = [...solution];
  const positions = Array.from({ length: size * size }, (_, i) => i);

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const targetRemove = Math.floor(
    positions.length * Math.min(0.75, difficulty + 0.15)
  );

  let removedCount = 0;

  for (const pos of positions) {
    if (removedCount >= targetRemove) break;

    const backup = puzzle[pos];
    puzzle[pos] = 0;

    if (
      !isSolvableByDeduction(puzzle, size, cages) ||
      !hasValidMoves(puzzle, size)
    ) {
      puzzle[pos] = backup;
    } else {
      removedCount++;
    }
  }

  return {
    grid: puzzle,
    cages,
  };
};

/**
 * Assigns cage colours so adjacent cages receive different colours.
 */
export const colorCages = (
  cages: Cage[],
  size: number,
  paletteSize: number
): number[] => {
  if (!cages || cages.length === 0) return [];

  const cageOf = new Array<number>(size * size).fill(-1);
  cages.forEach((c, i) =>
    c.indices.forEach((idx) => {
      cageOf[idx] = i;
    })
  );

  const adj: Set<number>[] = cages.map(() => new Set());

  for (let idx = 0; idx < cageOf.length; idx++) {
    const me = cageOf[idx];
    if (me === -1) continue;

    const row = Math.floor(idx / size);
    const col = idx % size;

    const neighbors = [
      row > 0 ? idx - size : -1,
      row < size - 1 ? idx + size : -1,
      col > 0 ? idx - 1 : -1,
      col < size - 1 ? idx + 1 : -1,
    ];

    for (const n of neighbors) {
      if (n === -1) continue;
      const other = cageOf[n];
      if (other !== -1 && other !== me) {
        adj[me].add(other);
      }
    }
  }

  const assigned: number[] = new Array(cages.length).fill(-1);

  for (let i = 0; i < cages.length; i++) {
    const used = new Set<number>();
    for (const n of adj[i]) {
      if (assigned[n] !== -1) {
        used.add(assigned[n]);
      }
    }

    for (let c = 0; c < paletteSize; c++) {
      if (!used.has(c)) {
        assigned[i] = c;
        break;
      }
    }

    if (assigned[i] === -1) {
      assigned[i] = i % paletteSize;
    }
  }

  return assigned;
};

/**
 * Generates the daily puzzle.
 */
export const getDailyLevel = (
  dateStr: string,
  size: number = 6,
  difficulty: number = 0.55
): {
  grid: number[];
  size: number;
} => {
  const seed = `daily-${dateStr}`;
  const rng = seedrandom(seed);
  const fullGrid = new Array(size * size).fill(0);

  if (!fillGrid(fullGrid, 0, size, rng)) {
    console.error(`Daily puzzle generation failed for ${dateStr}`);
    return {
      grid: new Array(size * size).fill(0),
      size,
    };
  }

  const puzzle = [...fullGrid];
  const positions = Array.from({ length: size * size }, (_, i) => i);

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const targetRemove = Math.floor(positions.length * difficulty);
  let removedCount = 0;

  for (const pos of positions) {
    if (removedCount >= targetRemove) break;

    const backup = puzzle[pos];
    puzzle[pos] = 0;

    if (
      countSolutions([...puzzle], 0, size) !== 1 ||
      !isSolvableByDeduction(puzzle, size, []) ||
      !hasValidMoves(puzzle, size)
    ) {
      puzzle[pos] = backup;
    } else {
      removedCount++;
    }
  }

  return {
    grid: puzzle,
    size,
  };
};