import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, Alert, Platform, LogBox } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { CommonActions } from '@react-navigation/native';
import { AVAILABLE_THEMES } from "../constants/themes";
import { useTheme } from "../context/ThemeContext";
import { resetChapterProgress, clearAllGameData } from "../utils/progress";
import { HomeScreenProps } from "../navigation/types";
import { GameTheme } from "../constants/themes";
import { useFocusEffect } from "@react-navigation/native";
import { getOwnedItemIds } from "../utils/coins";
import { SHOP_ITEMS } from "../data/shopItems";
import {useProfile} from "../context/ProfileContext"
import { AVAILABLE_AVATARS } from "../data/avatars";
import ProfileSetup from "../components/ProfileSetup"

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.toString().includes('shadow*')) return;
    originalWarn(...args);
  };
} else {
  LogBox.ignoreLogs(['shadow*']);
}

const universalAlert = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: isDestructive ? "destructive" : "default", onPress: onConfirm }
    ]);
  }
};

const universalNotify = (title: string, message: string) => {
  Platform.OS === 'web' ? window.alert(message) : Alert.alert(title, message);
};

const PAID_THEME_IDS = new Set(
  SHOP_ITEMS.filter(i => i.category === "theme").map(i => i.id)
)

const isThemeUnlocked = (themeId: string, owned: string[]) => {
  if (!PAID_THEME_IDS.has(themeId)) return true
  return owned.includes(themeId)
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false)
  const { themeIndex, setTheme } = useTheme();
  const currentTheme = AVAILABLE_THEMES[themeIndex];
  const [ownedThemeIds, setOwnedThemeIds] = useState<string[]>([])
  const {profile} = useProfile()
  const useAvatar = AVAILABLE_AVATARS.find(a => a.id === profile?.avatarId) ?? AVAILABLE_AVATARS[0]
  const [editProfileVisible, setEditProfileVisisble] = useState(false)

  const handleResetChapter = () => {
    universalAlert(
      "Reset Progress",
      "Are you sure you want to reset Chapter 1?",
      async () => {
        // 1. Clear the actual data
        await resetChapterProgress(1);
        setProfileMenuVisible(false);
        setTimeout(() => {
          navigation.navigate("LevelModal", {
            chapterId: 1,
            themeIndex: themeIndex,
            refreshKey: Date.now().toString()
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
        const owned = await getOwnedItemIds()
        if (!cancelled) setOwnedThemeIds(owned)
      })();
      return () => { cancelled = true }
    }, [])
  )

  const renderProfileMenu = () => (
    <Modal visible={profileMenuVisible} transparent animationType="fade">
      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setProfileMenuVisible(false)}>
        <View style={styles.profileMenu}>
          <MenuOption icon="user" label="Edit Profile" onPress={() => {
            setProfileMenuVisible(false)
            setEditProfileVisisble(true)
          }}/>
          <Modal visible={editProfileVisible} animationType="slide" presentationStyle="pageSheet">
            <ProfileSetup
              initialName={profile?.name}
              initialAvatarId={profile?.avatarId}
              onComplete={() => setEditProfileVisisble(false)}/>
          </Modal>
          <View style={styles.menuDivider}/>
          <MenuOption icon="cog" label="Settings" onPress={() => { setProfileMenuVisible(false); setSettingsVisible(true); }} />
          <View style={styles.menuDivider} />
          <MenuOption icon="refresh" label="Reset Chapter 1" color="#f08c00" onPress={handleResetChapter} />
          <View style={styles.menuDivider} />
          <MenuOption icon="trash" label="Clear All Data" color="#ff6b6b" onPress={handleFullReset} />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => setInfoVisible(true)}>
          <FontAwesome name="info-circle" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setProfileMenuVisible(true)}>
          <View style={[styles.headerAvatar, {backgroundColor: useAvatar.color}]}>
            <FontAwesome name={useAvatar.iconName as any} size={20} color="#FFFFF"/>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>Rank</Text>
      </View>

      {renderProfileMenu()}

      <Modal visible={infoVisible} animationType="slide" presentationStyle="pageSheet">
        <HowToPlay onClose={() => setInfoVisible(false)} />
      </Modal>

      <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet">
        <SettingsContent
          currentTheme={currentTheme}
          onThemeSelect={setTheme}
          onClose={() => setSettingsVisible(false)}
          ownedThemeIds={ownedThemeIds} />
      </Modal>
    </SafeAreaView>
  );
}

