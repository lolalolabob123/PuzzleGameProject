import { NavigatorScreenParams } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type TabParamList = {
  Home: undefined;
  Chapters: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Game: {
    chapterId: number;
    levelId: number; // Changed from 'level' to 'levelId' to match your LevelSelect code
  };
  LevelModal: {
    chapterId: number;
  };
};

// Prop Helpers
export type HomeScreenProps = BottomTabScreenProps<TabParamList, "Home">;
export type ChapterSelectProps = BottomTabScreenProps<TabParamList, "Chapters">;

export type LevelModalProps = NativeStackScreenProps<RootStackParamList, "LevelModal">;
export type GameScreenProps = NativeStackScreenProps<RootStackParamList, "Game">;