import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome } from "@expo/vector-icons";
import HomeScreen from "./tabs/Home";
import ChapterSelect from "./tabs/ChapterSelect";
import { GestureHandlerRootView } from "react-native-gesture-handler";

type RootTabParamList = {
  Home: undefined;
  Chapters: undefined;
  Leaderboard: undefined
  Shop: undefined
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <GestureHandlerRootView>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarShowLabel: false,
            tabBarStyle: {
              height: 80,
              paddingTop: 5,
              paddingBottom: 15,
            },
            tabBarItemStyle: {
              paddingVertical: 10,
            },
            tabBarIconStyle: {
              marginTop: 5,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="home" size={30} color={color} />
              ),
              tabBarShowLabel: false,
              headerShown: false,
            }}
          />
          <Tab.Screen
            name="Chapters"
            component={ChapterSelect}
            options={{
              title: "Chapters",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="puzzle-piece" size={30} color={color} />
              ),
              tabBarShowLabel: false,
            }}
          />
          <Tab.Screen
            name="Leaderboard"
            component={HomeScreen}
            options={{
              title: "Leaderboard",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="list" size={30} color={color} />
              ),
              tabBarShowLabel: false,
            }}
          />
          <Tab.Screen
            name="Shop"
            component={ChapterSelect}
            options={{
              title: "Shop",
              tabBarIcon: ({ color }) => (
                <FontAwesome name="shopping-cart" size={30} color={color} />
              ),
              tabBarShowLabel: false,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