const HowToPlay = ({ onClose }: { onClose: () => void }) => (
  <View style={styles.settingsPage}>
    <View style={styles.settingsHeader}>
      <Text style={styles.settingsTitle}>How to Play</Text>
      <TouchableOpacity onPress={onClose}><Text style={styles.doneButton}>Close</Text></TouchableOpacity>
    </View>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Rule title="1. Equal Distribution" detail="Each row and column must contain an equal number of both symbols." />
      <Rule title="2. No Three-in-a-Row" detail="There cannot be more than two of the same color directly next to each other, horizontally or vertically." />
      <Rule title="3. Unique Rows/Cols" detail="No two rows or columns can be identical (for larger puzzles)." />
      <Rule title="4. Move Limit" detail="Solve the puzzle in as few moves as possible to earn 3 stars!" />
    </ScrollView>
  </View>
);

const Rule = ({ title, detail }: { title: string, detail: string }) => (
  <View style={styles.ruleItem}>
    <Text style={styles.ruleTitle}>{title}</Text>
    <Text style={styles.ruleDetail}>{detail}</Text>
  </View>
);

type MenuOptionProps = {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  onPress: () => void;
  color?: string;
};
const MenuOption = ({ icon, label, onPress, color = "#444" }: MenuOptionProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <FontAwesome name={icon} size={18} color={color} />
    <Text style={[styles.menuText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

type SettingsContentProps = {
  currentTheme: GameTheme;
  onThemeSelect: (index: number) => void;
  onClose: () => void;
  ownedThemeIds: string[];
};

const SettingsContent = ({ currentTheme, onThemeSelect, onClose, ownedThemeIds }: SettingsContentProps) => (
  <View style={styles.settingsPage}>
    <View style={styles.settingsHeader}>
      <Text style={styles.settingsTitle}>Settings</Text>
      <TouchableOpacity onPress={onClose}><Text style={styles.doneButton}>Done</Text></TouchableOpacity>
    </View>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionSubHeader}>Customise Appearance</Text>
      <View style={styles.themeGrid}>
        {AVAILABLE_THEMES.map((theme, index) => {
          const unlocked = isThemeUnlocked(theme.id, ownedThemeIds)
          return (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeCard,
                currentTheme.id === theme.id && styles.activeCard,
                !unlocked && styles.lockedCard,
              ]}
              onPress={() => {
                if (unlocked) onThemeSelect(index)
                else universalNotify("Locked", "Buy this theme in the Shop.")
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
                  style={[styles.miniShape, { backgroundColor: theme.shape1Color }]}
                />
                <View
                  style={[styles.miniShape, { backgroundColor: theme.shape2Color }]}
                />
              </View>
              <Text style={styles.themeLabel}>{theme.label}</Text>
              {!unlocked && (
                <View style={styles.lockOverlay}>
                  <FontAwesome name="lock" size={20} color="#FFFFF" />
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topNav: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 25, paddingVertical: 15 },
  rankContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  rankText: { fontSize: 24, fontWeight: "bold" },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  profileMenu: { marginTop: 60, marginRight: 20, backgroundColor: 'white', borderRadius: 15, padding: 10, width: 180, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10 },
  menuText: { marginLeft: 12, fontSize: 16, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: '#eee' },
  settingsPage: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingsTitle: { fontSize: 28, fontWeight: 'bold' },
  doneButton: { fontSize: 18, color: '#4dabf7', fontWeight: '600' },
  sectionSubHeader: { fontSize: 13, fontWeight: 'bold', color: '#adb5bd', textTransform: 'uppercase', marginBottom: 15 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  themeCard: { width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, alignItems: 'center', borderWidth: 2, borderColor: '#e9ecef' },
  activeCard: { borderColor: '#4dabf7', backgroundColor: '#e7f5ff' },
  previewContainer: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, gap: 8 },
  miniShape: { width: 26, height: 26, borderRadius: 13},
  themeLabel: { fontSize: 14, fontWeight: '600', color: '#495057' },
  ruleItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#4dabf7' },
  ruleTitle: { fontSize: 16, fontWeight: 'bold', color: '#343a40', marginBottom: 5 },
  ruleDetail: { fontSize: 14, color: '#868e96', lineHeight: 20 },
  lockedCard: { opacity: 0.6, },
  lockOverlay: { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', },
  headerAvatar: {width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center'}
});