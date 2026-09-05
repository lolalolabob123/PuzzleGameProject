import React, { useMemo, useCallback, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import PuzzleBoard, { LevelData } from "../components/PuzzleBoard";
import { chapters } from "../data/chapters";
import { useTheme } from "../context/ThemeContext";
import { spacing, radii, typography, shadows } from "../constants/uiTheme";

import {
  getDailyLevel,
  getFixedLevel,
  getSeededVoids,
  getChapter2Level,
  getChapter4Level,
} from "../utils/levelGenerator";

import { todayKey } from "../utils/daily";
import { getEffectCount, useEffectToken } from "../utils/coins";
import { unlockNextLevel, saveLevelStars, clearActiveSession } from "../utils/progress";

type GameScreenProps = NativeStackScreenProps<RootStackParamList, "Game">;

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const {
    levelId = 1,
    chapterId = 1,
    forcedReset = false,
    themeIndex = 0,
    daily = false,
  } = route.params || {};

  const { ui: uiTheme } = useTheme();

  const [hints, setHints] = useState<number>(0);
  const [skipCount, setSkipCount] = useState<number>(0);
  const [hintTrigger, setHintTrigger] = useState<number>(0);

  // Sync consumable token balances whenever screen receives focus
  const loadTokens = useCallback(async () => {
    try {
      const hintVal = await getEffectCount("extra-hints");
      const skipVal = await getEffectCount("skip-tokens");
      setHints(hintVal);
      setSkipCount(skipVal);
    } catch (err) {
      console.error("Error loading power-up tokens:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTokens();
    }, [loadTokens])
  );

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

  // --- POWER-UP: HINT LOGIC ---
  const handleUseHint = async () => {
    if (hints <= 0) {
      Alert.alert(
        "Out of Hints",
        "You don't have any hints remaining. Get more in the Shop!",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Shop",
            onPress: () => navigation.navigate("Main", { screen: "Shop" } as never)
          },
        ]
      );
      return;
    }

    const success = await useEffectToken("extra-hints");
    if (success) {
      setHints((prev) => Math.max(0, prev - 1));
      setHintTrigger((prev) => prev + 1);
    }
  };

  // --- POWER-UP: SKIP LOGIC ---
  const handleUseSkip = async () => {
    if (skipCount <= 0) {
      Alert.alert(
        "Out of Skips",
        "You don't have any skips remaining. Get more in the Shop!",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Shop",
            onPress: () => navigation.navigate("Main", { screen: "Shop" } as never)
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Skip Level?",
      `Use 1 Skip Token to clear ${daily ? "today's level" : `Level ${levelId}`}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          onPress: async () => {
            const success = await useEffectToken("skip-tokens");
            if (success) {
              setSkipCount((prev) => Math.max(0, prev - 1));
              await unlockNextLevel(chapterId, levelId);
              await clearActiveSession(chapterId, levelId);
              handleNextLevel();
            }
          },
        },
      ]
    );
  };

  if (!levelData) {
    return <ErrorState levelId={levelId} onBack={() => navigation.goBack()} />;
  }

  const boardKey = daily
    ? `board-daily-${todayKey()}`
    : `board-${chapterId}-${levelId}`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: uiTheme.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderColor: uiTheme.border }]}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: uiTheme.surface, borderColor: uiTheme.border },
          ]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="chevron-left" size={14} color={uiTheme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: uiTheme.textPrimary }]}>
          {daily ? "Daily Challenge" : `Chapter ${chapterId} • Level ${levelId}`}
        </Text>

        {/* Empty placeholder view to keep header title centered */}
        <View style={{ width: 36 }} />
      </View>

      {/* Board Container */}
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
          hintTrigger={hintTrigger}
        />
      </View>

      {/* Power-Up Action Bar */}
      <View style={[styles.actionBar, { borderColor: uiTheme.border }]}>
        <TouchableOpacity
          style={[
            styles.powerupButton,
            { backgroundColor: uiTheme.surface, borderColor: uiTheme.border },
          ]}
          onPress={handleUseHint}
          activeOpacity={0.8}
        >
          <FontAwesome name="lightbulb-o" size={18} color={uiTheme.star} />
          <Text style={[styles.powerupText, { color: uiTheme.textPrimary }]}>
            Hint ({hints})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.powerupButton,
            { backgroundColor: uiTheme.surface, borderColor: uiTheme.border },
          ]}
          onPress={handleUseSkip}
          activeOpacity={0.8}
        >
          <FontAwesome name="forward" size={16} color={uiTheme.primary} />
          <Text style={[styles.powerupText, { color: uiTheme.textPrimary }]}>
            Skip ({skipCount})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ErrorState = ({
  levelId,
  onBack,
}: {
  levelId: number;
  onBack: () => void;
}) => {
  const { ui: uiTheme } = useTheme();
  return (
    <View style={[styles.errorContainer, { backgroundColor: uiTheme.background }]}>
      <Text style={[styles.errorText, { color: uiTheme.danger }]}>
        Level {levelId} not found!
      </Text>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: uiTheme.primary }]}
        onPress={onBack}
      >
        <Text style={{ color: uiTheme.onPrimary, fontWeight: "bold" }}>
          Go Back
        </Text>
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
  actionBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
  },
  powerupButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    ...shadows.sm,
  },
  powerupText: {
    ...typography.caption,
    fontWeight: "700",
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