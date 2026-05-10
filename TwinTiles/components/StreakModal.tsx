import React, {useMemo} from "react"
import {Modal, View, Text, TouchableOpacity, StyleSheet} from "react-native"
import {FontAwesome, FontAwesome5} from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import {spacing, radii, typography, shadows, UITheme} from "../constants/uiTheme"

type Props = {
    streak: number;
    reward: number;
    onClose: () => void;
}

export default function StreakModal({streak, reward, onClose}: Props) {
    const {ui: uiTheme} = useTheme()
    const styles = useMemo(() => makeStyles(uiTheme), [uiTheme])

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <FontAwesome5 name="fire" size={56} color={uiTheme.warning}/>
                    <Text style={styles.dayLabel}> Day {streak}</Text>
                    <Text style={styles.subtitle}>Daily Streak</Text>
                    <View style={styles.rewardPill}>
                        <FontAwesome5 name="coins" size={16} color={uiTheme.star}/>
                        <Text style={styles.rewardText}>+{reward}</Text>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
                        <Text style={styles.buttonText}>Let's Play</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
    },
    card: {
      backgroundColor: uiTheme.surface,
      borderRadius: radii.xl,
      padding: spacing.xxl,
      alignItems: "center",
      width: "100%",
      maxWidth: 360,
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.md,
    },
    dayLabel: {
      ...typography.display,
      color: uiTheme.textPrimary,
      marginTop: spacing.md,
    },
    subtitle: {
      ...typography.caption,
      color: uiTheme.textMuted,
      textTransform: "uppercase",
      marginBottom: spacing.lg,
    },
    rewardPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: uiTheme.surfaceMuted,
      borderRadius: radii.pill,
      marginBottom: spacing.xl,
    },
    rewardText: {
      ...typography.title,
      color: uiTheme.textPrimary,
    },
    button: {
      backgroundColor: uiTheme.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      borderRadius: radii.pill,
      ...shadows.sm,
    },
    buttonText: {
      ...typography.title,
      color: uiTheme.onPrimary,
      fontSize: 17,
    },
  });