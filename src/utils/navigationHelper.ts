// Custom navigation helper with directional animations
import { CommonActions } from "@react-navigation/native";

// Define screen order for bottom navigation (left to right)
export const BOTTOM_NAV_SCREENS = ["Home", "AddHabit", "Statistic", "Profile"];

// Store current screen index
let currentScreenIndex = 0;

export const setCurrentScreen = (screenName: string) => {
  const index = BOTTOM_NAV_SCREENS.indexOf(screenName);
  if (index !== -1) {
    currentScreenIndex = index;
  }
};

export const navigateWithDirection = (
  navigation: any,
  targetScreen: string,
  params?: any
) => {
  const targetIndex = BOTTOM_NAV_SCREENS.indexOf(targetScreen);

  // If navigating between bottom nav screens
  if (targetIndex !== -1 && currentScreenIndex !== -1) {
    const direction = targetIndex > currentScreenIndex ? "right" : "left";

    // Update current index
    setCurrentScreen(targetScreen);

    // Navigate with custom animation
    navigation.navigate(targetScreen, params);
  } else {
    // For sub-screens, always slide from right
    navigation.navigate(targetScreen, params);
  }
};

export const getCurrentScreenIndex = () => currentScreenIndex;
