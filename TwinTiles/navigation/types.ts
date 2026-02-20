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
    chapter: string;
    level: number;
  };
  LevelModal: {
    chapterTitle: string;
  };
};


export type HomeScreenProps = BottomTabScreenProps<
  TabParamList,
  "Home"
>;

export type ChapterSelectProps = BottomTabScreenProps<
  TabParamList,
  "Chapters"
>;

export type LevelModalProps = NativeStackScreenProps<
  RootStackParamList,
  "LevelModal"
>;

export type GameScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Game"
>;