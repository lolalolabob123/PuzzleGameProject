import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
  LogBox,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { AVAILABLE_THEMES, GameTheme } from "../constants/themes";
import { useTheme } from "../context/ThemeContext";
import { resetChapterProgress, clearAllGameData } from "../utils/progress";
import { HomeScreenProps } from "../navigation/types";
import { getOwnedItemIds } from "../utils/coins";
import { SHOP_ITEMS } from "../data/shopItems";
import { useProfile } from "../context/ProfileContext";
import { AVAILABLE_AVATARS } from "../data/avatars";
import ProfileSetup from "../components/ProfileSetup";
import {
  spacing,
  radii,
  typography,
  shadows,
  UITheme,
} from "../constants/uiTheme";

if (Platform.OS === "web") {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.toString().includes("shadow*")) return;
    originalWarn(...args);
  };
} else {
  LogBox.ignoreLogs(["shadow*"]);
}

const universalAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  isDestructive = false
) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: isDestructive ? "destructive" : "default",
        onPress: onConfirm,
      },
    ]);
  }
};

const universalNotify = (title: string, message: string) => {
  Platform.OS === "web" ? window.alert(message) : Alert.alert(title, message);
};

const PAID_THEME_IDS = new Set(
  SHOP_ITEMS.filter((i) => i.category === "theme").map((i) => i.id)
);

const isThemeUnlocked = (themeId: string, owned: string[]) => {
  if (!PAID_THEME_IDS.has(themeId)) return true;
  return owned.includes(themeId);
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { themeIndex, setTheme, ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);
  const currentTheme = AVAILABLE_THEMES[themeIndex];

  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [ownedThemeIds, setOwnedThemeIds] = useState<string[]>([]);

  const { profile } = useProfile();
  const selectedAvatar =
    AVAILABLE_AVATARS.find((a) => a.id === profile?.avatarId) ??
    AVAILABLE_AVATARS[0];

  const handleResetChapter = () => {
    universalAlert(
      "Reset Progress",
      "Are you sure you want to reset Chapter 1?",
      async () => {
        await resetChapterProgress(1);
        setProfileMenuVisible(false);
        setTimeout(() => {
          navigation.navigate("LevelModal", {
            chapterId: 1,
            themeIndex: themeIndex,
            refreshKey: Date.now().toString(),
          });
          universalNotify("Success", "Progress reset.");
        }, 150);
      },
      true
    );
  };

  const handleFullReset = () => {
    universalAlert(
      "Wipe All Data",
      "This will delete ALL progress.",
      async () => {
        await clearAllGameData();
        setProfileMenuVisible(false);
        universalNotify("Deleted", "Data cleared.");
      },
      true
    );
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const owned = await getOwnedItemIds();
        if (!cancelled) setOwnedThemeIds(owned);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const profileGreeting = profile?.name?.trim()
    ? `Hi, ${profile.name.trim()}`
    : "Welcome back";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setInfoVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome
            name="info-circle"
            size={22}
            color={uiTheme.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.appTitle}>TwinTiles</Text>

        <TouchableOpacity
          onPress={() => setProfileMenuVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={[
              styles.headerAvatar,
              { backgroundColor: selectedAvatar.color },
            ]}
          >
            <FontAwesome
              name={selectedAvatar.iconName as any}
              size={20}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.heroBlock}>
        <Text style={styles.heroEyebrow}>{profileGreeting}</Text>
        <Text style={styles.heroTitle}>Ready for a puzzle?</Text>
        <Text style={styles.heroSubtitle}>
          Pick up where you left off, or jump into a new chapter.
        </Text>
      </View>

      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.ctaCard, styles.ctaCardPrimary]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Chapters", { themeIndex })}
        >
          <FontAwesome name="play" size={18} color={uiTheme.onPrimary} />
          <Text style={[styles.ctaCardTitle, { color: uiTheme.onPrimary }]}>
            Continue
          </Text>
          <Text
            style={[
              styles.ctaCardSubtitle,
              { color: uiTheme.onPrimary, opacity: 0.85 },
            ]}
          >
            Jump back into chapters
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Shop")}
        >
          <FontAwesome name="shopping-bag" size={18} color={uiTheme.primary} />
          <Text style={styles.ctaCardTitle}>Shop</Text>
          <Text style={styles.ctaCardSubtitle}>Themes & power-ups</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rankContainer}>
        <Text style={styles.rankEyebrow}>Your rank</Text>
        <Text style={styles.rankText}>—</Text>
        <Text style={styles.rankCaption}>
          Earn stars to climb the leaderboard
        </Text>
      </View>

      {/* ── Profile dropdown menu ─────────────────────────────────────── */}
      <Modal
        visible={profileMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setProfileMenuVisible(false)}
        >
          <View style={styles.profileMenu}>
            <MenuOption
              icon="user"
              label="Edit Profile"
              uiTheme={uiTheme}
              onPress={() => {
                setProfileMenuVisible(false);
                // Wait for the dropdown to dismiss before opening the
                // page-sheet so iOS doesn't drop the second presentation.
                setTimeout(() => setEditProfileVisible(true), 250);
              }}
            />
            <View style={styles.menuDivider} />
            <MenuOption
              icon="cog"
              label="Settings"
              uiTheme={uiTheme}
              onPress={() => {
                setProfileMenuVisible(false);
                setSettingsVisible(true);
              }}
            />
            <View style={styles.menuDivider} />
            <MenuOption
              icon="refresh"
              label="Reset Chapter 1"
              color={uiTheme.warning}
              uiTheme={uiTheme}
              onPress={handleResetChapter}
            />
            <View style={styles.menuDivider} />
            <MenuOption
              icon="trash"
              label="Clear All Data"
              color={uiTheme.danger}
              uiTheme={uiTheme}
              onPress={handleFullReset}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Profile sheet (sibling of menu modal, NOT nested) ───── */}
      <Modal
        visible={editProfileVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <ProfileSetup
          initialName={profile?.name}
          initialAvatarId={profile?.avatarId}
          onComplete={() => setEditProfileVisible(false)}
          isEditing
        />
      </Modal>

      {/* ── How to play ──────────────────────────────────────────────── */}
      <Modal
        visible={infoVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInfoVisible(false)}
      >
        <HowToPlay onClose={() => setInfoVisible(false)} />
      </Modal>

      {/* ── Settings (theme picker) ──────────────────────────────────── */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <SettingsContent
          currentTheme={currentTheme}
          onThemeSelect={setTheme}
          onClose={() => setSettingsVisible(false)}
          ownedThemeIds={ownedThemeIds}
        />
      </Modal>
    </SafeAreaView>
  );
}

