import AsyncStorage from "@react-native-async-storage/async-storage";
import {addCoins} from './coins';

const KEY_LAST = "STREAK_LAST_LOGIN"
const KEY_COUNT = "STREAK_COUNT"

const REWARDS = [5, 10, 15, 20, 30, 40, 60]
const rewardForDay = (streak: number) => REWARDS[Math.min(streak, REWARDS.length) - 1]

const formatLocalDate = (d: Date): string => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

export type StreakResult = {
    awarded: boolean;
    isFirstEver: boolean;
    streak: number;
    reward: number;
}

export const checkInForToday = async (): Promise<StreakResult> => {
    const lastLogin = await AsyncStorage.getItem(KEY_LAST)
    const isFirstEver = lastLogin === null

    const today = new Date()
    const todayStr = formatLocalDate(today)

    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = formatLocalDate(yesterdayDate)

    if (lastLogin === todayStr) {
        const raw = await AsyncStorage.getItem(KEY_COUNT)
        return {
            awarded: false,
            isFirstEver: false,
            streak: raw ? parseInt(raw, 10) : 1,
            reward: 0,
        }
    }

    let newStreak: number
    if (lastLogin === yesterdayStr) {
        const raw = await AsyncStorage.getItem(KEY_COUNT)
        const current = raw ? parseInt(raw, 10) : 0
        newStreak = current + 1
    } else {
        newStreak = 1
    }

    const reward = rewardForDay(newStreak)
    await AsyncStorage.setItem(KEY_LAST, todayStr)
    await AsyncStorage.setItem(KEY_COUNT, String(newStreak))
    await addCoins(reward)

    return {awarded: true, isFirstEver, streak: newStreak, reward}
}