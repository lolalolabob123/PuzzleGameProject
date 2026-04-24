import seedrandom from 'seedrandom'
import type { Cage } from '../data/chapters';

const isValid = (grid: number[], index: number, color: number, size: number) => {
  const row = Math.floor(index / size);
  const col = index % size;
  const limit = size / 2;

  if (col >= 2 && grid[index - 1] === color && grid[index - 2] === color) return false
  if (row >= 2 && grid[index - size] === color && grid[index - 2 * size] === color) return false

  let rowVoids = 0, colVoids = 0
  for (let i = 0; i < size; i++) {
    if (grid[row * size + i] === -1) rowVoids++
    if (grid[i * size + col] === -1) colVoids++
  }

  const rowLimit = Math.ceil((size - rowVoids) / 2)
  const colLimit = Math.ceil((size - colVoids) / 2)

  let rowCount = 0
  for (let i = 0; i < col; i++) if (grid[row * size + i] === color) rowCount++
  if (rowCount >= rowLimit) return false

  let colCount = 0;
  for (let i = 0; i < row; i++) if (grid[i * size + col] === color) colCount++
  if (colCount >= colLimit) return false

  return true
};

const fillGrid = (grid: number[], index: number, size: number, rng: any): boolean => {
  if (index === grid.length) return true;

  if (grid[index] !== 0) return fillGrid(grid, index + 1, size, rng)

  const choices = rng() > 0.5 ? [1, 2] : [2, 1];

  for (const color of choices) {
    if (isValid(grid, index, color, size)) {
      grid[index] = color;
      if (fillGrid(grid, index + 1, size, rng)) return true;
      grid[index] = 0;
    }
  }
  return false;
};

export const getFixedLevel = (
  chapterId: number,
  levelId: number,
  size: number,
  difficulty: number,
  voids: number[] = []
): number[] => {
  const seed = `chapter-${chapterId}-level-${levelId}`;
  const rng = seedrandom(seed);

  const fullGrid = new Array(size * size).fill(0);
  for (const v of voids) fullGrid[v] = -1

  if (!fillGrid(fullGrid, 0, size, rng)) {
    console.error(`Puzzle generation failed for chapter ${chapterId} level ${levelId}`)
    return new Array(size * size).fill(0)
  }

  const puzzle = [...fullGrid];

  const positions = Array.from({ length: size * size }, (_, i) => i)
    .filter((i) => fullGrid[i] !== -1)
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]]
  }

  const targetRemove = Math.floor(positions.length * difficulty)
  let removedCount = 0

  for (const pos of positions) {
    if (removedCount >= targetRemove) break
    const backup = puzzle[pos]
    puzzle[pos] = 0
    if (countSolutions([...puzzle], 0, size) !== 1) {
      puzzle[pos] = backup
    } else {
      removedCount++
    }
  }
  return puzzle
};

const countSolutions = (grid: number[], index: number, size: number, limit: number = 2): number => {
  if (index === grid.length) return 1;
  if (grid[index] !== 0) return countSolutions(grid, index + 1, size, limit);

  let total = 0;
  for (const color of [1, 2]) {
    if (isValid(grid, index, color, size)) {
      grid[index] = color;
      total += countSolutions(grid, index + 1, size, limit);
      grid[index] = 0;
      if (total >= limit) return total;
    }
  }
  return total;
};

const canCageReachTarget = (
  grid: number[],
  cage: Cage
): boolean => {
  if (cage.target === undefined) return true
  let sum = 0
  let empties = 0
  for (const i of cage.indices) {
    if (grid[i] === 0) empties++
    else if (grid[i] > 0) sum += grid[i]
  }
  return sum + empties * 1 <= cage.target && sum + empties * 2 >= cage.target
}

export const getFullSolution = (chapterId: number, levelId: number, size: number): number[] => {
  const seed = `chapter-${chapterId}-level-${levelId}`;
  const rng = seedrandom(seed);

  const fullGrid = new Array(size * size).fill(0);
  fillGrid(fullGrid, 0, size, rng);

  return fullGrid;
};

export const getSeededVoids = (levelId: number, size: number, count: number): number[] => {
  const rng = seedrandom(`chapter-3-voids-${levelId}`);
  const positions = Array.from({ length: size * size }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions.slice(0, count);
};

const generateCages = (size: number, rng: any): number[][] => {
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
    const targetSize = 4 + Math.floor(rng() * 3)
    const group = [seed];
    assigned[seed] = groups.length;

    while (group.length < targetSize) {
      const frontier: number[] = [];
      for (const cell of group) {
        for (const n of neighbors(cell)) {
          if (assigned[n] === -1 && !frontier.includes(n)) frontier.push(n);
        }
      }
      if (frontier.length === 0) break;
      const pick = frontier[Math.floor(rng() * frontier.length)];
      assigned[pick] = groups.length;
      group.push(pick);
    }

    groups.push(group);
  }

  // Merge any singletons into a neighboring group.
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i].length !== 1) continue;
    const only = groups[i][0];
    for (const n of neighbors(only)) {
      const otherId = assigned[n];
      if (otherId !== i && groups[otherId]) {
        groups[otherId].push(only);
        assigned[only] = otherId;
        groups.splice(i, 1);
        for (let k = 0; k < assigned.length; k++) {
          if (assigned[k] > i) assigned[k] -= 1;
        }
        break;
      }
    }
  }

  return groups;
};

