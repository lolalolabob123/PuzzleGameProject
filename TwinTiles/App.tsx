import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./tabs/Home";
import ChapterSelect from "./tabs/ChapterSelect";
import LevelModalScreen from "./screens/LevelModal";
import GameScreen from './components/GameScreen'
import Shop from "./tabs/Shop"
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootStackParamList, TabParamList } from "./navigation/types";
import { FontAwesome } from "@expo/vector-icons";
import { ThemeProvider } from "./context/ThemeContext";
import { ProfileProvider } from "./context/ProfileContext";
import ProfileGate from "./components/ProfileGate"
import Achievements from "./tabs/Achievements";
import { useEffect } from "react";
import { initAudio } from "./utils/audio"
import { initHaptics } from "./utils/haptics";
import { useTheme } from "./context/ThemeContext";


const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {

  const { ui: uiTheme } = useTheme()

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
            iconName = "trophy"
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
  const { ui: uiTheme } = useTheme()
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
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ProfileProvider>
          <ProfileGate>
            <MainNavigator />
          </ProfileGate>
        </ProfileProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}