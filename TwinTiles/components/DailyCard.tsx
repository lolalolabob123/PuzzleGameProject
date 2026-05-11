import React, {useEffect, useMemo, useState} from "react"
import {View, Text, TouchableOpacity, StyleSheet} from "react-native"
import { FontAwesome5 } from "@expo/vector-icons"
import {useTheme} from "../context/ThemeContext"
import {
    spacing,
    radii,
    shadows,
    UITheme,
    typography,
} from "../constants/uiTheme"
import {hasSolvedToday, msUntilTomorrow} from "../utils/daily"

type Props = {
    onPlay: () => void
}

const formatHS = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `${h}h ${String(m).padStart(2, "0")}m`
}

export default function DailyCard({onPlay}: Props) {
    const {ui: uiTheme} = useTheme()
    const styles = useMemo(() => makeStyles(uiTheme), [uiTheme])

    const [solved, setSolved] = useState<boolean | null>(null)
    const [tickMS, setTickMS] = useState<number>(msUntilTomorrow())

    useEffect(() => {
        let cancelled = false
        hasSolvedToday().then((s) => {
            if (!cancelled) setSolved(s)
        })
    return () => {cancelled = true}
    }, [])

    useEffect(() => {
        if (solved != true) return
        const id = setInterval(() => setTickMS(msUntilTomorrow()), 60_000)
        return () => clearInterval(id)
    }, [solved])

    if (solved === null) return null

    if (solved) {
        return (
            <View style={[styles.card, styles.cardSolved]}>
                <FontAwesome5 name="check-circle" size={20} color={uiTheme.success}/>
                <View style={styles.textBlock}>
                    <Text style={styles.title}>Daily Solved</Text>
                    <Text style={styles.subtitle}>Next puzzle in {formatHS(tickMS)}</Text>
                </View>
            </View>
        )
    }

    return (
        <TouchableOpacity
        style={[styles.card, styles.cardActive]}
        onPress={onPlay}
        activeOpacity={0.8}
        >
            <FontAwesome5 name="calendar-day" size={20} color={uiTheme.onPrimary}/>
            <View style={styles.textBlock}>
                <Text style={[styles.title, {color: uiTheme.onPrimary}]}>
                    Today's puzzle
                </Text>
                <Text style={[styles.subtitle, {color: uiTheme.onPrimary, opacity: 0.85}]}>
                    One 6x6 board, 30 coin reward
                </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color={uiTheme.onPrimary}/>
        </TouchableOpacity>
    )
}

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginHorizontal: spacing.xl,
      marginTop: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: 1,
      ...shadows.sm,
    },
    cardActive: {
      backgroundColor: uiTheme.primary,
      borderColor: uiTheme.primary,
    },
    cardSolved: {
      backgroundColor: uiTheme.surface,
      borderColor: uiTheme.border,
    },
    textBlock: { flex: 1 },
    title: {
      ...typography.title,
      fontSize: 16,
      color: uiTheme.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: uiTheme.textMuted,
      marginTop: 2,
    },
  });