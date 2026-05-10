import * as Haptics from "expo-haptics"
import AsyncStorage from "@react-native-async-storage/async-storage"

const KEY = "HAPTICS_ENABLED"
let enabled = true
let initialised = false

export const initHaptics = async (): Promise<void> => {
    if (initialised) return
    const stored = await AsyncStorage.getItem(KEY)
    enabled = stored === null ? true : stored === "true"
    initialised = true
}

export const isHapticsEnabled = (): boolean => enabled

export const setHapticsEnabled = async (val: boolean): Promise<void> => {
    enabled = val
    await AsyncStorage.setItem(KEY, String(val))
}

export const lightImpact = async (): Promise<void> =>   {
    if (!enabled) return
    try {await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} catch{}
}

export const successHaptic = async (): Promise<void> => {
    if (!enabled) return
    try {await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)} catch{}
}

export const errorHaptic = async (): Promise<void> => {
    if (!enabled) return
    try {await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)} catch{}
}