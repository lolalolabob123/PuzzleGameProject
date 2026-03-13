import { NavigatorScreenParams, CompositeScreenProps } from "@react-navigation/native";
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
    levelId: number;
    forcedReset?: boolean;
  };
  LevelModal: {
    chapterId: number;
  };
};

export type ChapterSelectProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Chapters">,
  NativeStackScreenProps<RootStackParamList>
>;

export type LevelModalProps = NativeStackScreenProps<RootStackParamList, "LevelModal">;
export type GameScreenProps = NativeStackScreenProps<RootStackParamList, "Game">;