const HowToPlay = ({ onClose }: { onClose: () => void }) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);
  return (
    <View style={styles.settingsPage}>
      <View style={styles.settingsHeader}>
        <Text style={styles.settingsTitle}>How to Play</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.doneButton}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Rule
          title="1. Equal Distribution"
          detail="Each row and column must contain an equal number of both symbols."
        />
        <Rule
          title="2. No Three-in-a-Row"
          detail="There cannot be more than two of the same color directly next to each other, horizontally or vertically."
        />
        <Rule
          title="3. Unique Rows/Cols"
          detail="No two rows or columns can be identical (for larger puzzles)."
        />
        <Rule
          title="4. Move Limit"
          detail="Solve the puzzle in as few moves as possible to earn 3 stars!"
        />
      </ScrollView>
    </View>
  );
};

const Rule = ({ title, detail }: { title: string; detail: string }) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);
  return (
    <View style={styles.ruleItem}>
      <Text style={styles.ruleTitle}>{title}</Text>
      <Text style={styles.ruleDetail}>{detail}</Text>
    </View>
  );
};

type MenuOptionProps = {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  onPress: () => void;
  color?: string;
  uiTheme: UITheme;
};

const MenuOption = ({
  icon,
  label,
  onPress,
  color,
  uiTheme,
}: MenuOptionProps) => {
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);
  const tone = color ?? uiTheme.textPrimary;
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <FontAwesome name={icon} size={18} color={tone} />
      <Text style={[styles.menuText, { color: tone }]}>{label}</Text>
    </TouchableOpacity>
  );
};

type SettingsContentProps = {
  currentTheme: GameTheme;
  onThemeSelect: (index: number) => void;
  onClose: () => void;
  ownedThemeIds: string[];
};

