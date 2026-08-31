import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  LayoutChangeEvent,
  Platform,
  Alert,
} from "react-native";

import {
  getFreeHintsRemaining,
  consumeFreeHint,
} from "../utils/hints";

import {
  unlockNextLevel,
  saveLevelState,
  getLevelState,
  saveLevelStars,
  getLevelStars,
} from "../utils/progress";

import { useTheme } from "../context/ThemeContext";

import { Level } from "../data/chapters";

import {
  colorCages,
  getFullSolution,
} from "../utils/levelGenerator";

import {
  addCoins,
  getEffectCount,
  incrementEffect,
} from "../utils/coins";

import {
  checkAndGrantAchievements,
} from "../utils/achievements";

import ConfettiCanon from "react-native-confetti-cannon";

import {
  spacing,
  radii,
  typography,
  shadows,
  UITheme,
} from "../constants/uiTheme";

import { playSound } from "../utils/audio";

import {
  lightImpact,
  successHaptic,
  errorHaptic,
} from "../utils/haptics";

import {
  hasSolvedToday,
  markDailySolved,
} from "../utils/daily";

interface PuzzleBoardProps {
  size: number;
  levelData: Level;
  chapterId: number;
  level: number;
  onNextLevel: () => void;
  forcedReset?: boolean;
  daily?: boolean;
}

