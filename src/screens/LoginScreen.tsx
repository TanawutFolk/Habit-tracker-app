import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { wasManualLogout, clearManualLogout } from "../utils/biometricService";

const STORED_EMAIL_KEY = "stored_email";
const STORED_PASSWORD_KEY = "stored_password";
const REMEMBER_ME_KEY = "remember_me";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isManualLogout, setIsManualLogout] = useState(false);

  useEffect(() => {
    checkManualLogout();
    checkBiometricSupport();
    loadStoredCredentials();
  }, []);

  const checkManualLogout = async () => {
    const wasManual = await wasManualLogout();
    setIsManualLogout(wasManual);
  };

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (compatible && enrolled) {
        setHasBiometric(true);
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          setBiometricType("face");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricType("fingerprint");
        } else {
          setBiometricType("biometric");
        }
      }
    } catch (error) {
      console.error("Biometric check error:", error);
    }
  };

  const loadStoredCredentials = async () => {
    try {
      const wasManual = await wasManualLogout();

      // If manual logout, don't load saved credentials
      if (wasManual) {
        setSavedEmail("");
        return;
      }

      const storedEmail = await AsyncStorage.getItem(STORED_EMAIL_KEY);
      const rememberMeValue = await AsyncStorage.getItem(REMEMBER_ME_KEY);

      if (storedEmail) {
        setSavedEmail(storedEmail);
        setEmail(storedEmail);
      }

      if (rememberMeValue === "true") {
        setRememberMe(true);
      }
    } catch (error) {
      console.error("Load credentials error:", error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const savedPassword = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);

      if (!savedPassword || !savedEmail) {
        Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ที่บันทึกไว้");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          biometricType === "face"
            ? "สแกนใบหน้าเพื่อเข้าสู่ระบบ"
            : "สแกนลายนิ้วมือเพื่อเข้าสู่ระบบ",
        fallbackLabel: "ใช้รหัสผ่าน",
        cancelLabel: "ยกเลิก",
      });

      if (result.success) {
        setLoading(true);
        await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
      }
    } catch (error: any) {
      Alert.alert("ข้อผิดพลาด", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    try {
      const savedPassword = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);

      if (!savedPassword || !savedEmail) {
        Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ที่บันทึกไว้");
        return;
      }

      setLoading(true);
      await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
    } catch (error: any) {
      Alert.alert("ข้อผิดพลาด", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Clear manual logout flag on successful login
      await clearManualLogout();

      // Save credentials if remember me is checked
      if (rememberMe) {
        await AsyncStorage.setItem(STORED_EMAIL_KEY, email);
        await AsyncStorage.setItem(REMEMBER_ME_KEY, "true");
        await SecureStore.setItemAsync(STORED_PASSWORD_KEY, password);
      } else {
        await AsyncStorage.removeItem(STORED_EMAIL_KEY);
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
        await SecureStore.deleteItemAsync(STORED_PASSWORD_KEY);
      }
    } catch (error: any) {
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Green Section - Top Part */}
          <LinearGradient
            colors={["#016236", "#35EA44", "#02894B"]}
            style={styles.greenSection}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Profile Picture - Show if user is remembered */}
            {savedEmail && !isManualLogout && (
              <View style={styles.profileContainer}>
                <View style={styles.profilePicture}>
                  <Text style={styles.profileIcon}>👤</Text>
                </View>
                <Text style={styles.savedUsername}>สวัสดี</Text>
                <Text style={styles.savedEmail}>
                  {savedEmail.split("@")[0]}!
                </Text>
              </View>
            )}

            {/* Password Strength Indicator - Show if user is remembered */}
            {savedEmail && !isManualLogout && (
              <TouchableOpacity
                style={styles.passwordIndicator}
                onPress={handlePasswordLogin}
                disabled={loading}
              >
                <Image
                  source={require("../../assets/PasswordLock.png")}
                  style={styles.lockIconImage}
                  resizeMode="contain"
                />
                <View style={styles.dots}>
                  {[...Array(6)].map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i < 4 && styles.dotFilled]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            )}

            {savedEmail && !isManualLogout && (
              <Text style={styles.securityText}>ลืมรหัสผ่าน</Text>
            )}

            {/* Login Form - Show if no saved user OR manual logout */}
            {(!savedEmail || isManualLogout) && (
              <>
                {/* Manual Logout Message */}
                {isManualLogout && (
                  <View style={styles.logoutMessageContainer}>
                    <Text style={styles.logoutMessage}>
                      🔐 กรุณาเข้าสู่ระบบอีกครั้ง
                    </Text>
                  </View>
                )}

                {/* Title */}
                <Text style={styles.title}>—ลงชื่อเข้าใช้—</Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>อีเมล</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="กรอกอีเมลของคุณ"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>รหัสผ่าน</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="********"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Text style={styles.eyeText}>
                        {showPassword ? "👁️" : "👁️"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน?</Text>
                  </TouchableOpacity>
                </View>

                {/* Remember Me Checkbox */}
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberMeText}>จดจำฉันไว้</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <LinearGradient
                  colors={["#E74C3C", "#D11400"]}
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                >
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.loginButtonText}>
                      {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </>
            )}
          </LinearGradient>

          {/* White Section */}
          <View style={styles.whiteSection}>
            {/* Biometric Login Options - Show if user is remembered */}
            {savedEmail && hasBiometric && !isManualLogout && (
              <>
                <Text style={styles.orText}>หรือ</Text>

                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#0DFF90", "#089956"]}
                    style={styles.biometricGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                  >
                    <Image
                      source={require("../../assets/Fingersprint.png")}
                      style={styles.biometricIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.biometricText}>สแกนด้วยลายนิ้วมือ</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#35EA44", "#04870F"]}
                    style={styles.biometricGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                  >
                    <Image
                      source={require("../../assets/FaceScan.png")}
                      style={styles.biometricIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.biometricText}>สแกนด้วยใบหน้า</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Register Section - Show if no saved user OR manual logout */}
            {(!savedEmail || isManualLogout) && (
              <>
                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>หรือ</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Register Link */}
                <Text style={styles.registerText}>ยังไม่มีบัญชีผู้ใช้?</Text>
                <LinearGradient
                  colors={["#0DFF90", "#089956"]}
                  style={styles.registerButton}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Register")}
                    activeOpacity={0.8}
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.registerButtonText}>สมัครสมาชิก</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  greenSection: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  whiteSection: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 30,
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a1a1a",
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  profileIcon: {
    fontSize: 50,
    color: "white",
  },
  savedUsername: {
    fontSize: 16,
    color: "white",
    marginBottom: 2,
  },
  savedEmail: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  passwordIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  lockIconImage: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  dotFilled: {
    backgroundColor: "#4CAF50",
  },
  securityText: {
    textAlign: "center",
    color: "white",
    fontSize: 14,
    marginTop: 5,
  },
  logoutMessageContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  logoutMessage: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTouchable: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#1a1a1a",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "white",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#000",
  },
  passwordContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#000",
  },
  eyeIcon: {
    padding: 16,
  },
  eyeText: {
    fontSize: 20,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotPasswordText: {
    color: "white",
    fontSize: 14,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "white",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "white",
  },
  checkmark: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
  },
  rememberMeText: {
    color: "white",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  orText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  biometricButton: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
  },
  biometricGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  biometricIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  biometricText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#666",
    fontSize: 14,
  },
  registerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: "#00E676",
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
