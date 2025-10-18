import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../config/firebase";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function AccountManagementScreen({ navigation }: any) {
  const user = auth.currentUser;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUsername(userData.username || "");
            setPassword(userData.password || "");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      if (user) {
        // Update in Firestore users collection
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          username: username,
          email: email,
          password: password,
        });

        // Update Firebase Auth display name
        if (username !== user.displayName) {
          await updateProfile(user, { displayName: username });
        }

        // Update Firebase Auth email
        if (email !== user.email && email) {
          await updateEmail(user, email);
        }

        // Update Firebase Auth password if changed
        if (password) {
          await updatePassword(user, password);
        }

        Alert.alert("สำเร็จ", "อัพเดทข้อมูลเรียบร้อยแล้ว");
      }
    } catch (error: any) {
      console.error("Update error:", error);
      Alert.alert("ข้อผิดพลาด", error.message);
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
            <Text style={styles.headerTitle}>การจัดการบัญชี</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>

            {loading ? (
              <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
            ) : (
              <>
                {/* Username Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ชื่อผู้ใช้</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="User012"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Email Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>อีเมล</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="User012@gmail.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={styles.helperText}>
                    *ไม่สามารถเปลี่ยนอีเมลได้*
                  </Text>
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>รหัสผ่าน</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>
              </>
            )}
          </View>

          {/* Update Button */}
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={["#E74C3C", "#D11400"]}
              style={styles.updateButton}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            >
              <TouchableOpacity
                onPress={handleUpdateProfile}
                style={styles.updateTouchable}
                activeOpacity={0.8}
              >
                <Text style={styles.updateText}>บันทึกการเปลี่ยนแปลง</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
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
  formSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    textAlign: "right",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  updateButton: {
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  updateTouchable: {
    width: "100%",
    alignItems: "center",
  },
  updateText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
});
