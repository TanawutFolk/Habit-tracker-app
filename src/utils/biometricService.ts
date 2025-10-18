import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_ENABLED_KEY = "@biometric_enabled";
const MANUAL_LOGOUT_KEY = "@manual_logout";

/**
 * Check if device supports biometric authentication
 */
export const isBiometricSupported = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error("Error checking biometric support:", error);
    return false;
  }
};

/**
 * Get available biometric types
 */
export const getBiometricTypes = async (): Promise<string[]> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const typeNames: string[] = [];

    types.forEach((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          typeNames.push("ลายนิ้วมือ");
          break;
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          typeNames.push("ใบหน้า");
          break;
        case LocalAuthentication.AuthenticationType.IRIS:
          typeNames.push("ม่านตา");
          break;
      }
    });

    return typeNames;
  } catch (error) {
    console.error("Error getting biometric types:", error);
    return [];
  }
};

/**
 * Authenticate user with biometric
 */
export const authenticateWithBiometric = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "ยืนยันตัวตนเพื่อเข้าใช้งาน",
      fallbackLabel: "ใช้รหัสผ่าน",
      cancelLabel: "ยกเลิก",
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || "การยืนยันตัวตนล้มเหลว",
      };
    }
  } catch (error: any) {
    console.error("Biometric authentication error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาด",
    };
  }
};

/**
 * Check if biometric is enabled
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === "true";
  } catch (error) {
    console.error("Error checking biometric enabled:", error);
    return false;
  }
};

/**
 * Enable biometric authentication
 */
export const enableBiometric = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  } catch (error) {
    console.error("Error enabling biometric:", error);
  }
};

/**
 * Disable biometric authentication
 */
export const disableBiometric = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
  } catch (error) {
    console.error("Error disabling biometric:", error);
  }
};

/**
 * Set manual logout flag (user clicked logout button)
 */
export const setManualLogout = async (isManual: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(MANUAL_LOGOUT_KEY, isManual.toString());
  } catch (error) {
    console.error("Error setting manual logout:", error);
  }
};

/**
 * Check if user logged out manually
 */
export const wasManualLogout = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(MANUAL_LOGOUT_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error checking manual logout:", error);
    return false;
  }
};

/**
 * Clear manual logout flag
 */
export const clearManualLogout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MANUAL_LOGOUT_KEY);
  } catch (error) {
    console.error("Error clearing manual logout:", error);
  }
};
