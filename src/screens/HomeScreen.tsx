import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format, addDays, subDays } from "date-fns";
import { th } from "date-fns/locale";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { Habit } from "../types";
import {
  scheduleHabitNotification,
  cancelHabitNotification,
} from "../utils/notificationService";

const { width } = Dimensions.get("window");
const DAYS_TO_SHOW = 7;

export default function HomeScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [habitsLog, setHabitsLog] = useState<Map<string, any>>(new Map());
  const flatListRef = React.useRef<FlatList>(null);

  // Modal states
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  useEffect(() => {
    generateDates();
  }, [selectedDate]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const habitsQuery = query(
      collection(db, "habits"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(habitsQuery, (snapshot) => {
      const habitsData: Habit[] = [];
      snapshot.forEach((doc) => {
        habitsData.push({ id: doc.id, ...doc.data() } as Habit);
      });
      setHabits(habitsData);
    });

    return () => unsubscribe();
  }, []);

  // Listen to HabitsLog for the selected date
  useEffect(() => {
    if (!auth.currentUser) return;

    const todayDate = formatDate(selectedDate);
    const logsQuery = query(
      collection(db, "habitsLog"),
      where("userId", "==", auth.currentUser.uid),
      where("date", "==", todayDate)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsMap = new Map();
      snapshot.forEach((doc) => {
        const data = doc.data();
        logsMap.set(data.habitId, { ...data, logId: doc.id });
      });
      setHabitsLog(logsMap);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const generateDates = () => {
    const newDates: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      newDates.push(addDays(selectedDate, i));
    }
    setDates(newDates);
  };

  const getThaiBuddhistYear = (date: Date) => {
    return date.getFullYear() + 543;
  };

  const getThaiMonth = (date: Date) => {
    const months = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    return months[date.getMonth()];
  };

  const getThaiDayShort = (date: Date) => {
    const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    return days[date.getDay()];
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = (date.getFullYear() + 543) % 100;
    return `${day} / ${month} / ${year}`;
  };

  // Check if a habit should be shown on the selected date
  const isHabitActiveOnDate = (habit: Habit, date: Date): boolean => {
    if (!habit.startDate || !habit.endDate) return true; // Show if no date range set

    // Parse Thai Buddhist dates to JavaScript Date objects
    const parseThaiDate = (dateStr: string): Date | null => {
      try {
        const parts = dateStr.split("/").map((p) => p.trim());
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        let year = parseInt(parts[2]);

        // Handle 2-digit year (68 -> 2568) or 4-digit year (2568)
        if (year < 100) {
          year = year + 2500; // 68 -> 2568
        }

        // Convert Thai Buddhist year to Gregorian (2568 -> 2025)
        const gregorianYear = year - 543;

        return new Date(gregorianYear, month - 1, day);
      } catch {
        return null;
      }
    };

    const startDate = parseThaiDate(habit.startDate);
    const endDate = parseThaiDate(habit.endDate);

    if (!startDate || !endDate) return true; // Show if parsing fails

    // Normalize dates to midnight for comparison
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const normalizedStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const normalizedEnd = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    console.log("Debug Habit:", habit.title);
    console.log("Start Date:", habit.startDate, "→", normalizedStart);
    console.log("End Date:", habit.endDate, "→", normalizedEnd);
    console.log("Selected Date:", normalizedDate);
    console.log(
      "Is Active:",
      normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd
    );

    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  };

  // Filter habits that should be shown on selected date
  const visibleHabits = habits.filter((habit) =>
    isHabitActiveOnDate(habit, selectedDate)
  );

  // Calculate completed habits based on the selected date's log and visible habits
  const completedHabits = visibleHabits.filter((habit) => {
    const log = habitsLog.get(habit.id);
    return log && log.done;
  }).length;
  const totalHabits = visibleHabits.length;

  const handleToggleHabit = async (habit: Habit) => {
    if (!auth.currentUser) return;

    try {
      const currentLog = habitsLog.get(habit.id);
      const newCompletedState = currentLog ? !currentLog.done : true;
      const todayDate = formatDate(selectedDate);

      // Check if HabitsLog already exists for this date
      const logsQuery = query(
        collection(db, "habitsLog"),
        where("userId", "==", auth.currentUser.uid),
        where("habitId", "==", habit.id),
        where("date", "==", todayDate)
      );

      const logsSnapshot = await getDocs(logsQuery);

      if (!logsSnapshot.empty) {
        // Update existing log
        const logDoc = logsSnapshot.docs[0];
        await updateDoc(doc(db, "habitsLog", logDoc.id), {
          done: newCompletedState,
          count: newCompletedState ? 1 : 0,
        });
      } else {
        // Create new log for this date
        await addDoc(collection(db, "habitsLog"), {
          userId: auth.currentUser.uid,
          habitId: habit.id,
          date: todayDate,
          count: newCompletedState ? 1 : 0,
          done: newCompletedState,
          notes: "",
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const handleMenuPress = (habit: Habit) => {
    setSelectedHabit(habit);
    setMenuModalVisible(true);
  };

  const handleEditHabit = () => {
    setMenuModalVisible(false);
    if (selectedHabit) {
      navigation.navigate("HabitManagement");
    }
  };

  const handleDeletePress = () => {
    setMenuModalVisible(false);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedHabit || !auth.currentUser) return;

    try {
      // Delete the habit
      await deleteDoc(doc(db, "habits", selectedHabit.id));

      // Delete all logs associated with this habit
      const logsQuery = query(
        collection(db, "habitsLog"),
        where("userId", "==", auth.currentUser.uid),
        where("habitId", "==", selectedHabit.id)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const deletePromises = logsSnapshot.docs.map((logDoc) =>
        deleteDoc(doc(db, "habitsLog", logDoc.id))
      );
      await Promise.all(deletePromises);

      // Cancel notification for this habit
      await cancelHabitNotification(selectedHabit.id);

      setDeleteModalVisible(false);
      setSelectedHabit(null);
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setSelectedHabit(null);
  };

  const getIconSource = (fileName: string) => {
    const iconMap: { [key: string]: any } = {
      "BedTime.png": require("../../assets/Habits_Icon/BedTime.png"),
      "Brushteeth.png": require("../../assets/Habits_Icon/Brushteeth.png"),
      "DrinkWater.png": require("../../assets/Habits_Icon/DrinkWater.png"),
      "EatTime.png": require("../../assets/Habits_Icon/EatTime.png"),
      "Water.png": require("../../assets/Habits_Icon/Water.png"),
      "PrepairTime.png": require("../../assets/Habits_Icon/PrepairTime.png"),
      "SweepHouse.png": require("../../assets/Habits_Icon/SweepHouse.png"),
      "WorkingTime.png": require("../../assets/Habits_Icon/WorkingTime.png"),
      "LearningTime.png": require("../../assets/Habits_Icon/LearningTime.png"),
      "FullLearnTime.png": require("../../assets/Habits_Icon/FullLearnTime.png"),
      "LearningLanggTime.png": require("../../assets/Habits_Icon/LearningLanggTime.png"),
      "CodingTime.png": require("../../assets/Habits_Icon/CodingTime.png"),
      "LetterTime.png": require("../../assets/Habits_Icon/LetterTime.png"),
      "MeetTime.png": require("../../assets/Habits_Icon/MeetTime.png"),
      "LectureTime.png": require("../../assets/Habits_Icon/LectureTime.png"),
      "DocTime.png": require("../../assets/Habits_Icon/DocTime.png"),
      "BikecycleTime.png": require("../../assets/Habits_Icon/BikecycleTime.png"),
      "WeightTime.png": require("../../assets/Habits_Icon/WeightTime.png"),
      "YokaTime.png": require("../../assets/Habits_Icon/YokaTime.png"),
      "RunTime.png": require("../../assets/Habits_Icon/RunTime.png"),
      "ArtTime.png": require("../../assets/Habits_Icon/ArtTime.png"),
      "MusicTime.png": require("../../assets/Habits_Icon/MusicTime.png"),
      "BoradcastTime.png": require("../../assets/Habits_Icon/BoradcastTime.png"),
      "SeriesTime.png": require("../../assets/Habits_Icon/SeriesTime.png"),
      "GameTime.png": require("../../assets/Habits_Icon/GameTime.png"),
      "PetTime.png": require("../../assets/Habits_Icon/PetTime.png"),
      "Shoptime.png": require("../../assets/Habits_Icon/Shoptime.png"),
    };
    return iconMap[fileName] || iconMap["BedTime.png"];
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTodayPress = () => {
    const today = new Date();
    setSelectedDate(today);
  };

  const renderDateItem = ({ item }: { item: Date }) => {
    const isSelected =
      format(item, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
    const isToday =
      format(item, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => handleDatePress(item)}
      >
        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
          {getThaiDayShort(item)}
        </Text>
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
          {item.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHabitItem = (habit: Habit) => {
    // Get completion status from habitsLog for the selected date
    const log = habitsLog.get(habit.id);
    const isCompleted = log && log.done;

    return (
      <View key={habit.id} style={styles.habitCard}>
        <View style={[styles.habitContent, { backgroundColor: habit.color }]}>
          {/* Top Section (30%) */}
          <View style={styles.topSection}>
            <View style={styles.timeSection}>
              <Text style={styles.habitTime}>{habit.time}</Text>
              {habit.startDate && habit.endDate && (
                <Text style={styles.habitDate}>
                  {habit.startDate} - {habit.endDate}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.menuSection}
              onPress={() => handleMenuPress(habit)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuDots}>•••</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Section (70%) */}
          <View style={styles.bottomSection}>
            <View style={styles.checkSection}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  isCompleted && styles.checkboxCompleted,
                ]}
                onPress={() => handleToggleHabit(habit)}
                activeOpacity={0.7}
              >
                {isCompleted && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <Text style={styles.habitDescription}>{habit.description}</Text>
              </View>
            </View>
            <View style={styles.iconSection}>
              <View style={styles.iconContainer}>
                <Image
                  source={getIconSource(habit.icon)}
                  style={styles.habitIconImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#016236", "#35EA44", "#02894B"]}
        style={styles.header}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.dateHeader}>
          <View style={styles.currentDateContainer}>
            <View style={styles.dateRow}>
              <Text style={styles.currentDay}>{selectedDate.getDate()}</Text>
              <View style={styles.monthYearContainer}>
                <Text style={styles.currentMonth}>
                  {getThaiMonth(selectedDate)}
                </Text>
                <Text style={styles.currentYear}>
                  {getThaiBuddhistYear(selectedDate)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.todayButton}
            activeOpacity={0.8}
            onPress={handleTodayPress}
          >
            <Text style={styles.todayButtonText}>วันนี้</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.8}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Date Carousel */}
        <View style={styles.dateCarouselContainer}>
          <FlatList
            ref={flatListRef}
            data={dates}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.toISOString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateCarousel}
          />
        </View>

        {/* Progress Card */}
        <LinearGradient
          colors={["#02894B", "#27AA1C"]}
          style={styles.progressCard}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <LinearGradient
            colors={["#02894B", "#27AA1C"]}
            style={styles.progressCircle}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <Text style={styles.progressText}>
              {completedHabits}/{totalHabits}
            </Text>
          </LinearGradient>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>
              Habits ของคุณสำเร็จมุ่งมั่น
            </Text>
            <Text style={styles.progressDescription}>
              มาทำ "กิจวัตร" วันนี้ทุกท่านเป็น{"\n"}มีสีประจำวันของคุณกันเถอะ!
            </Text>
          </View>
        </LinearGradient>
      </LinearGradient>

      {/* Habits List */}
      <View style={styles.habitsSection}>
        <View style={styles.habitsSectionHeader}>
          <Text style={styles.habitsTitle}>Habits ของคุณ</Text>
          <View style={styles.habitsActions}>
            <TouchableOpacity>
              <Text style={styles.actionText}>เลือก</Text>
            </TouchableOpacity>
            <Text style={styles.separator}> | </Text>
            <TouchableOpacity>
              <Text style={styles.actionText}>ยังไม่เสร็จ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.habitsList}
          showsVerticalScrollIndicator={false}
        >
          {visibleHabits.length > 0 ? (
            visibleHabits.map(renderHabitItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                ไม่มี Habits สำหรับวันนี้{"\n"}
                {habits.length > 0
                  ? "เลือกวันที่อื่นหรือสร้าง Habit ใหม่"
                  : "กดปุ่ม + เพื่อเพิ่ม Habit ใหม่"}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../../assets/HomeIcon.png")}
            style={[styles.navIconImage, styles.navIconActive]}
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
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Image
            source={require("../../assets/ProfileIcon.png")}
            style={styles.navIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuModalVisible}
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuModalVisible(false)}
        >
          <View style={styles.menuModalContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditHabit}
              activeOpacity={0.8}
            >
              <Text style={styles.editButtonText}>แก้ไข</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePress}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>ลบ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
                onPress={handleConfirmDelete}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  headerTop: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 88,
    height: 88,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  currentDateContainer: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currentDay: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginRight: 8,
  },
  monthYearContainer: {
    justifyContent: "center",
  },
  currentMonth: {
    fontSize: 12,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  currentYear: {
    fontSize: 12,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  todayButton: {
    backgroundColor: "#218918",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  todayButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  notificationButton: {
    backgroundColor: "white",
    width: 38,
    height: 38,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationIcon: {
    fontSize: 20,
  },
  dateCarouselContainer: {
    backgroundColor: "white",
    paddingVertical: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateCarousel: {
    paddingHorizontal: 10,
  },
  dateItem: {
    backgroundColor: "white",
    width: 42,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dateItemSelected: {
    backgroundColor: "#D32F2F",
    shadowColor: "#D32F2F",
    shadowOpacity: 0.4,
    elevation: 4,
  },
  dayText: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "white",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dateTextSelected: {
    color: "white",
  },
  progressCard: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    marginRight: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  progressDescription: {
    fontSize: 10,
    color: "white",
    lineHeight: 14,
    opacity: 0.95,
  },
  habitsSection: {
    flex: 1,
    backgroundColor: "white",
    marginTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  habitsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  habitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  habitsActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: "#666",
  },
  separator: {
    color: "#666",
  },
  habitsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  habitCard: {
    marginBottom: 12,
  },
  habitContent: {
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    height: 140,
    overflow: "hidden",
  },
  // Top Section (30%)
  topSection: {
    flexDirection: "row",
    height: 42,
  },
  timeSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  habitTime: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  habitDate: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10,
  },
  menuSection: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#35EA44",
  },
  menuDots: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  // Bottom Section (70%)
  bottomSection: {
    flexDirection: "row",
    height: 98,
  },
  checkSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: "#333",
    backgroundColor: "white",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#00E676",
    borderColor: "#00E676",
  },
  checkmark: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  habitInfo: {
    flex: 1,
    justifyContent: "center",
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "white",
    marginBottom: 3,
  },
  habitDescription: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.95)",
  },
  iconSection: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  iconContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  habitIconImage: {
    width: "45%",
    height: "45%",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomNav: {
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModalContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    width: "80%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editButton: {
    backgroundColor: "#F4FF53",
    borderWidth: 2,
    borderColor: "#333",
    paddingVertical: 15,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: "center",
  },
  editButtonText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#E54636",
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
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
