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


const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
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
          } else if (route.name === "Shop") {
            iconName = "shopping-bag";
          }

          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4dabf7",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chapters" component={ChapterSelect} />
      <Tab.Screen name="Shop" component={Shop}/>
    </Tab.Navigator>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationContainer>
          <RootStack.Navigator>
            <RootStack.Group>
              <RootStack.Screen
                name="Main"
                component={Tabs}
                options={{ headerShown: false }}
              />
            </RootStack.Group>

            <RootStack.Screen
              name="Game"
              component={GameScreen}
              options={{ title: "Puzzle", headerShown: false }}
            />

            <RootStack.Group screenOptions={{ presentation: 'modal' }}>
              <RootStack.Screen
                name="LevelModal"
                component={LevelModalScreen}
                options={{ title: 'Select a Level' }}
              />
            </RootStack.Group>
          </RootStack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}