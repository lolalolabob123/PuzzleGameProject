export type Avatar = {
    id: string;
    iconName: string;
    color: string;
}

export const AVAILABLE_AVATARS: Avatar[] = [
     { id: "fox",  iconName: "github",         color: "#F76C5E" },
  { id: "robot",   iconName: "android",        color: "#5DADE2" },
  { id: "ghost",   iconName: "rocket",         color: "#9B59B6" },
  { id: "leaf",    iconName: "leaf",           color: "#2F7045" },
  { id: "star",    iconName: "star",           color: "#FCC419" },
  { id: "heart",   iconName: "heart",          color: "#E74C3C" },
  { id: "moon",    iconName: "moon-o",         color: "#34495E" },
  { id: "music",   iconName: "music",          color: "#FF3CAC" },
  { id: "anchor",  iconName: "anchor",         color: "#1A5A99" },
  { id: "trophy",  iconName: "trophy",         color: "#D4A017" },
  { id: "flask",   iconName: "flask",          color: "#16A085" },
  { id: "diamond", iconName: "diamond",        color: "#00BCD4" },
]