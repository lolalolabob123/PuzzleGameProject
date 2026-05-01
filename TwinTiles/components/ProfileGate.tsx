import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useProfile } from "../context/ProfileContext";
import { useTheme } from "../context/ThemeContext";
import ProfileSetup from "./ProfileSetup";

export default function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile();
  const { ui: uiTheme } = useTheme();

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

  return <>{children}</>;
}