import AsyncStorage from "@react-native-async-storage/async-storage"
import {addCoins} from "./coins"

const KEY_LAST_SOLVED = "DAILY_LAST_SOLVED"
const KEY_TOTAL_SOLVED = "DAILY_TOTAL_SOLVED"
const DAILY_REWARD = 30

export const formatLocalDate = (d: Date): string => {
    const YYYY = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${YYYY}-${mm}-${dd}`
}

export const todayKey = (): string => formatLocalDate(new Date())

export const hasSolvedToday = async (): Promise<boolean> => {
    const last = await AsyncStorage.getItem(KEY_LAST_SOLVED)
    return last === todayKey()
}

export const markDailySolved = async (): Promise<number> => {
    await AsyncStorage.setItem(KEY_LAST_SOLVED, todayKey())
    const raw = await AsyncStorage.getItem(KEY_TOTAL_SOLVED)
    const total = (raw ? parseInt(raw, 10) : 0) + 1
    await AsyncStorage.setItem(KEY_TOTAL_SOLVED, String(total))
    await addCoins(DAILY_REWARD)
    return DAILY_REWARD
}

export const msUntilTomorrow = (): number => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.getTime() - now.getTime()
}