import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useProfile } from "../context/ProfileContext";
import { useTheme } from "../context/ThemeContext";
import ProfileSetup from "./ProfileSetup";
import { checkInForToday, StreakResult } from "../utils/streak";
import StreakModal from "./StreakModal";

export default function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile();
  const { ui: uiTheme } = useTheme();
  const [streakResult, setStreakResult] = useState<StreakResult | null>(null)

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    checkInForToday().then((result) => {
      if (cancelled) return;
      if (result.awarded && !result.isFirstEver) {
        setStreakResult(result);
      }
    });
    return () => { cancelled = true };
  }, [profile?.name]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: uiTheme.background }}>
        <ActivityIndicator size="large" color={uiTheme.primary} />
      </View>
    );
  }

  if (!profile) {
    return <ProfileSetup />;
  }

  return <>
    {children}
    {streakResult && (
      <StreakModal
        streak={streakResult.streak}
        reward={streakResult.reward}
        onClose={() => setStreakResult(null)}
      />
    )}
  </>;
}