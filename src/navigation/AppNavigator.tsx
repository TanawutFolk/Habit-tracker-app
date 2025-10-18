import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../config/firebase";
import { wasManualLogout, clearManualLogout } from "../utils/biometricService";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import AddHabitScreen from "../screens/AddHabitScreen";
import EditHabitScreen from "../screens/EditHabitScreen";
import ProfileScreen from "../screens/ProfileScreen";
import StatisticScreen from "../screens/StatisticScreen";
import AccountManagementScreen from "../screens/AccountManagementScreen";
import HabitManagementScreen from "../screens/HabitManagementScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManualLogout, setIsManualLogout] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Check if user was manually logged out
      const wasManual = await wasManualLogout();

      if (currentUser && wasManual) {
        // If user is logged in but it was a manual logout, sign them out
        await auth.signOut();
        setUser(null);
        setIsManualLogout(true);
      } else {
        setUser(currentUser);
        setIsManualLogout(false);
        // Clear manual logout flag when successfully authenticated
        if (currentUser && wasManual) {
          await clearManualLogout();
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 200,
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                animation: "fade",
                animationDuration: 180,
              }}
            />
            <Stack.Screen
              name="AddHabit"
              component={AddHabitScreen}
              options={{ animation: "fade", animationDuration: 200 }}
            />
            <Stack.Screen
              name="Statistic"
              component={StatisticScreen}
              options={{ animation: "fade", animationDuration: 200 }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ animation: "fade", animationDuration: 200 }}
            />
            <Stack.Screen
              name="EditHabit"
              component={EditHabitScreen}
              options={{
                animation: "fade_from_bottom",
                animationDuration: 220,
              }}
            />
            <Stack.Screen
              name="AccountManagement"
              component={AccountManagementScreen}
              options={{
                animation: "fade_from_bottom",
                animationDuration: 220,
              }}
            />
            <Stack.Screen
              name="HabitManagement"
              component={HabitManagementScreen}
              options={{
                animation: "fade_from_bottom",
                animationDuration: 220,
              }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{
                animation: "fade_from_bottom",
                animationDuration: 220,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: "fade", animationDuration: 180 }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                animation: "fade",
                animationDuration: 200,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
