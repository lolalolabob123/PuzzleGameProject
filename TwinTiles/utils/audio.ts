import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SoundName = "tilePlace" | "win" | "hint" | "undo" | "streak";

const sources: Record<SoundName, number> = {
  tilePlace: require("../assets/audio/pluck_002.ogg"),
  win: require("../assets/audio/confirmation_004.ogg"),
  hint: require("../assets/audio/glass_001.ogg"),
  undo: require("../assets/audio/back_001.ogg"),
  streak: require("../assets/audio/bong_001.ogg"),
};

const cache: Partial<Record<SoundName, AudioPlayer>> = {};
let enabled = true;
let initialised = false;

const KEY = "AUDIO_ENABLED";

export const initAudio = async (): Promise<void> => {
  if (initialised) return;
  
  const stored = await AsyncStorage.getItem(KEY);
  enabled = stored === null ? true : stored === "true";

  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "duckOthers",
    });
  } catch (e) {
    console.warn("Failed to set audio mode", e);
  }

  initialised = true;
};
export const isAudioEnabled = (): boolean => enabled;

export const setAudioEnabled = async (val: boolean): Promise<void> => {
  enabled = val;
  await AsyncStorage.setItem(KEY, String(val));
};

export const playSound = async (name: SoundName): Promise<void> => {
  if (!enabled) return;
  
  try {
    let player = cache[name];
    
    if (!player) {
      player = createAudioPlayer(sources[name]);
      cache[name] = player;
    } else {
      // Reset playhead back to start if playing re-triggered rapid sound effects
      player.seekTo(0);
    }
    
    player.play();
  } catch (e) {
    console.warn("playSound failed", name, e);
  }
};