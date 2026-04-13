import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, Alert, Platform, LogBox } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { CommonActions } from '@react-navigation/native';
import { AVAILABLE_THEMES } from "../constants/themes";
import { useTheme } from "../context/ThemeContext";
import { resetChapterProgress, clearAllGameData } from "../utils/progress";

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

export default function HomeScreen({ navigation }: any) {
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { themeIndex, setTheme } = useTheme();
  const currentTheme = AVAILABLE_THEMES[themeIndex];

const handleResetChapter = () => {
    universalAlert(
      "Reset Progress",
      "Are you sure you want to reset Chapter 1?",
      async () => {
        // 1. Clear the actual data
        await resetChapterProgress(1);
        setProfileMenuVisible(false);

        // 2. Refresh the UI by re-navigating with a new key
        // This targets the RootStack, not the Tab stack
        setTimeout(() => {
          navigation.navigate("LevelModal", { 
            chapterId: 1, 
            themeIndex: themeIndex,
            refreshKey: Date.now().toString() // This kills the old view cache
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

  const renderProfileMenu = () => (
    <Modal visible={profileMenuVisible} transparent animationType="fade">
      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setProfileMenuVisible(false)}>
        <View style={styles.profileMenu}>
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
        <TouchableOpacity><FontAwesome name="info-circle" size={30} color="black" /></TouchableOpacity>
        <TouchableOpacity onPress={() => setProfileMenuVisible(true)}>
          <FontAwesome name="user-circle" size={40} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.rankContainer}><Text style={styles.rankText}>Rank</Text></View>
      {renderProfileMenu()}
      <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet">
        <SettingsContent currentTheme={currentTheme} onThemeSelect={setTheme} onClose={() => setSettingsVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const MenuOption = ({ icon, label, onPress, color = "#444" }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <FontAwesome name={icon} size={18} color={color} />
    <Text style={[styles.menuText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const SettingsContent = ({ currentTheme, onThemeSelect, onClose }: any) => (
  <View style={styles.settingsPage}>
    <View style={styles.settingsHeader}>
      <Text style={styles.settingsTitle}>Settings</Text>
      <TouchableOpacity onPress={onClose}><Text style={styles.doneButton}>Done</Text></TouchableOpacity>
    </View>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionSubHeader}>Customise Appearance</Text>
      <View style={styles.themeGrid}>
        {AVAILABLE_THEMES.map((theme, index) => (
          <TouchableOpacity key={theme.id} style={[styles.themeCard, currentTheme.id === theme.id && styles.activeCard]} onPress={() => onThemeSelect(index)}>
            <View style={styles.previewContainer}>
              <Image source={theme.shape1} style={styles.miniShape} />
              <Image source={theme.shape2} style={styles.miniShape} />
            </View>
            <Text style={styles.themeLabel}>{theme.label}</Text>
          </TouchableOpacity>
        ))}
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
  previewContainer: { flexDirection: 'row', marginBottom: 10 },
  miniShape: { width: 30, height: 30, marginHorizontal: 3 },
  themeLabel: { fontSize: 14, fontWeight: '600', color: '#495057' },
});