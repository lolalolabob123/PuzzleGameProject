import AsyncStorage from "@react-native-async-storage/async-storage";

export type Profile = {
    name: string;
    avatarId: string;
}

const KEY = "USER_PROFILE"

export const getProfile = async (): Promise<Profile | null> => {
    try{
        const raw = await AsyncStorage.getItem(KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export const saveProfile = async (profile: Profile): Promise<void> => {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile))
}

export const clearProfile = async (): Promise<void> => {
    await AsyncStorage.removeItem(KEY)
}