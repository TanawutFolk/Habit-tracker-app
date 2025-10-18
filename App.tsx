import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  LogBox,
} from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { requestNotificationPermissions } from "./src/utils/notificationService";

// Ignore specific warnings from expo-notifications
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "expo-notifications was removed from Expo Go",
]);

export default function App() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    checkAndRequestPermission();
  }, []);

  const checkAndRequestPermission = async () => {
    // Show permission modal on first launch
    setShowPermissionModal(true);
  };

  const handleAllowNotifications = async () => {
    const result = await requestNotificationPermissions();
    setShowPermissionModal(false);
    setPermissionChecked(true);
  };

  const handleDenyNotifications = () => {
    setShowPermissionModal(false);
    setPermissionChecked(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />

      {/* Permission Request Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPermissionModal}
        onRequestClose={handleDenyNotifications}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.permissionModal}>
            <Text style={styles.modalTitle}>🔔 การแจ้งเตือน</Text>
            <Text style={styles.modalMessage}>
              Habit Tracker ต้องการส่งการแจ้งเตือน{"\n"}
              เพื่อเตือนคุณเมื่อถึงเวลาทำ Habits
            </Text>
            <Text style={styles.modalSubMessage}>
              คุณสามารถเปลี่ยนแปลงการตั้งค่า{"\n"}
              ได้ในภายหลัง
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.allowButton}
                onPress={handleAllowNotifications}
                activeOpacity={0.8}
              >
                <Text style={styles.allowButtonText}>อนุญาต</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.denyButton}
                onPress={handleDenyNotifications}
                activeOpacity={0.8}
              >
                <Text style={styles.denyButtonText}>ไม่อนุญาต</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 10,
  },
  modalSubMessage: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 25,
  },
  modalButtons: {
    gap: 12,
  },
  allowButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  allowButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  denyButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  denyButtonText: {
    color: "#666",
    fontSize: 18,
    fontWeight: "600",
  },
});
