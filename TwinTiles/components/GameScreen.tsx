import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

import { GameScreenProps } from "../navigation/types";
import PuzzleBoard, { LevelData } from "../components/PuzzleBoard";
import { chapters } from "../data/chapters";
import { useTheme } from "../context/ThemeContext";
import { spacing, radii, typography, shadows, UITheme } from "../constants/uiTheme";

import {
  getDailyLevel,
  getFixedLevel,
  getSeededVoids,
  getChapter2Level,
  getChapter4Level,
} from "../utils/levelGenerator";

import { todayKey } from "../utils/daily";

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const {
    levelId = 1,
    chapterId = 1,
    forcedReset = false,
    themeIndex = 0,
    daily = false,
  } = route.params || {};

  const { ui: uiTheme } = useTheme();

  const levelData: LevelData = useMemo(() => {
    if (daily) {
      const dateKey = todayKey();
      const { grid, size } = getDailyLevel(dateKey);
      return { id: 0, size, grid };
    }

    const chapterConfig = chapters[chapterId];
    const levelConfig = chapterConfig?.levels?.find((l) => l.id === levelId);
    const configuredSize = levelConfig?.size ?? 6;
    const difficulty = 0.55;

    if (chapterId === 2) {
      const { grid, linkedPairs } = getChapter2Level(levelId, configuredSize, difficulty);
      const actualSize = grid && grid.length > 0 ? Math.sqrt(grid.length) : configuredSize;
      return { id: levelId, size: actualSize, grid, linkedPairs };
    }

    if (chapterId === 4) {
      const { grid, cages } = getChapter4Level(levelId, configuredSize, difficulty);
      const actualSize = grid && grid.length > 0 ? Math.sqrt(grid.length) : configuredSize;
      return { id: levelId, size: actualSize, grid, cages };
    }

    const voids = chapterId === 3 ? getSeededVoids(levelId, configuredSize, 2) : [];
    const grid = getFixedLevel(chapterId, levelId, configuredSize, difficulty, voids);
    const actualSize = grid && grid.length > 0 ? Math.sqrt(grid.length) : configuredSize;

    return { id: levelId, size: actualSize, grid, voids };
  }, [chapterId, levelId, daily]);

  const handleNextLevel = useCallback(() => {
    if (daily) {
      navigation.goBack();
      return;
    }

    const currentChapter = chapters[chapterId];
    if (!currentChapter) {
      navigation.goBack();
      return;
    }

    const currentIndex = currentChapter.levels.findIndex((l) => l.id === levelId);

    if (currentIndex !== -1 && currentIndex < currentChapter.levels.length - 1) {
      const nextLevel = currentChapter.levels[currentIndex + 1];

      navigation.replace("Game", {
        levelId: nextLevel.id,
        chapterId,
        forcedReset: true,
        themeIndex: themeIndex ?? 0,
      });
      return;
    }

    const nextChapterId = chapterId + 1;
    const nextChapter = chapters[nextChapterId];

    if (nextChapter && nextChapter.levels.length > 0) {
      const firstLevel = nextChapter.levels[0];

      navigation.replace("Game", {
        levelId: firstLevel.id,
        chapterId: nextChapterId,
        forcedReset: true,
        themeIndex: themeIndex ?? 0,
      });
    } else {
      navigation.goBack();
    }
  }, [daily, chapterId, levelId, navigation, themeIndex]);

  if (!levelData) {
    return <ErrorState levelId={levelId} onBack={() => navigation.goBack()} />;
  }

  const boardKey = daily
    ? `board-daily-${todayKey()}`
    : `board-${chapterId}-${levelId}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: uiTheme.background }]} edges={["top", "bottom"]}>
      {/* Fixed Navigation Header Bar */}
      <View style={[styles.headerBar, { borderColor: uiTheme.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: uiTheme.surface, borderColor: uiTheme.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="chevron-left" size={14} color={uiTheme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: uiTheme.textPrimary }]}>
          {daily ? "Daily Challenge" : `Chapter ${chapterId} • Level ${levelId}`}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <View style={styles.boardContainer}>
        <PuzzleBoard
          key={boardKey}
          levelData={levelData}
          chapterId={chapterId}
          level={levelId}
          size={levelData.size}
          onNextLevel={handleNextLevel}
          forcedReset={forcedReset}
          daily={daily}
        />
      </View>
    </SafeAreaView>
  );
}

const ErrorState = ({ levelId, onBack }: { levelId: number; onBack: () => void }) => {
  const { ui: uiTheme } = useTheme();
  return (
    <View style={[styles.errorContainer, { backgroundColor: uiTheme.background }]}>
      <Text style={[styles.errorText, { color: uiTheme.danger }]}>Level {levelId} not found!</Text>
      <TouchableOpacity style={[styles.backButton, { backgroundColor: uiTheme.primary }]} onPress={onBack}>
        <Text style={{ color: uiTheme.onPrimary, fontWeight: "bold" }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    ...shadows.sm,
  },
  boardContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: {
    ...typography.title,
    fontSize: 22,
  },
  backButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
});