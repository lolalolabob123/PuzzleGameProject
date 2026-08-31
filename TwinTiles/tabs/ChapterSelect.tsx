import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { ChapterSelectProps } from "../navigation/types";
import { chapters } from "../data/chapters";
import { getChapterProgress, getHighestUnlockedChapter } from "../utils/progress";
import { useTheme } from "../context/ThemeContext";
import { spacing, radii, typography, shadows, UITheme } from "../constants/uiTheme";

type ChapterCardData = {
  chapterId: number;
  title: string;
  subtitle: string;
  icon: "star" | "link" | "asterisk" | "key";
  accentColor: string;
  levelsSolved: number;
  levelsTotal: number;
  starsEarned: number;
  starsMax: number;
  isLocked: boolean;
};

type ChapterCardProps = {
  chapter: ChapterCardData;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  uiTheme: UITheme;
};

const MAX_WEB_CONTAINER_WIDTH = 430;

const getTransparentColor = (color: string, alphaHex = "22"): string => {
  if (!color || typeof color !== "string") return "#88888822";
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    return color + alphaHex;
  }
  return color;
};

const ChapterCard = React.memo(({ chapter, onPress, styles, uiTheme }: ChapterCardProps) => {
  const completionRatio = chapter.levelsTotal === 0 ? 0 : chapter.levelsSolved / chapter.levelsTotal;
  const iconBgColor = getTransparentColor(chapter.accentColor, "22");

  return (
    <TouchableOpacity
      style={[styles.card, chapter.isLocked && styles.cardLocked]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={chapter.isLocked}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
        <FontAwesome
          name={chapter.isLocked ? "lock" : chapter.icon}
          size={24}
          color={chapter.isLocked ? uiTheme.textDisabled : chapter.accentColor}
        />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          Chapter {chapter.chapterId}: {chapter.title}
        </Text>
        <Text style={styles.cardSubtitle}>{chapter.subtitle}</Text>

        {!chapter.isLocked && (
          <>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(Math.max(completionRatio * 100, 0), 100)}%`,
                    backgroundColor: chapter.accentColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {chapter.levelsSolved} / {chapter.levelsTotal} solved · {chapter.starsEarned}{"\u2605"}
            </Text>
          </>
        )}

        {chapter.isLocked && (
          <Text style={styles.lockedText}>Complete the previous chapter to unlock</Text>
        )}
      </View>

      {!chapter.isLocked && (
        <FontAwesome name="chevron-right" size={16} color={uiTheme.textDisabled} />
      )}
    </TouchableOpacity>
  );
});

export default function ChapterSelect({ navigation, route }: ChapterSelectProps) {
  const themeIndex = route.params?.themeIndex ?? 0;
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);
  const [chapterCards, setChapterCards] = useState<ChapterCardData[]>([]);

  const loadChapterProgress = useCallback(async () => {
    const highestUnlockedChapterId = await getHighestUnlockedChapter();

    const cardsForAllChapters = await Promise.all(
      Object.entries(chapters).map(async ([chapterIdAsString, chapter]) => {
        const chapterId = Number(chapterIdAsString);
        const progress = await getChapterProgress(chapterId);

        const chapterThemeMap = uiTheme.chapter as Record<number, string> | undefined;
        const chapterAccent =
          chapterThemeMap?.[chapterId] || uiTheme.primary || "#6200ee";

        return {
          chapterId,
          title: chapter.title,
          subtitle: chapter.subtitle,
          icon: chapter.icon,
          accentColor: chapterAccent,
          isLocked: chapterId > highestUnlockedChapterId,
          levelsSolved: progress.solved,
          levelsTotal: progress.total,
          starsEarned: progress.totalStars,
          starsMax: progress.maxStars,
        } as ChapterCardData;
      })
    );

    setChapterCards(cardsForAllChapters);
  }, [uiTheme]);

  useEffect(() => {
    const unsubscribeFromFocus = navigation.addListener("focus", loadChapterProgress);
    return unsubscribeFromFocus;
  }, [navigation, loadChapterProgress]);

  return (
    <SafeAreaView style={styles.outerContainer} edges={["top", "left", "right"]}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.heading}>Chapters</Text>
          <Text style={styles.subHeading}>Choose your next puzzle</Text>
        </View>

        <FlatList
          data={chapterCards}
          keyExtractor={(card) => String(card.chapterId)}
          renderItem={({ item: card }) => (
            <ChapterCard
              chapter={card}
              styles={styles}
              uiTheme={uiTheme}
              onPress={() =>
                navigation.navigate("LevelModal", {
                  chapterId: card.chapterId,
                  themeIndex,
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    outerContainer: {
      flex: 1,
      backgroundColor: uiTheme.background,
      alignItems: "center",
    },
    innerContainer: {
      flex: 1,
      width: "100%",
      maxWidth: MAX_WEB_CONTAINER_WIDTH,
    },
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    heading: { ...typography.display, color: uiTheme.textPrimary },
    subHeading: { ...typography.caption, color: uiTheme.textMuted, marginTop: 2 },
    listContent: { padding: spacing.xl, paddingTop: 0 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: uiTheme.surface,
      padding: spacing.lg,
      borderRadius: radii.lg,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    cardLocked: { opacity: 0.55 },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: {
      flex: 1,
      marginLeft: spacing.lg,
    },
    cardTitle: { ...typography.title, color: uiTheme.textPrimary },
    cardSubtitle: {
      ...typography.caption,
      color: uiTheme.textMuted,
      marginTop: 2,
      marginBottom: spacing.sm,
    },
    progressTrack: {
      height: 6,
      backgroundColor: uiTheme.surfaceSunken,
      borderRadius: radii.pill,
      overflow: "hidden",
      marginTop: spacing.xs,
    },
    progressFill: { height: "100%", borderRadius: radii.pill },
    progressText: { ...typography.micro, color: uiTheme.textMuted, marginTop: spacing.xs },
    lockedText: {
      ...typography.caption,
      color: uiTheme.textDisabled,
      fontStyle: "italic",
    },
  });