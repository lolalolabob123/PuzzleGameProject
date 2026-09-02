import React, { useMemo, memo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { getUnlockedLevels, getAllLevelStars } from "../utils/progress";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { spacing, radii, typography, shadows, UITheme } from "../constants/uiTheme";

type LevelItem = {
  id: number;
  stars?: number;
  isLocked?: boolean;
};

type LevelSelectProps = {
  chapterId: number;
  levels: { id: number }[];
  onSelectLevel: (levelId: number) => void;
};

type LevelButtonProps = {
  item: LevelItem;
  onPress: (level: LevelItem) => void;
  itemSize: number;
};

const COLUMNS_PER_ROW = 4;
const HORIZONTAL_PADDING = spacing.xl;
const GAP_BETWEEN_COLUMNS = spacing.md;
const MAX_WEB_CONTAINER_WIDTH = 430;

const LevelButton = memo(({ item, onPress, itemSize }: LevelButtonProps) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const starsEarned = Number(item.stars ?? 0);
  const displayNumber = item.id ?? "?";
  const isCompleted = starsEarned > 0;
  const isLocked = Boolean(item.isLocked);

  return (
    <TouchableOpacity
      disabled={isLocked}
      style={[
        styles.levelButton,
        { width: itemSize, height: itemSize },
        isCompleted && styles.levelButtonCompleted,
        isLocked && styles.levelButtonLocked,
      ]}
      onPress={() => !isLocked && onPress(item)}
      activeOpacity={isLocked ? 1 : 0.75}
    >
      <Text style={[styles.levelNumber, isLocked && styles.levelNumberLocked]}>
        {isLocked ? (
          <FontAwesome5 name="lock" size={14} color={uiTheme.textDisabled} />
        ) : (
          displayNumber
        )}
      </Text>

      {!isLocked && (
        <View style={styles.starRow}>
          {[1, 2, 3].map((starPosition) => (
            <FontAwesome5
              key={starPosition}
              name="star"
              solid={starPosition <= starsEarned}
              size={10}
              color={
                starPosition <= starsEarned
                  ? uiTheme.star
                  : uiTheme.surfaceSunken
              }
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function LevelSelect({ chapterId, levels, onSelectLevel }: LevelSelectProps) {
  const { ui: uiTheme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const [isLoading, setIsLoading] = useState(true);
  const [unlockedMax, setUnlockedMax] = useState<number>(1);
  const [starsMap, setStarsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;

    const loadLevelData = async () => {
      setIsLoading(true);
      try {
        const [maxUnlocked, allStars] = await Promise.all([
          getUnlockedLevels(chapterId),
          getAllLevelStars(),
        ]);

        if (isMounted) {
          setUnlockedMax(maxUnlocked);
          setStarsMap(allStars);
        }
      } catch (error) {
        console.error("Failed to load level progress:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLevelData();

    return () => {
      isMounted = false;
    };
  }, [chapterId]);

  const hydratedLevels = useMemo<LevelItem[]>(() => {
    if (!levels) return [];

    return levels.map((lvl) => {
      const stars = starsMap[`${chapterId}_${lvl.id}`] ?? 0;
      // Level is unlocked if: level 1, or level ID <= max unlocked level, or stars have been earned
      const isLocked = lvl.id > 1 && lvl.id > unlockedMax && stars === 0;

      return {
        id: lvl.id,
        stars,
        isLocked,
      };
    });
  }, [levels, starsMap, unlockedMax, chapterId]);

  const itemSize = useMemo(() => {
    const effectiveWidth = Math.min(windowWidth, MAX_WEB_CONTAINER_WIDTH);
    const availableWidth =
      effectiveWidth -
      HORIZONTAL_PADDING * 2 -
      GAP_BETWEEN_COLUMNS * (COLUMNS_PER_ROW - 1);

    return Math.floor(availableWidth / COLUMNS_PER_ROW);
  }, [windowWidth]);

  if (isLoading || levels === undefined) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={uiTheme.primary} />
        <Text style={styles.emptyText}>Loading Levels...</Text>
      </View>
    );
  }

  if (levels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No levels available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.container}>
        <FlatList
          data={hydratedLevels}
          extraData={hydratedLevels}
          renderItem={({ item }) => (
            <LevelButton
              item={item}
              onPress={(selectedItem) => onSelectLevel(selectedItem.id)}
              itemSize={itemSize}
            />
          )}
          keyExtractor={(item) => `level-${item.id}-${item.stars ?? 0}-${item.isLocked}`}
          numColumns={COLUMNS_PER_ROW}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    outerWrapper: {
      flex: 1,
      backgroundColor: uiTheme.background,
      alignItems: "center",
    },
    container: {
      flex: 1,
      width: "100%",
      maxWidth: MAX_WEB_CONTAINER_WIDTH,
      backgroundColor: uiTheme.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: uiTheme.background,
    },
    emptyText: {
      ...typography.body,
      marginTop: spacing.md,
      color: uiTheme.textMuted,
    },
    listContent: {
      paddingHorizontal: HORIZONTAL_PADDING,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    columnWrapper: {
      justifyContent: "flex-start",
      gap: GAP_BETWEEN_COLUMNS,
      marginBottom: GAP_BETWEEN_COLUMNS,
    },
    levelButton: {
      backgroundColor: uiTheme.surface,
      borderRadius: radii.md,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.sm,
    },
    levelButtonCompleted: {
      backgroundColor: uiTheme.surfaceMuted,
      borderColor: uiTheme.primary,
    },
    levelButtonLocked: {
      backgroundColor: uiTheme.surfaceSunken,
      borderColor: "transparent",
      opacity: 0.6,
    },
    levelNumber: {
      ...typography.title,
      color: uiTheme.textPrimary,
    },
    levelNumberLocked: {
      color: uiTheme.textMuted,
    },
    starRow: {
      flexDirection: "row",
      marginTop: spacing.xs,
      gap: 3,
    },
  });