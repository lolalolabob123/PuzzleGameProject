import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { FontAwesome } from "@expo/vector-icons"

import { useProfile } from "../context/ProfileContext"
import { AVAILABLE_AVATARS } from "../data/avatars"
import { useTheme } from "../context/ThemeContext"
import { spacing, radii, typography, shadows, UITheme } from "../constants/uiTheme"

type Props = {
    initialName?: string;
    initialAvatarId?: string;
    onComplete?: () => void;
    isEditing?: boolean;
}

export default function ProfileSetup({
    initialName = "",
    initialAvatarId,
    onComplete,
    isEditing = false,
}: Props) {
    const { ui: uiTheme } = useTheme()
    const styles = React.useMemo(() => makeStyles(uiTheme), [uiTheme])
    const { updateProfile } = useProfile()

    const [name, setName] = useState(initialName)
    const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
        initialAvatarId ?? AVAILABLE_AVATARS[0].id
    )

    const handleSave = async () => {
        const trimmed = name.trim()
        if (trimmed.length === 0) {
            Platform.OS === "web"
                ? window.alert("Please enter a name")
                : Alert.alert("Missing name", "Please enter a name")
            return
        }
        if (trimmed.length > 20) {
            Platform.OS === "web"
                ? window.alert("Name must be 20 characters or fewer")
                : Alert.alert("Too long", "Name must be 20 charactersor fewer")
            return
        }
        await updateProfile({ name: trimmed, avatarId: selectedAvatarId })
        onComplete?.()
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>
                    {isEditing ? "Edit Profile" : "Welcome!"}
                </Text>
                <Text style={styles.subtitle}>
                    {isEditing ? "Update your name and avatar." : "Let's set up your profile."}
                </Text>
                <Text style={styles.sectionLabel}>Your name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={uiTheme.textMuted}
                    value={name}
                    onChangeText={setName}
                    maxLength={20}
                    autoFocus={!isEditing}
                />

                <Text style={styles.sectionLabel}>Choose an avatar</Text>
                <View style={styles.avatarGrid}>
                    {AVAILABLE_AVATARS.map((avatar) => {
                        const isSelected = avatar.id === selectedAvatarId
                        return (
                            <TouchableOpacity
                                key={avatar.id}
                                onPress={() => setSelectedAvatarId(avatar.id)}
                                style={[
                                    styles.avatarCircle,
                                    {backgroundColor: avatar.color},
                                    isSelected && styles.avatarSelected,
                                ]}
                                activeOpacity={0.85}
                                >
                                    <FontAwesome  name={avatar.iconName as any} size={28} color="#FFFFF"/>
                                </TouchableOpacity>
                        )
                    })}
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.saveButtonText}>
                        {isEditing ? "Save Changes" : "Get Started"}
                    </Text>
                </TouchableOpacity>
                {isEditing && (
                    <TouchableOpacity style={styles.cancelButton} onPress={onComplete} activeOpacity={0.85}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: uiTheme.background },
    scrollBody: { padding: spacing.xl, paddingTop: spacing.xxl },
    title: {
      ...typography.display,
      color: uiTheme.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: uiTheme.textMuted,
      marginBottom: spacing.xl,
    },
    sectionLabel: {
      ...typography.micro,
      color: uiTheme.textMuted,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    input: {
      ...typography.body,
      color: uiTheme.textPrimary,
      backgroundColor: uiTheme.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: uiTheme.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    avatarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    avatarCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "transparent",
      ...shadows.sm,
    },
    avatarSelected: {
      borderColor: uiTheme.primary,
    },
    saveButton: {
      backgroundColor: uiTheme.primary,
      borderRadius: radii.pill,
      paddingVertical: spacing.md + 2,
      alignItems: "center",
      marginTop: spacing.xxl,
      ...shadows.sm,
    },
    saveButtonText: {
      ...typography.title,
      color: uiTheme.name === "mono" ? uiTheme.surface : "#FFFFFF",
      fontSize: 17,
    },
    cancelButton: {
      paddingVertical: spacing.md,
      alignItems: "center",
      marginTop: spacing.sm,
    },
    cancelButtonText: {
      ...typography.body,
      color: uiTheme.textMuted,
    },
  });