export default function PuzzleBoard({
  size = 4,
  levelData,
  chapterId,
  level,
  onNextLevel,
  forcedReset = false,
  daily = false,
}: PuzzleBoardProps) {
  const INDICATOR_WIDTH = 45;

  const gridData = useMemo(
    () => levelData?.grid || [],
    [levelData]
  );

  const { theme, ui: uiTheme } = useTheme();

  const styles = useMemo(
    () => makeStyles(uiTheme),
    [uiTheme]
  );

  const [containerWidth, setContainerWidth] = useState(0);

  const { cellSize, boardSize } = useMemo(() => {
    if (containerWidth === 0) {
      return {
        cellSize: 0,
        boardSize: 0,
      };
    }

    const PADDING = spacing.lg * 2;
    const BOARD_BORDER = 2;

    const maxWidth =
      containerWidth -
      INDICATOR_WIDTH -
      PADDING;

    const finalCellSize = Math.max(
      30,
      Math.floor(
        (maxWidth - BOARD_BORDER) / size
      )
    );

    return {
      cellSize: finalCellSize,
      boardSize:
        finalCellSize * size +
        BOARD_BORDER,
    };
  }, [containerWidth, size]);

  const handleContainerLayout = (
    e: LayoutChangeEvent
  ) => {
    const { width } =
      e.nativeEvent.layout;

    if (width > 0) {
      setContainerWidth(width);
    }
  };

  const [cells, setCells] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] =
    useState(true);

  const [winModalVisible, setWinModalVisible] =
    useState(false);

  const [history, setHistory] = useState<
    number[][]
  >([]);

  const [freeHints, setFreeHints] =
    useState(0);

  const [extraHints, setExtraHints] =
    useState(0);

  const [hintIndex, setHintIndex] =
    useState<number | null>(null);

  const [moveCount, setMoveCount] =
    useState(0);

  const [winStars, setWinStars] =
    useState(0);

  const [winPreviousStars, setWinPreviousStars] =
    useState(0);

  const hasWonRef =
    useRef(false);

  const shakeAnim =
    useRef(new Animated.Value(0)).current;

  const hintPulse =
    useRef(new Animated.Value(1)).current;

  const wrongPulse =
    useRef(new Animated.Value(1)).current;

  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const refreshHintState =
    useCallback(async () => {
      setFreeHints(
        await getFreeHintsRemaining()
      );

      setExtraHints(
        await getEffectCount("extra-hints")
      );
    }, []);

  /*
   * VALIDATION
   *
   * IMPORTANT:
   * -1 represents a physical void.
   *
   * We must NOT remove voids from the array before
   * checking consecutive tiles.
   *
   * For example:
   *
   * 1 1 -1 1
   *
   * is NOT:
   *
   * 1 1 1
   *
   * because the void physically separates the cells.
   */
  const getValidationState = useCallback(
    (arr: number[]) => {
      const playableSpace =
        arr.filter((c) => c !== -1).length;

      const minRequired =
        Math.floor(playableSpace / 2);

      const maxAllowed =
        Math.ceil(playableSpace / 2);

      const counts = {
        one: arr.filter((c) => c === 1).length,
        two: arr.filter((c) => c === 2).length,
      };

      /*
       * Check physical consecutive positions.
       *
       * A void (-1) automatically breaks a sequence.
       */
      let consecutiveFound = false;

      for (
        let i = 0;
        i < arr.length - 2;
        i++
      ) {
        if (
          arr[i] !== -1 &&
          arr[i] > 0 &&
          arr[i] === arr[i + 1] &&
          arr[i] === arr[i + 2]
        ) {
          consecutiveFound = true;
          break;
        }
      }

      const isInvalid =
        consecutiveFound ||
        counts.one > maxAllowed ||
        counts.two > maxAllowed;

      const filledCount =
        counts.one + counts.two;

      const isComplete =
        filledCount === playableSpace &&
        counts.one >= minRequired &&
        counts.one <= maxAllowed &&
        counts.two >= minRequired &&
        counts.two <= maxAllowed &&
        !consecutiveFound;

      return {
        isInvalid,
        isComplete,
        counts,
      };
    },
    []
  );

  const checkWin = useCallback(
    (board: number[]) => {
      if (
        !board.length ||
        board.some((c) => c === 0)
      ) {
        return false;
      }

      for (
        let i = 0;
        i < size;
        i++
      ) {
        const row = board.slice(
          i * size,
          (i + 1) * size
        );

        const col = Array.from(
          { length: size }
        ).map(
          (_, r) =>
            board[r * size + i]
        );

        if (
          !getValidationState(row)
            .isComplete ||
          !getValidationState(col)
            .isComplete
        ) {
          return false;
        }
      }

      if (levelData.cages) {
        for (
          const cage of levelData.cages
        ) {
          if (
            cage.target === undefined
          ) {
            continue;
          }

          const sum =
            cage.indices.reduce(
              (acc, idx) =>
                acc +
                (board[idx] > 0
                  ? board[idx]
                  : 0),
              0
            );

          if (
            sum !== cage.target
          ) {
            return false;
          }
        }
      }

      return true;
    },
    [
      size,
      getValidationState,
      levelData.cages,
    ]
  );

  const cycleCell = (
    index: number
  ) => {
    if (
      isInitializing ||
      gridData[index] !== 0 ||
      hasWonRef.current
    ) {
      return;
    }

    const newCells = [...cells];

    const currentVal =
      cells[index];

    const nextVal =
      (currentVal + 1) % 3;

    const linkGroup =
      levelData.links?.find(
        (group) =>
          group.indices.includes(index)
      );

    if (linkGroup) {
      linkGroup.indices.forEach(
        (i) => {
          newCells[i] = nextVal;
        }
      );
    } else {
      newCells[index] =
        nextVal;
    }

    if (currentVal === 0) {
      setMoveCount(
        (m) => m + 1
      );
    }

    setHistory(
      (h) =>
        [
          ...h,
          [...cells],
        ].slice(-20)
    );

    setCells(newCells);

    lightImpact();
    playSound("tilePlace");

    saveLevelState(
      chapterId,
      level,
      newCells
    );
  };

  const handleWin =
    async () => {
      if (hasWonRef.current) {
        return;
      }

      hasWonRef.current = true;

      const emptyCount =
        gridData.filter(
          (c: number) =>
            c === 0
        ).length || 1;

      const multiplier =
        chapterId === 4
          ? 1.15
          : Math.max(
              1.1,
              1.8 -
                (chapterId - 1) *
                  0.2
            );

      let stars = 1;

      if (
        moveCount <=
        emptyCount * multiplier
      ) {
        stars = 3;
      } else if (
        moveCount <=
        emptyCount *
          (multiplier + 0.5)
      ) {
        stars = 2;
      }

      let previousStars = 0;

      if (daily) {
        const alreadySolved =
          await hasSolvedToday();

        if (!alreadySolved) {
          await markDailySolved();
        }
      } else {
        previousStars =
          await getLevelStars(
            chapterId,
            level
          );

        const COIN_PER_STAR = 5;

        if (
          stars >
          previousStars
        ) {
          await addCoins(
            (stars -
              previousStars) *
              COIN_PER_STAR
          );
        }

        await saveLevelStars(
          chapterId,
          level,
          stars
        );

        await unlockNextLevel(
          chapterId,
          level
        );
      }

      setWinStars(stars);
      setWinPreviousStars(
        previousStars
      );

      const newlyEarned =
        await checkAndGrantAchievements();

      if (
        newlyEarned.length > 0
      ) {
        const list =
          newlyEarned
            .map(
              (a) =>
                `🏆 ${a.title} (+${a.reward} coins)`
            )
            .join("\n");

        Platform.OS === "web"
          ? window.alert(list)
          : Alert.alert(
              "Achievement unlocked!",
              list
            );
      }

      successHaptic();

      setWinModalVisible(
        true
      );

      playSound("win");

      starAnims
        .slice(0, stars)
        .forEach((a, i) => {
          Animated.spring(a, {
            toValue: 1,
            friction: 5,
            tension: 40,
            delay: i * 200,
            useNativeDriver: true,
          }).start();
        });
    };

  const triggerShake = () => {
    errorHaptic();

    Animated.sequence([
      Animated.timing(
        shakeAnim,
        {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }
      ),
      Animated.timing(
        shakeAnim,
        {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }
      ),
      Animated.timing(
        shakeAnim,
        {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }
      ),
    ]).start();
  };

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      setWinModalVisible(false);
      setMoveCount(0);
      setHintIndex(null);

      await refreshHintState();

      hasWonRef.current = false;

      starAnims.forEach(
        (a) => a.setValue(0)
      );

      const purchasedHints =
        await getEffectCount(
          "extra-hints"
        );

      setExtraHints(
        purchasedHints
      );

      const saved =
        await getLevelState(
          chapterId,
          level
        );

      const safeSaved =
        saved || [];

      const lengthMatches =
        safeSaved.length ===
        gridData.length;

      const hintsMatch =
        lengthMatches &&
        gridData.every(
          (v, i) =>
            v === 0 ||
            safeSaved[i] === v
        );

      const isFinished =
        lengthMatches &&
        !safeSaved.includes(0);

      const useSaved =
        !forcedReset &&
        hintsMatch &&
        !isFinished;

      setCells(
        useSaved
          ? safeSaved
          : [...gridData]
      );

      setIsInitializing(false);
    };

    init();
  }, [
    level,
    chapterId,
    forcedReset,
    gridData,
    refreshHintState,
    starAnims,
  ]);

  const suspectCellIndices =
    useMemo(() => {
      const empty =
        new Set<number>();

      if (
        !cells.length ||
        cells.some(
          (c) => c === 0
        )
      ) {
        return empty;
      }

      if (!levelData.cages) {
        return empty;
      }

      /*
       * First make sure every row and column
       * satisfies the normal Takuzu rules.
       */
      for (
        let i = 0;
        i < size;
        i++
      ) {
        const row =
          cells.slice(
            i * size,
            (i + 1) * size
          );

        const col =
          Array.from(
            { length: size },
            (_, r) =>
              cells[
                r * size + i
              ]
          );

        if (
          !getValidationState(row)
            .isComplete
        ) {
          return empty;
        }

        if (
          !getValidationState(col)
            .isComplete
        ) {
          return empty;
        }
      }

      const suspect =
        new Set<number>();

      for (
        const cage of levelData.cages
      ) {
        if (
          cage.target ===
          undefined
        ) {
          continue;
        }

        const sum =
          cage.indices.reduce(
            (acc, idx) =>
              acc +
              (cells[idx] > 0
                ? cells[idx]
                : 0),
            0
          );

        if (
          sum !== cage.target
        ) {
          cage.indices.forEach(
            (i) =>
              suspect.add(i)
          );
        }
      }

      return suspect;
    }, [
      cells,
      size,
      getValidationState,
      levelData.cages,
    ]);

  useEffect(() => {
    if (
      isInitializing ||
      hasWonRef.current ||
      cells.length === 0
    ) {
      return;
    }

    if (
      cells.every(
        (c) => c !== 0
      )
    ) {
      if (
        checkWin(cells)
      ) {
        handleWin();
      } else if (
        suspectCellIndices.size === 0
      ) {
        triggerShake();
      }
    }
  }, [
    cells,
    isInitializing,
    checkWin,
    suspectCellIndices,
  ]);

  useEffect(() => {
    if (
      suspectCellIndices.size === 0
    ) {
      wrongPulse.setValue(1);
      return;
    }

    const animation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            wrongPulse,
            {
              toValue: 0.35,
              duration: 600,
              useNativeDriver: true,
            }
          ),
          Animated.timing(
            wrongPulse,
            {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }
          ),
        ])
      );

    animation.start();

    return () => {
      animation.stop();
      wrongPulse.setValue(1);
    };
  }, [
    suspectCellIndices,
    wrongPulse,
  ]);

  const handleReset = () => {
    const fresh =
      [...gridData];

    hasWonRef.current =
      false;

    setWinModalVisible(
      false
    );

    setCells(fresh);
    setHistory([]);
    setMoveCount(0);
    setHintIndex(null);

    starAnims.forEach(
      (a) => a.setValue(0)
    );

    saveLevelState(
      chapterId,
      level,
      fresh
    );
  };

  const cageInfo =
    useMemo(() => {
      const byIndex: number[] =
        new Array(
          size * size
        ).fill(-1);

      const targetByIndex:
        Record<number, number> =
        {};

      const colorByIndex:
        string[] =
        new Array(
          size * size
        ).fill(
          "transparent"
        );

      if (
        levelData.cages
      ) {
        const tintAssignments =
          colorCages(
            levelData.cages,
            size,
            uiTheme.cageTints
              .length
          );

        levelData.cages.forEach(
          (
            cage,
            cageIdx
          ) => {
            const tint =
              uiTheme.cageTints[
                tintAssignments[
                  cageIdx
                ]
              ];

            cage.indices.forEach(
              (i) => {
                byIndex[i] =
                  cageIdx;

                colorByIndex[i] =
                  tint;
              }
            );

            if (
              cage.target !==
              undefined
            ) {
              const representativeIndex =
                Math.min(
                  ...cage.indices
                );

              targetByIndex[
                representativeIndex
              ] =
                cage.target;
            }
          }
        );
      }

      return {
        byIndex,
        targetByIndex,
        colorByIndex,
      };
    }, [
      levelData.cages,
      size,
      uiTheme,
    ]);

  const getCageEdges =
    useCallback(
      (index: number) => {
        const myCage =
          cageInfo.byIndex[
            index
          ];

        if (
          myCage === -1
        ) {
          return null;
        }

        const row =
          Math.floor(
            index / size
          );

        const col =
          index % size;

        const differs = (
          nRow: number,
          nCol: number,
          nIdx: number
        ) => {
          if (
            nRow < 0 ||
            nRow >= size ||
            nCol < 0 ||
            nCol >= size
          ) {
            return true;
          }

          return (
            cageInfo.byIndex[
              nIdx
            ] !== myCage
          );
        };

        return {
          top: differs(
            row - 1,
            col,
            index - size
          ),

          bottom: differs(
            row + 1,
            col,
            index + size
          ),

          left: differs(
            row,
            col - 1,
            index - 1
          ),

          right: differs(
            row,
            col + 1,
            index + 1
          ),

          target:
            cageInfo
              .targetByIndex[
              index
            ],

          tint:
            cageInfo
              .colorByIndex[
              index
            ],
        };
      },
      [
        cageInfo,
        size,
      ]
    );

  if (isInitializing) {
    return (
      <View
        style={
          styles.container
        }
      >
        <Text
          style={
            styles.loadingText
          }
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      <WinModal
        visible={
          winModalVisible
        }
        starAnims={
          starAnims
        }
        starCount={
          winStars
        }
        previousStars={
          winPreviousStars
        }
        moves={
          moveCount
        }
        onNext={
          onNextLevel
        }
      />

      <View
        style={styles.header}
      >
        <Text
          style={
            styles.moveText
          }
        >
          MOVES: {moveCount}
        </Text>
      </View>

      <View
        style={
          styles.gameWrapper
        }
        onLayout={
          handleContainerLayout
        }
      >
        {containerWidth > 0 &&
          cellSize > 0 && (
            <>
              <View
                style={{
                  flexDirection:
                    "row",
                }}
              >
                <View
                  style={{
                    width:
                      INDICATOR_WIDTH,
                  }}
                />

                <View
                  style={{
                    flexDirection:
                      "row",
                    width:
                      boardSize,
                    paddingHorizontal:
                      1,
                  }}
                >
                  {Array.from({
                    length: size,
                  }).map(
                    (
                      _,
                      colIdx
                    ) => {
                      const col =
                        Array.from({
                          length:
                            size,
                        }).map(
                          (_, r) =>
                            cells[
                              r *
                                size +
                                colIdx
                            ]
                        );

                      const {
                        isInvalid,
                        isComplete,
                        counts,
                      } =
                        getValidationState(
                          col
                        );

                      return (
                        <View
                          key={
                            colIdx
                          }
                          style={{
                            width:
                              cellSize,
                            alignItems:
                              "center",
                          }}
                        >
                          <Text
                            style={[
                              styles.indicatorText,
                              isInvalid &&
                                styles.textRed,
                              isComplete &&
                                styles.textGreen,
                            ]}
                          >
                            {
                              counts.one
                            }
                            {"\n"}
                            {
                              counts.two
                            }
                          </Text>
                        </View>
                      );
                    }
                  )}
                </View>
              </View>

              <Animated.View
                style={[
                  styles.boardRow,
                  {
                    transform: [
                      {
                        translateX:
                          shakeAnim,
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    styles.rowIndicators,
                    {
                      width:
                        INDICATOR_WIDTH,
                      paddingVertical:
                        1,
                    },
                  ]}
                >
                  {Array.from({
                    length: size,
                  }).map(
                    (
                      _,
                      rowIdx
                    ) => {
                      const row =
                        cells.slice(
                          rowIdx *
                            size,
                          (rowIdx +
                            1) *
                            size
                        );

                      const {
                        isInvalid,
                        isComplete,
                        counts,
                      } =
                        getValidationState(
                          row
                        );

                      return (
                        <View
                          key={
                            rowIdx
                          }
                          style={{
                            height:
                              cellSize,
                            justifyContent:
                              "center",
                          }}
                        >
                          <Text
                            style={[
                              styles.indicatorText,
                              {
                                textAlign:
                                  "right",
                                paddingRight:
                                  8,
                              },
                              isInvalid &&
                                styles.textRed,
                              isComplete &&
                                styles.textGreen,
                            ]}
                          >
                            {
                              counts.one
                            }
                            |
                            {
                              counts.two
                            }
                          </Text>
                        </View>
                      );
                    }
                  )}
                </View>

                <View
                  style={[
                    styles.board,
                    {
                      width:
                        boardSize,
                      height:
                        boardSize,
                    },
                  ]}
                >
                  {cells.map(
                    (val, i) => (
                      <Tile
                        key={i}
                        val={val}
                        isFixed={
                          gridData[
                            i
                          ] !== 0
                        }
                        linkedColor={
                          levelData.links?.find(
                            (g) =>
                              g.indices.includes(
                                i
                              )
                          )?.color
                        }
                        onPress={() =>
                          cycleCell(i)
                        }
                        size={
                          cellSize
                        }
                        isHinted={
                          hintIndex ===
                          i
                        }
                        hintAnim={
                          hintPulse
                        }
                        cageEdges={
                          getCageEdges(
                            i
                          )
                        }
                        chapterId={
                          chapterId
                        }
                        isWrong={suspectCellIndices.has(
                          i
                        )}
                        wrongAnim={
                          wrongPulse
                        }
                      />
                    )
                  )}
                </View>
              </Animated.View>
            </>
          )}
      </View>

      <View
        style={
          styles.buttonRow
        }
      >
        <TouchableOpacity
          style={
            styles.actionButton
          }
          onPress={
            handleReset
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Reset
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.actionButton
          }
          onPress={() => {
            if (
              history.length >
              0
            ) {
              const last =
                history[
                  history.length -
                    1
                ];

              setCells(last);

              setHistory(
                (h) =>
                  h.slice(
                    0,
                    -1
                  )
              );

              playSound(
                "hint"
              );
            }
          }}
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Undo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.hintButton,
          ]}
          disabled={
            freeHints +
              extraHints <=
            0
          }
          onPress={async () => {
            if (
              freeHints +
                extraHints <=
              0
            ) {
              return;
            }

            let target =
              cells.findIndex(
                (c, idx) =>
                  c === 0 &&
                  gridData[
                    idx
                  ] === 0
              );

            if (
              target === -1
            ) {
              const solution =
                getFullSolution(
                  chapterId,
                  level,
                  size
                );

              target =
                cells.findIndex(
                  (c, idx) =>
                    c !== 0 &&
                    gridData[
                      idx
                    ] === 0 &&
                    c !==
                      solution[
                        idx
                      ]
                );
            }

            if (
              target === -1
            ) {
              return;
            }

            setHintIndex(
              target
            );

            playSound(
              "hint"
            );

            if (
              freeHints > 0
            ) {
              await consumeFreeHint();
            } else {
              await incrementEffect(
                "extra-hints",
                -1
              );
            }

            await refreshHintState();

            Animated.sequence([
              Animated.timing(
                hintPulse,
                {
                  toValue: 1.3,
                  duration: 300,
                  useNativeDriver: true,
                }
              ),
              Animated.timing(
                hintPulse,
                {
                  toValue: 1.0,
                  duration: 300,
                  useNativeDriver: true,
                }
              ),
            ]).start(() =>
              setHintIndex(null)
            );
          }}
        >
          <Text
            style={
              styles.hintButtonText
            }
          >
            Hint (
            {freeHints +
              extraHints}
            )
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type TileProps = {
  val: number;
  isFixed: boolean;
  linkedColor?: string;
  onPress: () => void;
  size: number;
  isHinted: boolean;
  hintAnim: Animated.Value;
  cageEdges: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    target?: number;
    tint?: string;
  } | null;
  chapterId: number;
  isWrong: boolean;
  wrongAnim: Animated.Value;
};

const Tile = ({
  val,
  isFixed,
  linkedColor,
  onPress,
  size,
  isHinted,
  hintAnim,
  cageEdges,
  chapterId,
  isWrong,
  wrongAnim,
}: TileProps) => {
  const { theme, ui: uiTheme } =
    useTheme();

  const styles = useMemo(
    () => makeStyles(uiTheme),
    [uiTheme]
  );

  if (val === -1) {
    return (
      <View
        style={{
          width: size,
          height: size,
          padding: 2,
        }}
      >
        <View
          style={[
            styles.fullCell,
            styles.voidCell,
            {
              borderRadius:
                radii.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.voidCellMark,
              {
                fontSize:
                  size * 0.4,
              },
            ]}
          >
            ×
          </Text>
        </View>
      </View>
    );
  }

  const cageBorderThickness =
    uiTheme.isDark
      ? 3
      : 3.5;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isFixed}
      style={{
        width: size,
        height: size,
        padding: 2,
      }}
    >
      <Animated.View
        style={[
          { flex: 1 },
          isHinted && {
            transform: [
              {
                scale:
                  hintAnim,
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.fullCell,
            {
              backgroundColor:
                theme.tileColor,

              borderRadius:
                radii.sm,

              borderTopWidth:
                cageEdges?.top
                  ? 0
                  : 1.5,

              borderBottomWidth:
                cageEdges?.bottom
                  ? 0
                  : 1.5,

              borderLeftWidth:
                cageEdges?.left
                  ? 0
                  : 1.5,

              borderRightWidth:
                cageEdges?.right
                  ? 0
                  : 1.5,

              borderColor:
                theme.tileEdgeColor,

              opacity:
                isFixed
                  ? 0.65
                  : 1,
            },
          ]}
        >
          {val !== 0 && (
            <View
              style={{
                width:
                  size * 0.6,
                height:
                  size * 0.6,
                borderRadius:
                  size * 0.3,
                backgroundColor:
                  val === 1
                    ? theme.shape1Color
                    : theme.shape2Color,
                ...shadows.sm,
              }}
            />
          )}

          {linkedColor &&
            !isFixed && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor:
                      linkedColor,
                    borderRadius:
                      radii.sm,
                    borderWidth:
                      1.5,
                    borderColor:
                      linkedColor.replace(
                        /[\d.]+\)$/,
                        "0.6)"
                      ),
                  },
                ]}
              />
            )}

          {val !== 0 &&
            chapterId === 4 && (
              <Text
                style={[
                  styles.tileValueOverlay,
                  {
                    fontSize:
                      size * 0.3,
                  },
                ]}
              >
                {val}
              </Text>
            )}

          {cageEdges && (
            <>
              {cageEdges.tint && (
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor:
                        cageEdges.tint,
                      borderRadius:
                        radii.sm -
                        2,
                    },
                  ]}
                />
              )}

              <View
                pointerEvents="none"
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderColor:
                    uiTheme.cageBorder,

                  borderTopWidth:
                    cageEdges.top
                      ? cageBorderThickness
                      : 0,

                  borderBottomWidth:
                    cageEdges.bottom
                      ? cageBorderThickness
                      : 0,

                  borderLeftWidth:
                    cageEdges.left
                      ? cageBorderThickness
                      : 0,

                  borderRightWidth:
                    cageEdges.right
                      ? cageBorderThickness
                      : 0,
                }}
              />
            </>
          )}

          {cageEdges?.target !==
            undefined && (
            <Text
              style={[
                styles.cageTargetText,
                {
                  fontSize:
                    Math.max(
                      11,
                      size * 0.22
                    ),
                },
              ]}
            >
              {
                cageEdges.target
              }
            </Text>
          )}

          {isWrong && (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius:
                    radii.sm,
                  borderWidth: 3,
                  borderColor:
                    uiTheme.danger,
                  opacity:
                    wrongAnim,
                },
              ]}
            />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

