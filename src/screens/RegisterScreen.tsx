import React, { useState } from "react";
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 6) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Save user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        email,
        createdAt: new Date(),
      });

      Alert.alert("สำเร็จ", "สมัครสมาชิกเรียบร้อยแล้ว");
    } catch (error: any) {
      Alert.alert("สมัครสมาชิกไม่สำเร็จ", error.message);
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

            {/* Title */}
            <Text style={styles.title}>—สมัครสมาชิก—</Text>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ชื่อเล่น</Text>
              <TextInput
                style={styles.input}
                placeholder="กรอกชื่อเล่นของคุณ"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
              />
            </View>

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
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="********"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeText}>
                    {showConfirmPassword ? "👁️" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <LinearGradient
              colors={["#E74C3C", "#D11400"]}
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled,
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            >
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
                style={styles.buttonTouchable}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </LinearGradient>

          {/* White Section - Bottom Part */}
          <View style={styles.whiteSection}>
            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Link */}
            <Text style={styles.loginText}>มีบัญชีผู้ใช้อยู่แล้ว?</Text>
            <LinearGradient
              colors={["#0DFF90", "#089956"]}
              style={styles.loginButton}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.8}
                style={styles.buttonTouchable}
              >
                <Text style={styles.loginButtonText}>ลงชื่อเข้าใช้</Text>
              </TouchableOpacity>
            </LinearGradient>
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
    width: 168,
    height: 168,
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
  registerButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
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
  loginText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: "#00E676",
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
