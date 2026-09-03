import { NavigatorScreenParams, CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type TabParamList = {
  Home: undefined;
  Chapters: { themeIndex?: number } | undefined; // Allow undefined for direct tab navigation
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
  Shop: undefined;
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

export type AchievementsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Achievements">,
  NativeStackScreenProps<RootStackParamList>
>;

export type ShopScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Shop">,
  NativeStackScreenProps<RootStackParamList>
>;

export type LevelModalProps = NativeStackScreenProps<RootStackParamList, "LevelModal">;
export type GameScreenProps = NativeStackScreenProps<RootStackParamList, "Game">;