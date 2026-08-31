import React, { useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { GameScreenProps } from "../navigation/types";
import PuzzleBoard from "../components/PuzzleBoard";
import { useTheme } from "../context/ThemeContext";
import {
  spacing,
  radii,
  typography,
  shadows,
  UITheme,
} from "../constants/uiTheme";
import {
  getDailyLevel,
  getFixedLevel,
  getSeededVoids,
} from "../utils/levelGenerator";
import { todayKey } from "../utils/daily";

export default function GameScreen({
  route,
  navigation,
}: GameScreenProps) {
  const {
    levelId = 1,
    chapterId = 1,
    forcedReset = false,
    themeIndex = 0,
    daily = false,
  } = route.params || {};

  const { ui: uiTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () => makeStyles(uiTheme, insets.top),
    [uiTheme, insets.top]
  );

  const levelData = useMemo(() => {
    /*
     * DAILY LEVEL
     */
    if (daily) {
      const dateKey = todayKey();
      const { grid, size } = getDailyLevel(dateKey);

      return {
        id: 0,
        size,
        grid,
      };
    }

    /*
     * STANDARD LEVEL
     *
     * Chapter 3 is the only chapter that uses void cells.
     */
    const size = 6;
    const difficulty = 0.55;

    const voids =
      chapterId === 3
        ? getSeededVoids(levelId, size, 2)
        : [];

    const grid = getFixedLevel(
      chapterId,
      levelId,
      size,
      difficulty,
      voids
    );

    return {
      id: levelId,
      size,
      grid,
      voids,
    };
  }, [chapterId, levelId, daily]);

const handleNextLevel = useCallback(() => {
  if (daily) {
    navigation.goBack();
    return;
  }

  navigation.replace("Game", {
    levelId: levelId + 1,
    chapterId,
    forcedReset: true,
    themeIndex: themeIndex ?? 0,
  });
}, [
  daily,
  chapterId,
  levelId,
  navigation,
  themeIndex,
]);

  if (!levelData) {
    return (
      <ErrorState
        levelId={levelId}
        onBack={() => navigation.goBack()}
      />
    );
  }

  const boardKey = daily
    ? `board-daily-${todayKey()}`
    : `board-${chapterId}-${levelId}`;

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <TouchableOpacity
        style={styles.backFab}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
        hitSlop={{
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        }}
      >
        <FontAwesome
          name="chevron-left"
          size={14}
          color={uiTheme.textPrimary}
        />
      </TouchableOpacity>

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
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () => makeStyles(uiTheme, insets.top),
    [uiTheme, insets.top]
  );

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        Level {levelId} not found!
      </Text>

      <Text style={styles.errorSubtext}>
        This level might not be available yet.
      </Text>

      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <Text style={styles.backButtonText}>
          Go Back
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const makeStyles = (
  uiTheme: UITheme,
  topInset: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: uiTheme.background,
    },

    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      backgroundColor: uiTheme.background,
    },

    errorText: {
      ...typography.title,
      fontSize: 22,
      color: uiTheme.danger,
    },

    errorSubtext: {
      ...typography.body,
      color: uiTheme.textMuted,
      textAlign: "center",
      marginVertical: spacing.sm + 2,
    },

    backButton: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.xxl - 8,
      paddingVertical: spacing.md,
      backgroundColor: uiTheme.primary,
      borderRadius: radii.md,
      ...shadows.sm,
    },

    backButtonText: {
      color: uiTheme.onPrimary,
      fontWeight: "bold",
    },

    backFab: {
      position: "absolute",
      top: topInset + spacing.xs,
      left: spacing.md,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: uiTheme.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.sm,
    },
  });

