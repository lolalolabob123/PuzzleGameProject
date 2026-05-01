import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "HINT_COOLDOWNS"
const HINT_CAP = 3
const COOLDOWN_MS = 10 * 60 * 1000

const getStored = async (): Promise<number[]> => {
    try{
        const raw = await AsyncStorage.getItem(KEY)
        return raw ? JSON.parse(raw) : []
    } catch {return []}
}

const getActive = async (): Promise<number[]> => {
    const all = await getStored()
    const now = Date.now()
    const active = all.filter(ts => now - ts < COOLDOWN_MS)
    if (active.length !== all.length) {
        await AsyncStorage.setItem(KEY, JSON.stringify(active))
    }
    return active
}

export const getFreeHintAvailable = async(): Promise<number> => {
    const active = await getActive()
    return Math.max(0, HINT_CAP - active.length)
}

export const recordFreeHintUsed = async (): Promise<void> => {
    const active = await getActive()
    if (active.length >= HINT_CAP) return
    const updated = [...active, Date.now()]
    await AsyncStorage.setItem(KEY, JSON.stringify(updated))
}

export const getNextReplenishMS = async (): Promise<number | null> => {
    const active = await getActive()
    if (active.length === 0) return null
    const oldest = Math.min(...active)
    return Math.min(0, oldest + COOLDOWN_MS - Date.now())
}

export const HINT_REPLENISH_MS = COOLDOWN_MS