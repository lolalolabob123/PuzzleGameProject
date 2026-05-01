import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useTheme } from "../context/ThemeContext";
import { spacing, radii, typography, shadows, UITheme } from "../constants/uiTheme";
import { getAchievementStatus, checkAndGrantAchievements } from "../utils/achievements";
import { Achievement } from "../data/achievements";

type Status = { achievement: Achievement; earned: boolean };

export default function Achievements() {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const [statuses, setStatuses] = useState<Status[]>([]);

  const refresh = useCallback(async () => {
    // Detect any pending achievements (e.g. earned via shop actions).
    await checkAndGrantAchievements();
    setStatuses(await getAchievementStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const earnedCount = statuses.filter(s => s.earned).length;
  const totalCount = statuses.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          {earnedCount} of {totalCount} unlocked
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {statuses.map(({ achievement, earned }) => (
          <View
            key={achievement.id}
            style={[styles.row, !earned && styles.rowLocked]}
          >
            <View style={[styles.iconWrap, earned ? styles.iconWrapEarned : styles.iconWrapLocked]}>
              <FontAwesome
                name={achievement.iconName as any}
                size={26}
                color={earned ? "#FFFFFF" : uiTheme.textMuted}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.rowTitle}>{achievement.title}</Text>
              <Text style={styles.rowDesc} numberOfLines={2}>
                {achievement.description}
              </Text>
            </View>
            <View style={styles.rewardPill}>
              <FontAwesome5 name="coins" size={12} color={uiTheme.star} />
              <Text style={styles.rewardText}>{achievement.reward}</Text>
            </View>
            {earned && (
              <View style={styles.checkBadge}>
                <FontAwesome name="check" size={11} color="#FFFFFF" />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: uiTheme.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      ...typography.display,
      color: uiTheme.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: uiTheme.textMuted,
      marginTop: spacing.xs,
    },
    scrollBody: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: uiTheme.surface,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.sm,
    },
    rowLocked: {
      opacity: 0.7,
    },
    iconWrap: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    iconWrapEarned: {
      backgroundColor: uiTheme.primary,
    },
    iconWrapLocked: {
      backgroundColor: uiTheme.surfaceMuted,
    },
    body: {
      flex: 1,
      marginRight: spacing.sm,
    },
    rowTitle: {
      ...typography.title,
      fontSize: 16,
      color: uiTheme.textPrimary,
    },
    rowDesc: {
      ...typography.caption,
      color: uiTheme.textMuted,
      marginTop: 2,
    },
    rewardPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: uiTheme.surfaceMuted,
      borderRadius: radii.pill,
    },
    rewardText: {
      ...typography.caption,
      color: uiTheme.textPrimary,
    },
    checkBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: uiTheme.success,
      justifyContent: "center",
      alignItems: "center",
    },
  });