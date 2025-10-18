import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  authenticateWithBiometric,
  getBiometricTypes,
  clearManualLogout,
} from "../utils/biometricService";

interface BiometricAuthScreenProps {
  onAuthenticated: () => void;
  onUsePassword: () => void;
}

export default function BiometricAuthScreen({
  onAuthenticated,
  onUsePassword,
}: BiometricAuthScreenProps) {
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBiometricTypes();
    // Auto-trigger biometric on mount
    setTimeout(() => {
      handleBiometricAuth();
    }, 500);
  }, []);

  const loadBiometricTypes = async () => {
    const types = await getBiometricTypes();
    setBiometricTypes(types);
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    const result = await authenticateWithBiometric();

    if (result.success) {
      // Clear manual logout flag
      await clearManualLogout();
      onAuthenticated();
    } else {
      Alert.alert("การยืนยันตัวตนล้มเหลว", result.error || "กรุณาลองอีกครั้ง", [
        {
          text: "ลองอีกครั้ง",
          onPress: handleBiometricAuth,
        },
        {
          text: "ใช้รหัสผ่าน",
          onPress: onUsePassword,
        },
      ]);
    }
    setLoading(false);
  };

  const getBiometricIcon = () => {
    if (biometricTypes.includes("ใบหน้า")) {
      return "👤";
    } else if (biometricTypes.includes("ลายนิ้วมือ")) {
      return "👆";
    } else {
      return "🔒";
    }
  };

  const getBiometricText = () => {
    if (biometricTypes.length > 0) {
      return `ยืนยันด้วย${biometricTypes.join(" หรือ ")}`;
    }
    return "ยืนยันตัวตน";
  };

  return (
    <LinearGradient
      colors={["#016236", "#35EA44", "#02894B"]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getBiometricIcon()}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>ยืนยันตัวตน</Text>
        <Text style={styles.subtitle}>{getBiometricText()}</Text>

        {/* Loading */}
        {loading && (
          <ActivityIndicator
            size="large"
            color="#ffffff"
            style={styles.loader}
          />
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
            disabled={loading}
          >
            <LinearGradient
              colors={["#ffffff", "#f0f0f0"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            >
              <Text style={styles.biometricButtonText}>
                {loading ? "กำลังยืนยัน..." : "ยืนยันตัวตน"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.passwordButton}
            onPress={onUsePassword}
            disabled={loading}
          >
            <Text style={styles.passwordButtonText}>ใช้รหัสผ่าน</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
    marginBottom: 40,
    textAlign: "center",
  },
  loader: {
    marginVertical: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  biometricButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  biometricButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#016236",
  },
  passwordButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  passwordButtonText: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
    textDecorationLine: "underline",
  },
});
