import AsyncStorage from "@react-native-async-storage/async-storage"

const PROGRESS_KEY = "puzzle_progress"

type Progress = Record<number, number>

export async function getProgress(): Promise<Progress> {
  const data = await AsyncStorage.getItem(PROGRESS_KEY)

  if (!data) return {}

  return JSON.parse(data)
}

export async function getUnlockedLevel(chapterId: number) {
  const progress = await getProgress()

  return progress[chapterId] ?? 1
}

export async function unlockNextLevel(chapterId: number, level: number) {
  const progress = await getProgress()

  const currentUnlocked = progress[chapterId] ?? 1

  if (level >= currentUnlocked) {
    progress[chapterId] = level + 1
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  }
}