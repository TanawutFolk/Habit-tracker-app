// Navigation helper to handle directional animations
export const SCREEN_ORDER = {
  Home: 0,
  AddHabit: 1,
  Statistic: 2,
  Profile: 3,
};

export const getNavigationAnimation = (
  fromScreen: string,
  toScreen: string
): "slide_from_left" | "slide_from_right" | "slide_from_bottom" | "fade" => {
  const fromIndex = SCREEN_ORDER[fromScreen as keyof typeof SCREEN_ORDER];
  const toIndex = SCREEN_ORDER[toScreen as keyof typeof SCREEN_ORDER];

  // If both screens are in the bottom nav
  if (fromIndex !== undefined && toIndex !== undefined) {
    if (toIndex > fromIndex) {
      return "slide_from_right"; // Going right
    } else if (toIndex < fromIndex) {
      return "slide_from_left"; // Going left
    }
  }

  // For sub-screens (EditHabit, AccountManagement, etc.)
  // Always slide from right
  return "slide_from_right";
};
