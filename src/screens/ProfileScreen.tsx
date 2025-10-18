import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import { setManualLogout } from "../utils/biometricService";

export default function ProfileScreen({ navigation }: any) {
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      // Mark as manual logout
      await setManualLogout(true);
      await signOut(auth);
      // Don't navigate manually - AppNavigator will handle it automatically
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#016236", "#35EA44", "#02894B"]}
        style={styles.gradientContainer}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Header */}
          <View style={styles.header}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Profile Picture */}
            <View style={styles.profilePictureContainer}>
              <View style={styles.profilePicture}>
                <Text style={styles.profileIcon}>👤</Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </View>

            {/* Username */}
            <Text style={styles.username}>
              {user?.displayName || user?.email?.split("@")[0] || "User012"}
            </Text>
          </View>

          {/* Menu Section */}
          <View style={styles.menuSection}>
            {/* Menu Item 1 */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("AccountManagement")}
            >
              <View style={styles.menuIconContainer}>
                <Image
                  source={require("../../assets/SettingIcon/ActMng.png")}
                  style={styles.menuIconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>การจัดการบัญชี</Text>
                <Text style={styles.menuSubtitle}>
                  จัดการชื่นผล ยื่อผู้ใช้ และรหัสผ่าน
                </Text>
              </View>
            </TouchableOpacity>

            {/* Menu Item 2 */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("HabitManagement")}
            >
              <View style={styles.menuIconContainer}>
                <Image
                  source={require("../../assets/SettingIcon/Mng.png")}
                  style={styles.menuIconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>การจัดการ Habits</Text>
                <Text style={styles.menuSubtitle}>จัดการ Habits ทั้งหมด</Text>
              </View>
            </TouchableOpacity>

            {/* Menu Item 3 */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("NotificationSettings")}
            >
              <View style={styles.menuIconContainer}>
                <Image
                  source={require("../../assets/SettingIcon/Notic.png")}
                  style={styles.menuIconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>การเเจ้งเตือน Habits</Text>
                <Text style={styles.menuSubtitle}>
                  ปรับแต่ง เสียง รูปแบบการเเจ้งเตือน
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <LinearGradient
          colors={["#E74C3C", "#D11400"]}
          style={styles.logoutButton}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        >
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutTouchable}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Image
            source={require("../../assets/HomeIcon.png")}
            style={styles.navIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("AddHabit")}
        >
          <Image
            source={require("../../assets/AddHabitIcon.png")}
            style={styles.navIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Statistic")}
        >
          <Image
            source={require("../../assets/StatisticIcon.png")}
            style={styles.navIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../../assets/ProfileIcon.png")}
            style={[styles.navIconImage, styles.navIconActive]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  gradientContainer: {
    flex: 1,
    paddingBottom: 140,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1a1a1a",
    borderWidth: 5,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: {
    fontSize: 60,
    color: "white",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#35EA44",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  editIcon: {
    fontSize: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  menuSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuIconImage: {
    width: 32,
    height: 32,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  logoutContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  logoutButton: {
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  logoutTouchable: {
    width: "100%",
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
    paddingBottom: 20,
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    width: 36,
    height: 36,
  },
  navIconImage: {
    width: 24,
    height: 24,
    tintColor: "#999",
  },
  navIconActive: {
    tintColor: "#00E676",
  },
});
