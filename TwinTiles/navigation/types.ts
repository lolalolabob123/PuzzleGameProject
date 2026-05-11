import { NavigatorScreenParams, CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps, NativeStackView } from "@react-navigation/native-stack";
import { BottomTabsScreen } from "react-native-screens";

export type TabParamList = {
  Home: undefined;
  Chapters: {themeIndex?: number};
  Achievements: undefined;
  Shop: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Game: {
    chapterId: number;
    levelId: number;
    themeIndex: number;
    forcedReset?: boolean;
    daily?: boolean;
  };
  LevelModal: {
    chapterId: number;
    themeIndex: number;
    refreshKey?: string;
  };
};

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export type ChapterSelectProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Chapters">,
  NativeStackScreenProps<RootStackParamList>
>;

export type LevelModalProps = NativeStackScreenProps<RootStackParamList, "LevelModal">;
export type GameScreenProps = NativeStackScreenProps<RootStackParamList, "Game">;