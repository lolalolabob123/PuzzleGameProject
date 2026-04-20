import seedrandom from 'seedrandom'

const isValid = (grid: number[], index: number, color: number, size: number) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const limit = size / 2;

    if (col >= 2) {
        if (grid[index - 1] === color && grid[index - 2] === color) return false;
    }
    if (row >= 2) {
        if (grid[index - size] === color && grid[index - 2 * size] === color) return false;
    }

    let rowCount = 0;
    for (let i = 0; i < col; i++) {
        if (grid[row * size + i] === color) rowCount++;
    }
    if (rowCount >= limit) return false;

    let colCount = 0;
    for (let i = 0; i < row; i++) {
        if (grid[i * size + col] === color) colCount++;
    }
    if (colCount >= limit) return false;

    return true;
};
const fillGrid = (grid: number[], index: number, size: number, rng: any): boolean => {
    if (index === grid.length) return true;

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

export const getFixedLevel = (chapterId: number, levelId: number, size: number, difficulty: number) => {
  const seed = `chapter-${chapterId}-level-${levelId}`;
  const rng = seedrandom(seed);

  const fullGrid = new Array(size * size).fill(0);
  fillGrid(fullGrid, 0, size, rng);

  const puzzle = [...fullGrid];
  
  // Create a list of all positions and shuffle them using the seed
  const positions = Array.from({ length: size * size }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let removedCount = 0;
  const targetRemove = Math.floor(size * size * difficulty);

  for (const pos of positions) {
    if (removedCount >= targetRemove) break;

    const backup = puzzle[pos];
    puzzle[pos] = 0;

    if (countSolutions([...puzzle], 0, size) !== 1) {
      puzzle[pos] = backup;
    } else {
      removedCount++;
    }
  }

  return puzzle;
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

export const getFullSolution = (chapterId: number, levelId: number, size: number) => {
  const seed = `chapter-${chapterId}-level-${levelId}`;
  const rng = seedrandom(seed);

  const fullGrid = new Array(size * size).fill(0);
  fillGrid(fullGrid, 0, size, rng);

  return fullGrid;
};