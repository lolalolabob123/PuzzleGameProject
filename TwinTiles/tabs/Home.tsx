import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome } from "@expo/vector-icons";

export default function HomeScreen() {

  const [infoVisible, setInfoVisible] = useState(false)
  const [profileMenuVisible, setProfileMenuVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)

  const openSettings = () => {
    setProfileMenuVisible(true)
    setSettingsVisible(true)
  }

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

      <Modal
      visible={profileMenuVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setProfileMenuVisible(false)}
      >
        <Pressable
        style={styles.menuOverlay}
        onPress={() => setProfileMenuVisible(false)}
        >
          <View style={styles.profileMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
              <FontAwesome name="user" size={18} color="#444"/>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider}/>

            <TouchableOpacity style={[styles.menuItem, {marginBottom: 0}]} onPress={() => {}}>
              <FontAwesome name="sign-out" size={18} color="#ff6b6b"/>
              <Text style={[styles.menuText, {color: "#ff6b6b"}]}>Logout</Text>
            </TouchableOpacity>

          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.settingsPage}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingsContent}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingLabel}>Account Privacy</Text>
          </View>
        </View>
      </Modal>

      <Modal
      animationType="fade"
      transparent={true}
      visible={infoVisible}
      onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Game Guide</Text>
              <TouchableOpacity onPress={() => setInfoVisible(false)}>
                <FontAwesome name="times-circle" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
              
              <View style={styles.guideSection}>
                <Text style={styles.sectionHeader}>Basics</Text>
                <View style={styles.ruleItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.ruleDescription}>Fill the board so every row and column has an equal number of Blue and Red tiles.</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.ruleDescription}>No more than two tiles of the same color can be placed side-by-side.</Text>
                </View>
              </View>

              <View style={styles.guideSection}>
                <Text style={styles.sectionHeader}>Tile Types</Text>
                <View style={styles.ruleItem}>
                  <View style={[styles.colorIndicator, { backgroundColor: '#1c7ed6' }]} />
                  <Text style={styles.ruleDescription}><Text style={styles.bold}>Darker Tiles:</Text> These are permanent level starters.</Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={[styles.colorIndicator, { backgroundColor: '#4dabf7' }]} />
                  <Text style={styles.ruleDescription}><Text style={styles.bold}>Lighter Tiles:</Text> These are placed by you and can be changed.</Text>
                </View>
              </View>

              <View style={[styles.guideSection, styles.lockedSection]}>
                <Text style={styles.lockedText}>New guides unlock as you progress!</Text>
              </View>

            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setInfoVisible(false)}
            >
              <Text style={styles.closeButtonText}>Back to Game</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  rankContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 25,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#212529",
  },
  scrollView: {
    marginBottom: 15,
  },
  guideSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4dabf7",
    marginBottom: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 10,
  },
  bullet: {
    fontSize: 18,
    color: '#333',
    marginRight: 10,
    fontWeight: 'bold',
  },
  colorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 4,
  },
  ruleDescription: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 20,
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
    color: '#212529',
  },
  lockedSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  lockedText: {
    color: '#adb5bd',
    fontStyle: 'italic',
    fontSize: 13,
  },
  closeButton: {
    backgroundColor: "#212529",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // Very light dim
  },
  profileMenu: {
    position: 'absolute',
    top: 60, // Adjust based on your header height
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    width: 160,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    // Shadow for Android
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },

  // Settings Page
  settingsPage: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  doneButton: {
    fontSize: 18,
    color: '#4dabf7',
    fontWeight: '600',
  },
  settingsContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
  },
  settingLabel: {
    fontSize: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    color: '#333',
  },
});