// Binairo uniqueness check that also respects cage sum constraints.
// Short-circuits at `limit` solutions (default 2 — we only care about "is it unique").
const countSolutionsCaged = (
  grid: number[],
  size: number,
  cages: Cage[],
  limit: number = 2
): number => {
  const cageByIndex: number[] = new Array(grid.length).fill(-1);
  cages.forEach((c, ci) => c.indices.forEach(i => { cageByIndex[i] = ci; }));

  const cageReachable = (ci: number): boolean => {
    const cage = cages[ci];
    if (cage.target === undefined) return true
    let sum = 0, empties = 0;
    for (const idx of cage.indices) {
      const v = grid[idx];
      if (v === 0) empties++;
      else if (v > 0) sum += v;
    }
    if (empties === 0) return sum === cage.target;
    return sum + empties * 1 <= cage.target && sum + empties * 2 >= cage.target;
  };

  const recurse = (i: number): number => {
    if (i === grid.length) {
      for (let ci = 0; ci < cages.length; ci++) {
        if (!cageReachable(ci)) return 0;
      }
      return 1;
    }
    if (grid[i] !== 0) return recurse(i + 1);

    let total = 0;
    for (const color of [1, 2]) {
      if (isValid(grid, i, color, size)) {
        grid[i] = color;
        const ci = cageByIndex[i];
        if (ci === -1 || cageReachable(ci)) {
          total += recurse(i + 1);
          if (total >= limit) { grid[i] = 0; return total; }
        }
        grid[i] = 0;
      }
    }
    return total;
  };

  return recurse(0);
};

export const getChapter4Level = (
  levelId: number,
  size: number,
  difficulty: number
): { grid: number[]; cages: Cage[] } => {
  const seed = `chapter-4-level-${levelId}`;
  const rng = seedrandom(seed);

  const solution = new Array(size * size).fill(0);
  if (!fillGrid(solution, 0, size, rng)) {
    console.error(`Chapter 4 level ${levelId} solution generation failed`);
    return { grid: new Array(size * size).fill(0), cages: [] };
  }

  const groups = generateCages(size, rng);
  const hideChance = Math.min(0.45, 0.25 + (levelId * 0.01))
  const cages: Cage[] = groups.map(g => {
    const sum = g.reduce((acc, i) => acc + solution[i], 0)
    const hide = rng() < hideChance
    return {
      indices: g,
      target: hide ? undefined : sum,
    }
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
    if (!isSolvableByDeduction(puzzle, size, cages)) {
      puzzle[pos] = backup
    } else {
      removedCount++
    }
  }
  return { grid: puzzle, cages };
};

const cagePermits = (
  grid: number[],
  index: number,
  color: number,
  cages: Cage[],
): boolean => {
  for (const cage of cages) {
    if (cage.target === undefined) continue;
    if (!cage.indices.includes(index)) continue;

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
      if (sum + empties > cage.target) return false; // can't undershoot enough
      if (sum + empties * 2 < cage.target) return false; // can't overshoot enough
    }
  }
  return true;
};

const deduceOnce = (
  grid: number[],
  size: number,
  cages: Cage[],
): number => {
  let filled = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== 0) continue;

    const canBe1 = isValid(grid, i, 1, size) && cagePermits(grid, i, 1, cages);
    const canBe2 = isValid(grid, i, 2, size) && cagePermits(grid, i, 2, cages);

    if (!canBe1 && !canBe2) return -1;
    if (canBe1 && !canBe2) { grid[i] = 1; filled++; }
    else if (canBe2 && !canBe1) { grid[i] = 2; filled++; }
  }
  return filled;
};

const isSolvableByDeduction = (
  startingGrid: number[],
  size: number,
  cages: Cage[],
): boolean => {
  const grid = [...startingGrid];
  while (grid.some(c => c === 0)) {
    const progress = deduceOnce(grid, size, cages);
    if (progress <= 0) return false;
  }
  return true;
};

export const colorCages = (
  cages: Cage[],
  size: number,
  paletteSize: number,
): number[] => {
  const cageOf = new Array<number>(size * size).fill(-1)
  cages.forEach((c, i) => c.indices.forEach(idx => {cageOf[idx] = i}))

  const adj: Set<number>[] = cages.map(() => new Set())
  for (let idx = 0; idx < cageOf.length; idx++) {
    const me = cageOf[idx]
    if (me === -1) continue
    const row = Math.floor(idx / size), col = idx % size
    const neighbors = [
      row > 0 ? idx - size : -1,
      row < size - 1 ? idx + size : -1,
      col > 0 ? idx - 1 : -1,
      col < size - 1 ? idx + 1 : -1,
    ]
    for (const n of neighbors) {
      if (n === -1) continue
      const other = cageOf[n]
      if (other !== -1 && other != me) {
        adj[me].add(other)
      }
    }
  }

  const assigned: number[] = new Array(cagePermits.length).fill(-1)
  for (let i = 0; i < cagePermits.length; i++) {
    const used = new Set<number>()
    for (const n  of adj[i]) if (assigned[n] !== -1) used.add(assigned[n])
      for (let c = 0; c < paletteSize; c++) {
    if (!used.has(c)) {assigned[i] = c; break}
    }
    if (assigned[i] === -1) assigned[i] = i  % paletteSize
  }
  return assigned
}