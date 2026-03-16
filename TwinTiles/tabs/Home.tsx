import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { AVAILABLE_THEMES, GameTheme } from "../constants/themes";
import { useTheme } from "../context/ThemeContext"; // Added

export default function HomeScreen() {
  const [infoVisible, setInfoVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // Changed: Use global theme state instead of local useState
  const { themeIndex, setTheme } = useTheme();
  const currentTheme = AVAILABLE_THEMES[themeIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => setInfoVisible(true)}>
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
        <Pressable style={styles.menuOverlay} onPress={() => setProfileMenuVisible(false)}>
          <View style={styles.profileMenu}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setProfileMenuVisible(false);
                setSettingsVisible(true);
              }}
            >
              <FontAwesome name="cog" size={18} color="#444"/>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider}/>
            <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
              <FontAwesome name="sign-out" size={18} color="#ff6b6b"/>
              <Text style={[styles.menuText, {color: "#ff6b6b"}]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

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
              {AVAILABLE_THEMES.map((theme, index) => ( // Added index
                <TouchableOpacity 
                  key={theme.id} 
                  style={[styles.themeCard, currentTheme.id === theme.id && styles.activeCard]}
                  onPress={() => setTheme(index)} // Changed: update global theme
                >
                  <View style={styles.previewContainer}>
                    <Image source={theme.shape1} style={styles.miniShape} />
                    <Image source={theme.shape2} style={styles.miniShape} />
                  </View>
                  <Text style={styles.themeLabel}>{theme.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.settingsContent}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
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
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  profileMenu: { position: 'absolute', top: 60, right: 20, backgroundColor: 'white', borderRadius: 15, padding: 10, width: 160, elevation: 8, shadowOpacity: 0.2 },
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
  settingsContent: { backgroundColor: 'white', borderRadius: 15, padding: 15 },
  settingLabel: { fontSize: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
});