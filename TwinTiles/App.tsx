import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./tabs/Home";
import ChapterSelect from "./tabs/ChapterSelect";
import LevelModalScreen from "./screens/LevelModal";
import GameScreen from './components/GameScreen';
import Shop from "./tabs/Shop";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootStackParamList, TabParamList } from "./navigation/types";
import { FontAwesome } from "@expo/vector-icons";
import { ThemeProvider } from "./context/ThemeContext";
import { ProfileProvider } from "./context/ProfileContext";
import ProfileGate from "./components/ProfileGate";
import Achievements from "./tabs/Achievements";
import { useEffect } from "react";
import { initAudio } from "./utils/audio";
import { initHaptics } from "./utils/haptics";
import { useTheme } from "./context/ThemeContext";

// Imports for Safe Area and Web Layout
import { Platform, View, StyleSheet } from "react-native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Fallback padding values for web browsers (since they don't have safe area notches)
const webInitialMetrics = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
};

/**
 * Mobile Frame Wrapper for Desktop Web
 * Constrains the view on PC screens while remaining full-screen on actual mobile devices.
 */
function WebMobileWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={styles.webOuterBackground}>
      <View style={styles.webPhoneContainer}>
        {children}
      </View>
    </View>
  );
}

function Tabs() {
  const { ui: uiTheme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof FontAwesome.glyphMap = "circle";
          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Chapters") {
            iconName = "th-large";
          } else if (route.name === "Achievements") {
            iconName = "trophy";
          } else if (route.name === "Shop") {
            iconName = "shopping-bag";
          }
          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: uiTheme.primary,
        tabBarInactiveTintColor: uiTheme.textMuted,
        tabBarStyle: {
          backgroundColor: uiTheme.surface,
          borderTopColor: uiTheme.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontWeight: "600",
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chapters" component={ChapterSelect} />
      <Tab.Screen name="Achievements" component={Achievements} />
      <Tab.Screen name="Shop" component={Shop} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { ui: uiTheme } = useTheme();
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: uiTheme.surface },
          headerTintColor: uiTheme.textPrimary,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <RootStack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
        <RootStack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
        <RootStack.Group screenOptions={{ presentation: "modal" }}>
          <RootStack.Screen name="LevelModal" component={LevelModalScreen} options={{ title: "Select a Level" }} />
        </RootStack.Group>
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider 
        initialMetrics={Platform.OS === 'web' ? webInitialMetrics : initialWindowMetrics}
      >
        <ThemeProvider>
          <ProfileProvider>
            <ProfileGate>
              <WebMobileWrapper>
                <MainNavigator />
              </WebMobileWrapper>
            </ProfileGate>
          </ProfileProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webOuterBackground: {
    flex: 1,
    backgroundColor: "#0F172A", // Dark Slate background around the phone frame on desktop
    alignItems: "center",
    justifyContent: "center",
  },
  webPhoneContainer: {
    width: "100%",
    height: "100%",
    maxWidth: 430,   // Standard mobile phone width cap
    maxHeight: 932,  // Standard mobile phone height cap
    overflow: "hidden",
    ...Platform.select({
      web: {
        // Subtle phone bezel and drop shadow on PC desktop browsers
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#334155",
      },
    }),
  },
});