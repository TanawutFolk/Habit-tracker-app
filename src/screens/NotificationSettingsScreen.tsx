import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  checkNotificationPermissions,
  requestNotificationPermissions,
  cancelAllNotifications,
  getAllScheduledNotifications,
} from "../utils/notificationService";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { scheduleHabitNotification } from "../utils/notificationService";

export default function NotificationSettingsScreen({ navigation }: any) {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [habitHabitEnabled, setHabitHabitEnabled] = useState(false);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false);
  const [selectedSound, setSelectedSound] = useState("Habit Habit");
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const permission = await checkNotificationPermissions();
      setHasPermission(permission);

      const savedEnabled = await AsyncStorage.getItem("notificationEnabled");
      if (savedEnabled !== null) {
        setNotificationEnabled(savedEnabled === "true");
      }

      const savedHabitHabit = await AsyncStorage.getItem("habitHabitEnabled");
      if (savedHabitHabit !== null) {
        setHabitHabitEnabled(savedHabitHabit === "true");
      }

      const savedTextToSpeech = await AsyncStorage.getItem(
        "textToSpeechEnabled"
      );
      if (savedTextToSpeech !== null) {
        setTextToSpeechEnabled(savedTextToSpeech === "true");
      }

      const savedSound = await AsyncStorage.getItem("selectedSound");
      if (savedSound !== null) {
        setSelectedSound(savedSound);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value && !hasPermission) {
      // Request permission if not granted
      const result = await requestNotificationPermissions();
      if (!result.granted) {
        Alert.alert(
          "ไม่ได้รับอนุญาต",
          "กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าของระบบ"
        );
        return;
      }
      setHasPermission(true);
    }

    setNotificationEnabled(value);
    await AsyncStorage.setItem("notificationEnabled", value.toString());

    if (value) {
      // Re-schedule all habit notifications
      await rescheduleAllNotifications();
    } else {
      // Cancel all notifications
      await cancelAllNotifications();
    }
  };

  const rescheduleAllNotifications = async () => {
    if (!auth.currentUser) return;

    try {
      // Get all user habits
      const habitsQuery = query(
        collection(db, "habits"),
        where("userId", "==", auth.currentUser.uid)
      );
      const habitsSnapshot = await getDocs(habitsQuery);

      // Schedule notification for each habit
      for (const habitDoc of habitsSnapshot.docs) {
        const habit = habitDoc.data();
        await scheduleHabitNotification(habitDoc.id, habit.title, habit.time);
      }
    } catch (error) {
      console.error("Error rescheduling notifications:", error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await AsyncStorage.setItem(
        "notificationEnabled",
        notificationEnabled.toString()
      );
      await AsyncStorage.setItem(
        "habitHabitEnabled",
        habitHabitEnabled.toString()
      );
      await AsyncStorage.setItem(
        "textToSpeechEnabled",
        textToSpeechEnabled.toString()
      );
      await AsyncStorage.setItem("selectedSound", selectedSound);

      Alert.alert("สำเร็จ", "บันทึกการตั้งค่าเรียบร้อยแล้ว", [
        {
          text: "ตกลง",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกการตั้งค่าได้");
    }
  };

  return (
    <LinearGradient
      colors={["#016236", "#35EA44", "#02894B"]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* White Container */}
      <View style={styles.whiteContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Settings Section */}
          <View style={styles.settingsSection}>
            {/* Notification Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>การแจ้งเตือน</Text>
                <Text style={styles.settingSubtitle}>
                  เปิด/ปิด การแจ้งเตือน habits เวลาแจ้งเตือน
                </Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
                thumbColor={notificationEnabled ? "#fff" : "#f4f3f4"}
              />
            </View>

            {/* Sound Selection */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>รูปแบบเสียงการแจ้งเตือน</Text>
                <Text style={styles.settingSubtitle}>
                  ปรับเสียงการแจ้งเตือน ตามที่คุณเลือกการ
                </Text>
              </View>
              <TouchableOpacity style={styles.soundSelector}>
                <Text style={styles.soundText}>Habit Habit</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Habit Habit Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>เสียงการแจ้งเตือน</Text>
                <Text style={styles.settingSubtitle}>
                  เปิด/ปิดเสียงการแจ้งเตือน ชื่อที่คุณเลือกการ
                </Text>
              </View>
              <View style={styles.radioButton}>
                {habitHabitEnabled && <View style={styles.radioButtonInner} />}
              </View>
            </View>

            {/* Text to Speech Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Text-to-Speech</Text>
                <Text style={styles.settingSubtitle}>
                  ให้เสียงทางเเจ้งเตือนของคุณ เป็นชื่อ Habit ของคุณ
                </Text>
              </View>
              <View style={styles.radioButton}>
                {textToSpeechEnabled && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomButtonContainer}>
          <LinearGradient
            colors={["#E74C3C", "#D11400"]}
            style={styles.bottomButton}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          >
            <TouchableOpacity
              onPress={handleSaveSettings}
              style={styles.bottomTouchable}
              activeOpacity={0.8}
            >
              <Text style={styles.bottomText}>บันทึกการเปลี่ยนแปลง</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 15,
    marginTop: 60,
    marginHorizontal: 15,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 36,
    color: "#1a1a1a",
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  settingsSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 100,
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    paddingRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#999",
    lineHeight: 16,
  },
  soundSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 8,
  },
  soundText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownIcon: {
    fontSize: 10,
    color: "#666",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: "white",
  },
  bottomButton: {
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomTouchable: {
    width: "100%",
    alignItems: "center",
  },
  bottomText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
