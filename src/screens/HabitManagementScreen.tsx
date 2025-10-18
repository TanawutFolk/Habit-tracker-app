import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { Habit } from "../types";
import { cancelHabitNotification } from "../utils/notificationService";

export default function HabitManagementScreen({ navigation }: any) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const habitsRef = collection(db, "habits");
    const q = query(habitsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Habit[];
      setHabits(habitsData);
    });

    return () => unsubscribe();
  }, []);

  // Filter habits based on search query
  const getFilteredHabits = () => {
    if (!searchQuery.trim()) {
      return habits;
    }

    const query = searchQuery.toLowerCase();
    return habits.filter((habit) => {
      // Search in habit title
      if (habit.title.toLowerCase().includes(query)) {
        return true;
      }

      // Search in time
      if (habit.time && habit.time.toLowerCase().includes(query)) {
        return true;
      }

      // Search in dates
      if (habit.startDate && habit.startDate.includes(query)) {
        return true;
      }
      if (habit.endDate && habit.endDate.includes(query)) {
        return true;
      }

      return false;
    });
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!auth.currentUser) return;

    try {
      // Delete the habit
      await deleteDoc(doc(db, "habits", habitId));

      // Delete all logs associated with this habit
      const logsQuery = query(
        collection(db, "habitsLog"),
        where("userId", "==", auth.currentUser.uid),
        where("habitId", "==", habitId)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const deletePromises = logsSnapshot.docs.map((logDoc) =>
        deleteDoc(doc(db, "habitsLog", logDoc.id))
      );
      await Promise.all(deletePromises);

      // Cancel notification for this habit
      await cancelHabitNotification(habitId);

      setDeleteModalVisible(false);
      setSelectedHabit(null);
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const handleDeletePress = (habit: Habit) => {
    setSelectedHabit(habit);
    setDeleteModalVisible(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setSelectedHabit(null);
  };

  const handleEditPress = (habit: Habit) => {
    // Navigate to edit habit screen with habit data
    navigation.navigate("EditHabit", { habitToEdit: habit });
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear() + 543).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const getIconSource = (iconFile: string) => {
    const iconMap: { [key: string]: any } = {
      "ArtTime.png": require("../../assets/Habits_Icon/ArtTime.png"),
      "BedTime.png": require("../../assets/Habits_Icon/BedTime.png"),
      "BikecycleTime.png": require("../../assets/Habits_Icon/BikecycleTime.png"),
      "BoradcastTime.png": require("../../assets/Habits_Icon/BoradcastTime.png"),
      "Brushteeth.png": require("../../assets/Habits_Icon/Brushteeth.png"),
      "CodingTime.png": require("../../assets/Habits_Icon/CodingTime.png"),
      "DocTime.png": require("../../assets/Habits_Icon/DocTime.png"),
      "DrinkWater.png": require("../../assets/Habits_Icon/DrinkWater.png"),
      "EatTime.png": require("../../assets/Habits_Icon/EatTime.png"),
      "FullLearnTime.png": require("../../assets/Habits_Icon/FullLearnTime.png"),
      "GameTime.png": require("../../assets/Habits_Icon/GameTime.png"),
      "LearningLanggTime.png": require("../../assets/Habits_Icon/LearningLanggTime.png"),
      "LearningTime.png": require("../../assets/Habits_Icon/LearningTime.png"),
      "LectureTime.png": require("../../assets/Habits_Icon/LectureTime.png"),
      "LetterTime.png": require("../../assets/Habits_Icon/LetterTime.png"),
      "MeetTime.png": require("../../assets/Habits_Icon/MeetTime.png"),
      "MusicTime.png": require("../../assets/Habits_Icon/MusicTime.png"),
      "PetTime.png": require("../../assets/Habits_Icon/PetTime.png"),
      "PrepairTime.png": require("../../assets/Habits_Icon/PrepairTime.png"),
      "RunTime.png": require("../../assets/Habits_Icon/RunTime.png"),
      "SeriesTime.png": require("../../assets/Habits_Icon/SeriesTime.png"),
      "Shoptime.png": require("../../assets/Habits_Icon/Shoptime.png"),
      "SweepHouse.png": require("../../assets/Habits_Icon/SweepHouse.png"),
      "Time.png": require("../../assets/Habits_Icon/Time.png"),
      "Water.png": require("../../assets/Habits_Icon/Water.png"),
      "WeightTime.png": require("../../assets/Habits_Icon/WeightTime.png"),
      "WorkingTime.png": require("../../assets/Habits_Icon/WorkingTime.png"),
      "YokaTime.png": require("../../assets/Habits_Icon/YokaTime.png"),
    };
    return iconMap[iconFile] || iconMap["BedTime.png"];
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
            <Text style={styles.headerTitle}>การจัดการ Habits</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="ค้นหา Habits ตามชื่อ, เวลา, หรือวันที่..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.resultCount}>
              พบ {getFilteredHabits().length} จาก {habits.length} Habits
            </Text>
          </View>

          {/* Habits List */}
          <View style={styles.habitsList}>
            {getFilteredHabits().length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>ไม่พบ Habits ที่ค้นหา</Text>
                <Text style={styles.emptySubtext}>ลองใช้คำค้นหาอื่นดูนะ</Text>
              </View>
            ) : (
              getFilteredHabits().map((habit) => (
                <View key={habit.id} style={styles.habitCard}>
                  {/* Left Section 85% */}
                  <View style={styles.leftSection}>
                    {/* Text Section 65% */}
                    <View style={styles.textSection}>
                      <Text style={styles.habitName}>{habit.title}</Text>
                      <Text style={styles.habitDetail}>{habit.time}</Text>
                      <Text style={styles.habitDetail}>
                        {habit.startDate} - {habit.endDate}
                      </Text>
                    </View>

                    {/* Icon Section 20% */}
                    <View style={styles.iconSection}>
                      <View
                        style={[
                          styles.colorBox,
                          { backgroundColor: habit.color || "#FF6B6B" },
                        ]}
                      />
                      <View style={styles.iconBox}>
                        <Image
                          source={getIconSource(habit.icon)}
                          style={styles.habitIcon}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Right Section 15% */}
                  <View style={styles.rightSection}>
                    {/* Top 50% - Edit */}
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditPress(habit)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.menuDots}>⋮</Text>
                    </TouchableOpacity>

                    {/* Bottom 50% - Delete */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePress(habit)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={require("../../assets/DeleteHabit.png")}
                        style={styles.deleteIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
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
              onPress={() => navigation.goBack()}
              style={styles.bottomTouchable}
              activeOpacity={0.8}
            >
              <Text style={styles.bottomText}>บันทึกการเปลี่ยนแปลง</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteModalVisible(false)}
        >
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>ยืนยันจะลบใช่ไหม</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.confirmYesButton}
                onPress={() =>
                  selectedHabit && handleDeleteHabit(selectedHabit.id!)
                }
                activeOpacity={0.8}
              >
                <Text style={styles.confirmYesText}>ใช่</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmNoButton}
                onPress={handleCancelDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmNoText}>ไม่</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  searchSection: {
    backgroundColor: "#f9f9f9",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    padding: 0,
  },
  clearButton: {
    padding: 5,
  },
  clearIcon: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
  },
  resultCount: {
    fontSize: 13,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  habitsList: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
  },
  habitCard: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: "row",
    height: 100,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // Left Section 85%
  leftSection: {
    flex: 85,
    flexDirection: "row",
    padding: 15,
  },
  // Text Section 65% of Left
  textSection: {
    flex: 65,
    justifyContent: "center",
  },
  habitName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  habitDetail: {
    fontSize: 13,
    color: "#666",
    marginBottom: 3,
  },
  // Icon Section 20% of Left
  iconSection: {
    flex: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
  },
  habitIcon: {
    width: 28,
    height: 28,
  },
  // Right Section 15%
  rightSection: {
    flex: 15,
    backgroundColor: "#f8f8f8",
  },
  editButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  menuDots: {
    fontSize: 24,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  deleteButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffebee",
  },
  deleteIcon: {
    width: 24,
    height: 24,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 25,
    width: "80%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  confirmYesButton: {
    flex: 1,
    backgroundColor: "#0CF98C",
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  confirmYesText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmNoButton: {
    flex: 1,
    backgroundColor: "#E54636",
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  confirmNoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
