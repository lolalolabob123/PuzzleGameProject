import React, {createContext, useContext, useEffect, useState, useCallback} from "react"
import {getProfile, saveProfile, Profile} from "../utils/profile"

type ProfileContextValue = {
    profile: Profile | null;
    loading: boolean;
    updateProfile: (next: Profile) => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

export const ProfileProvider = ({children} : {children: React.ReactNode}) => {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            const stored = await getProfile()
            setProfile(stored)
            setLoading(false)
        })()
    }, [])

    const updateProfile = useCallback(async (next: Profile) => {
        await saveProfile(next)
        setProfile(next)
    }, [])
    return (
        <ProfileContext.Provider value={{profile, loading, updateProfile}}>
            {children}
        </ProfileContext.Provider>
    )
}

export const useProfile = () => {
    const ctx = useContext(ProfileContext)
    if (!ctx) throw new Error("useProfilemust be used inside ProfileProvider")
        return ctx
}