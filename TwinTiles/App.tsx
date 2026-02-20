import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./tabs/Home";
import ChapterSelect from "./tabs/ChapterSelect";
import LevelSelect from "./components/LevelSelect";
import GameScreen from './components/GameScreen'
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootStackParamList, TabParamList } from "./navigation/types";


const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chapters" component={ChapterSelect} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <RootStack.Navigator>
          <RootStack.Group>
            <RootStack.Screen
              name="Main"
              component={Tabs}
              options={{ headerShown: false }}
            />
          </RootStack.Group>
          <RootStack.Group screenOptions={{ presentation: "modal" }}>
            <RootStack.Screen
              name="Game"
              component={GameScreen}
              options={{ title: "Puzzle" }}
            />
          </RootStack.Group>
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen
              name="LevelModal"
              component={LevelSelect}
              options={{ title: 'Select a Level' }} />
          </RootStack.Group>
        </RootStack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}