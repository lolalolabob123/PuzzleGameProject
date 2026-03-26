import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, Alert, Platform, LogBox } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { AVAILABLE_THEMES } from "../constants/themes";
import { useTheme } from "../context/ThemeContext";
import { resetChapterProgress, clearAllGameData } from "../utils/progress";

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('shadow*')) return;
    originalWarn(...args);
  };
} else {
  LogBox.ignoreLogs(['shadow*']);
}

export default function HomeScreen() {
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const { themeIndex, setTheme } = useTheme();
  const currentTheme = AVAILABLE_THEMES[themeIndex];

  const handleReset = () => {
    const title = "Reset Progress";
    const message = "Are you sure you want to reset Chapter 1? This cannot be undone.";

    if (Platform.OS === 'web') {
      // Use browser confirm for web
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) performReset();
    } else {
      // Use native Alert for mobile
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: performReset }
      ]);
    }
  };

  const performReset = async () => {
    try {
      await resetChapterProgress(1);
      setProfileMenuVisible(false);

      const successMsg = "Progress has been reset to level 1.";
      if (Platform.OS === 'web') {
        window.alert(successMsg);
      } else {
        Alert.alert("Success", successMsg);
      }
    } catch (error) {
      console.error("Reset failed:", error);
    }
  };

  const handleFullReset = () => {
    const title = "Wipe All Data";
    const message = "This will delete ALL progress and saved level states. This cannot be undone.";

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) performFullReset();
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Everything", style: "destructive", onPress: performFullReset }
      ]);
    }
  };

  const performFullReset = async () => {
    await clearAllGameData();
    setProfileMenuVisible(false);
    const msg = "All data has been cleared.";
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Deleted", msg);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => { /* Info logic */ }}>
          <FontAwesome name="info-circle" size={30} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setProfileMenuVisible(true)}>
          <FontAwesome name="user-circle" size={40} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>Rank</Text>
      </View>

      <Modal visible={profileMenuVisible} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setProfileMenuVisible(false)}
        >
          <View style={styles.profileMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setProfileMenuVisible(false);
                setSettingsVisible(true);
              }}
            >
              <FontAwesome name="cog" size={18} color="#444" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleReset}>
              <FontAwesome name="refresh" size={18} color="#f08c00" />
              <Text style={[styles.menuText, { color: "#f08c00" }]}>Reset Chapter 1</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleFullReset}>
              <FontAwesome name="trash" size={18} color="#ff6b6b" />
              <Text style={[styles.menuText, { color: "#ff6b6b" }]}>Clear All Data</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setProfileMenuVisible(false)}>
              <FontAwesome name="sign-out" size={18} color="#ff6b6b" />
              <Text style={[styles.menuText, { color: "#ff6b6b" }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal - Remains Same */}
      <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.settingsPage}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionSubHeader}>Customise Appearance</Text>
            <View style={styles.themeGrid}>
              {AVAILABLE_THEMES.map((theme, index) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[styles.themeCard, currentTheme.id === theme.id && styles.activeCard]}
                  onPress={() => setTheme(index)}
                >
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topNav: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 25, paddingVertical: 15 },
  rankContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  rankText: { fontSize: 24, fontWeight: "bold" },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)', // Slightly darker so it's visible
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  profileMenu: {
    marginTop: 60,
    marginRight: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    width: 180, // Slightly wider for the text
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
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