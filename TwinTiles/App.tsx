import { useEffect } from "react";
import { Platform, View, StyleSheet, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

// Contexts & Providers
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ProfileProvider } from "./context/ProfileContext";
import ProfileGate from "./components/ProfileGate";

// Scenes & Tabs
import HomeScreen from "./tabs/Home";
import ChapterSelect from "./tabs/ChapterSelect";
import Achievements from "./tabs/Achievements";
import Shop from "./tabs/Shop";
import LevelModalScreen from "./screens/LevelModal";
import GameScreen from "./components/GameScreen";

// Types & Utilities
import { RootStackParamList, TabParamList } from "./navigation/types";
import { initAudio } from "./utils/audio";
import { initHaptics } from "./utils/haptics";

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Fallback metrics for Web Desktop mode
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
      <View style={styles.webPhoneContainer}>{children}</View>
    </View>
  );
}

function Tabs() {
  const { ui: uiTheme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
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
        },
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

  // Initialize hardware/system integrations on startup
  useEffect(() => {
    initAudio();
    initHaptics();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={uiTheme.surface} />
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: uiTheme.surface },
          headerTintColor: uiTheme.textPrimary,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <RootStack.Screen
          name="Main"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Game"
          component={GameScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <RootStack.Screen
          name="LevelModal"
          component={LevelModalScreen}
          options={{
            presentation: "modal",
            title: "Select a Level",
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider
        initialMetrics={Platform.OS === "web" ? webInitialMetrics : initialWindowMetrics}
      >
        {/* ProfileProvider MUST be outside ThemeProvider so ThemeProvider can use useProfile() */}
        <ProfileProvider>
          <ThemeProvider>
            <ProfileGate>
              <WebMobileWrapper>
                <MainNavigator />
              </WebMobileWrapper>
            </ProfileGate>
          </ThemeProvider>
        </ProfileProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webOuterBackground: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  webPhoneContainer: {
    width: "100%",
    height: "100%",
    maxWidth: 430,
    maxHeight: 932,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#334155",
      },
    }),
  },
});