type WinModalProps = {
  visible: boolean;
  starAnims: Animated.Value[];
  starCount: number;
  previousStars: number;
  moves: number;
  onNext: () => void;
};

const WinModal = ({
  visible,
  starAnims,
  moves,
  onNext,
  starCount,
  previousStars,
}: WinModalProps) => {
  const { ui: uiTheme } =
    useTheme();

  const styles = useMemo(
    () => makeStyles(uiTheme),
    [uiTheme]
  );

  const newStarsEarned =
    Math.max(
      0,
      starCount -
        previousStars
    );

  const coinsEarned =
    newStarsEarned * 5;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View
        style={
          styles.modalOverlay
        }
      >
        {visible && (
          <ConfettiCanon
            count={80}
            origin={{
              x: -10,
              y: 0,
            }}
            fallSpeed={2500}
            fadeOut
          />
        )}

        <View
          style={
            styles.modalContent
          }
        >
          <Text
            style={
              styles.winTitle
            }
          >
            Level Cleared!
          </Text>

          <Text
            style={
              styles.winSub
            }
          >
            Moves used: {moves}
          </Text>

          <View
            style={
              styles.starsRow
            }
          >
            {[0, 1, 2].map(
              (idx) => {
                const isActive =
                  idx <
                  starCount;

                return (
                  <Animated.Text
                    key={idx}
                    style={[
                      styles.starIcon,
                      {
                        transform: [
                          {
                            scale:
                              starAnims[
                                idx
                              ].interpolate(
                                {
                                  inputRange:
                                    [
                                      0,
                                      1,
                                    ],
                                  outputRange:
                                    [
                                      0.3,
                                      1,
                                    ],
                                }
                              ),
                          },
                        ],
                        opacity:
                          starAnims[
                            idx
                          ],
                      },
                    ]}
                  >
                    {isActive
                      ? "⭐"
                      : "☆"}
                  </Animated.Text>
                );
              }
            )}
          </View>

          {coinsEarned >
            0 && (
            <Text
              style={
                styles.coinsText
              }
            >
              +
              {
                coinsEarned
              }{" "}
              🪙 earned!
            </Text>
          )}

          <TouchableOpacity
            style={
              styles.nextButton
            }
            onPress={
              onNext
            }
          >
            <Text
              style={
                styles.nextButtonText
              }
            >
              Next Level
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (
  uiTheme: UITheme
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingVertical:
        spacing.md,
      backgroundColor:
        uiTheme.background,
    },

    loadingText: {
      ...typography.body,
      color:
        uiTheme.textMuted,
      marginTop:
        spacing.xxl,
    },

    header: {
      alignItems: "center",
      marginVertical:
        spacing.xs,
    },

    moveText: {
      ...typography.title,
      color:
        uiTheme.textPrimary,
      letterSpacing: 1.5,
    },

    gameWrapper: {
      width: "100%",
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal:
        spacing.lg,
    },

    boardRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    rowIndicators: {
      justifyContent:
        "space-around",
    },

    board: {
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor:
        uiTheme.surface,
      borderRadius:
        radii.md,
      borderWidth: 1,
      borderColor:
        uiTheme.border,
      overflow: "hidden",
      ...shadows.md,
    },

    indicatorText: {
      ...typography.caption,
      color:
        uiTheme.textMuted,
      fontWeight:
        "600",
      textAlign: "center",
    },

    textRed: {
      color:
        uiTheme.danger,
      fontWeight:
        "bold",
    },

    textGreen: {
      color:
        uiTheme.success,
      fontWeight:
        "bold",
    },

    fullCell: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      position: "relative",
    },

    voidCell: {
      backgroundColor:
        uiTheme.border,
      opacity: 0.3,
    },

    voidCellMark: {
      color:
        uiTheme.textMuted,
      fontWeight:
        "bold",
    },

    tileValueOverlay: {
      position:
        "absolute",
      fontWeight:
        "bold",
      color: "#FFFFFF",
      textShadowColor:
        "rgba(0, 0, 0, 0.75)",
      textShadowOffset: {
        width: 0,
        height: 1,
      },
      textShadowRadius: 2,
    },

    cageTargetText: {
      position:
        "absolute",
      top: 2,
      left: 4,
      fontWeight:
        "bold",
      color:
        uiTheme.textPrimary,
    },

    buttonRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop:
        spacing.sm,
      marginBottom:
        spacing.md,
    },

    actionButton: {
      backgroundColor:
        uiTheme.surface,
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.md,
      borderRadius:
        radii.pill,
      borderWidth: 1,
      borderColor:
        uiTheme.border,
      ...shadows.sm,
    },

    buttonText: {
      ...typography.body,
      color:
        uiTheme.textPrimary,
      fontWeight:
        "600",
    },

    hintButton: {
      backgroundColor:
        uiTheme.primary,
      borderColor:
        uiTheme.primary,
    },

    hintButtonText: {
      ...typography.body,
      color:
        uiTheme.onPrimary,
      fontWeight:
        "600",
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0, 0, 0, 0.6)",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    modalContent: {
      backgroundColor:
        uiTheme.surface,
      borderRadius:
        radii.lg,
      padding:
        spacing.xl,
      alignItems:
        "center",
      width: "80%",
      maxWidth: 340,
      ...shadows.md,
    },

    winTitle: {
      ...typography.display,
      color:
        uiTheme.textPrimary,
      marginBottom:
        spacing.xs,
    },

    winSub: {
      ...typography.body,
      color:
        uiTheme.textMuted,
      marginBottom:
        spacing.md,
    },

    starsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginVertical:
        spacing.md,
    },

    starIcon: {
      fontSize: 40,
    },

    coinsText: {
      ...typography.title,
      color:
        uiTheme.primary,
      marginBottom:
        spacing.lg,
    },

    nextButton: {
      backgroundColor:
        uiTheme.primary,
      paddingHorizontal:
        spacing.xl,
      paddingVertical:
        spacing.md,
      borderRadius:
        radii.pill,
      width: "100%",
      alignItems:
        "center",
      ...shadows.sm,
    },

    nextButtonText: {
      ...typography.title,
      color:
        uiTheme.onPrimary,
    },
  });