const SettingsContent = ({
  currentTheme,
  onThemeSelect,
  onClose,
  ownedThemeIds,
}: SettingsContentProps) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);
  return (
    <View style={styles.settingsPage}>
      <View style={styles.settingsHeader}>
        <Text style={styles.settingsTitle}>Settings</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.doneButton}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionSubHeader}>Customise Appearance</Text>
        <View style={styles.themeGrid}>
          {AVAILABLE_THEMES.map((theme, index) => {
            const unlocked = isThemeUnlocked(theme.id, ownedThemeIds);
            const isActive = currentTheme.id === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  isActive && styles.activeCard,
                  !unlocked && styles.lockedCard,
                ]}
                onPress={() => {
                  if (unlocked) onThemeSelect(index);
                  else
                    universalNotify(
                      "Locked",
                      "Buy this theme in the Shop."
                    );
                }}
              >
                <View
                  style={[
                    styles.previewContainer,
                    {
                      backgroundColor: theme.tileColor,
                      borderColor: theme.tileEdgeColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.miniShape,
                      { backgroundColor: theme.shape1Color },
                    ]}
                  />
                  <View
                    style={[
                      styles.miniShape,
                      { backgroundColor: theme.shape2Color },
                    ]}
                  />
                </View>
                <Text style={styles.themeLabel}>{theme.label}</Text>
                {!unlocked && (
                  <View style={styles.lockOverlay}>
                    <FontAwesome name="lock" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: uiTheme.background },
    topNav: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: uiTheme.surface,
      borderWidth: 1,
      borderColor: uiTheme.border,
      justifyContent: "center",
      alignItems: "center",
      ...shadows.sm,
    },
    appTitle: {
      ...typography.title,
      color: uiTheme.textPrimary,
      letterSpacing: 0.5,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: uiTheme.surface,
      ...shadows.sm,
    },
    heroBlock: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    heroEyebrow: {
      ...typography.micro,
      color: uiTheme.textMuted,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    heroTitle: {
      ...typography.display,
      color: uiTheme.textPrimary,
      marginBottom: spacing.xs,
    },
    heroSubtitle: {
      ...typography.body,
      color: uiTheme.textMuted,
    },
    ctaRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.xl,
      marginTop: spacing.xl,
      gap: spacing.md,
    },
    ctaCard: {
      flex: 1,
      backgroundColor: uiTheme.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.sm,
    },
    ctaCardPrimary: {
      backgroundColor: uiTheme.primary,
      borderColor: uiTheme.primary,
    },
    ctaCardTitle: {
      ...typography.title,
      fontSize: 18,
      color: uiTheme.textPrimary,
      marginTop: spacing.md,
    },
    ctaCardSubtitle: {
      ...typography.caption,
      color: uiTheme.textMuted,
      marginTop: 2,
    },
    rankContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
    },
    rankEyebrow: {
      ...typography.micro,
      color: uiTheme.textMuted,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    rankText: {
      fontSize: 56,
      fontWeight: "900",
      color: uiTheme.textPrimary,
      letterSpacing: 1,
    },
    rankCaption: {
      ...typography.caption,
      color: uiTheme.textMuted,
      marginTop: spacing.sm,
      textAlign: "center",
    },

    // Profile dropdown
    menuOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.25)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
    },
    profileMenu: {
      marginTop: 70,
      marginRight: spacing.xl,
      backgroundColor: uiTheme.surface,
      borderRadius: radii.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      width: 200,
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.md,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    menuText: {
      marginLeft: spacing.md,
      fontSize: 15,
      fontWeight: "600",
    },
    menuDivider: {
      height: 1,
      backgroundColor: uiTheme.border,
      marginHorizontal: spacing.sm,
    },

    // Settings / How to play sheets
    settingsPage: {
      flex: 1,
      backgroundColor: uiTheme.background,
      padding: spacing.xl,
    },
    settingsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    settingsTitle: {
      ...typography.display,
      color: uiTheme.textPrimary,
    },
    doneButton: {
      ...typography.body,
      color: uiTheme.primary,
      fontWeight: "700",
    },
    sectionSubHeader: {
      ...typography.micro,
      color: uiTheme.textMuted,
      textTransform: "uppercase",
      marginBottom: spacing.md,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    themeCard: {
      width: "48%",
      backgroundColor: uiTheme.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: "center",
      borderWidth: 2,
      borderColor: uiTheme.border,
    },
    activeCard: {
      borderColor: uiTheme.primary,
      backgroundColor: uiTheme.primarySoft,
    },
    previewContainer: {
      flexDirection: "row",
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1.5,
      gap: spacing.sm,
    },
    miniShape: { width: 26, height: 26, borderRadius: 13 },
    themeLabel: {
      ...typography.caption,
      color: uiTheme.textPrimary,
    },
    ruleItem: {
      backgroundColor: uiTheme.surface,
      padding: spacing.md,
      borderRadius: radii.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: uiTheme.primary,
    },
    ruleTitle: {
      ...typography.title,
      fontSize: 16,
      color: uiTheme.textPrimary,
      marginBottom: 4,
    },
    ruleDetail: {
      ...typography.body,
      fontSize: 14,
      color: uiTheme.textMuted,
      lineHeight: 20,
    },
    lockedCard: { opacity: 0.6 },
    lockOverlay: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
    },
  });
