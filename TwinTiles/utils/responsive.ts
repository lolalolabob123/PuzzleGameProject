import { useWindowDimensions } from "react-native"

export function useResponsive() {
  const { width, height } = useWindowDimensions()

  const scale = width / 375
  const isTablet = width >= 768

  return {
    width,
    height,
    scale,
    isTablet,
  }
}