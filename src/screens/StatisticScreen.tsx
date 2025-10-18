import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { HabitsLog } from "../types";

export default function StatisticScreen({ navigation }: any) {
  const [selectedMonth, setSelectedMonth] = useState("สิงหาคม 2568");
  const [streak, setStreak] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [weeklyData, setWeeklyData] = useState<number[][]>([
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ]); // [success, fail] for each day
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (auth.currentUser) {
      calculateStatistics();
    }
  }, []);

  useEffect(() => {
    // Refresh statistics when screen comes into focus
    const unsubscribe = navigation.addListener("focus", () => {
      if (auth.currentUser) {
        calculateStatistics();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const calculateStatistics = async () => {
    if (!auth.currentUser) return;

    try {
      // Get all HabitsLog for current user
      const logsQuery = query(
        collection(db, "habitsLog"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("date", "desc")
      );

      const logsSnapshot = await getDocs(logsQuery);
      const logs: HabitsLog[] = [];
      logsSnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as HabitsLog);
      });

      // Calculate streak (consecutive days)
      const calculatedStreak = calculateStreak(logs);
      setStreak(calculatedStreak);

      // Calculate completion rate
      const completedLogs = logs.filter((log) => log.done);
      const rate =
        logs.length > 0
          ? Math.round((completedLogs.length / logs.length) * 100)
          : 0;
      setCompletionRate(rate);

      // Calculate total completed habits
      const completed = completedLogs.length;
      setTotalCompleted(completed);
      setTotalHabits(logs.length);

      // Calculate weekly chart data
      const chartData = calculateWeeklyData(logs);
      setWeeklyData(chartData);

      // Calculate completed dates for calendar
      const completedDatesSet = calculateCompletedDates(logs);
      setCompletedDates(completedDatesSet);
    } catch (error) {
      console.error("Error calculating statistics:", error);
    }
  };

  const calculateCompletedDates = (logs: HabitsLog[]): Set<string> => {
    const completed = new Set<string>();

    // Group logs by date
    const dateGroups: { [key: string]: HabitsLog[] } = {};
    logs.forEach((log) => {
      if (!dateGroups[log.date]) {
        dateGroups[log.date] = [];
      }
      dateGroups[log.date].push(log);
    });

    // Check if all habits are completed for each date
    Object.entries(dateGroups).forEach(([date, dateLogs]) => {
      const allCompleted = dateLogs.every((log) => log.done);
      if (allCompleted && dateLogs.length > 0) {
        // Convert Thai date to day number for comparison
        const logDate = parseThaiDate(date);
        const day = logDate.getDate();
        completed.add(day.toString());
      }
    });

    return completed;
  };

  const calculateWeeklyData = (logs: HabitsLog[]): number[][] => {
    // Get last 7 days starting from today
    const today = new Date();
    const weekData: number[][] = Array(7)
      .fill(0)
      .map(() => [0, 0]); // [success, fail]

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - (6 - i)); // Start from 6 days ago
      checkDate.setHours(0, 0, 0, 0);

      const dateStr = formatDateForComparison(checkDate);

      // Count logs for this date
      const dayLogs = logs.filter((log) => {
        const logDate = parseThaiDate(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === checkDate.getTime();
      });

      const successCount = dayLogs.filter((log) => log.done).length;
      const failCount = dayLogs.filter((log) => !log.done).length;

      weekData[i] = [successCount, failCount];
    }

    return weekData;
  };

  const formatDateForComparison = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = (date.getFullYear() + 543) % 100;
    return `${day} / ${month} / ${year}`;
  };

  const calculateStreak = (logs: HabitsLog[]): number => {
    if (logs.length === 0) return 0;

    // Group logs by date
    const dateGroups: { [key: string]: HabitsLog[] } = {};
    logs.forEach((log) => {
      if (!dateGroups[log.date]) {
        dateGroups[log.date] = [];
      }
      dateGroups[log.date].push(log);
    });

    // Get unique dates sorted in descending order
    const uniqueDates = Object.keys(dateGroups).sort((a, b) => {
      const dateA = parseThaiDate(a);
      const dateB = parseThaiDate(b);
      return dateB.getTime() - dateA.getTime();
    });

    if (uniqueDates.length === 0) return 0;

    // Check if all habits are done for each date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = uniqueDates[i];
      const dateLogs = dateGroups[date];

      // Check if all logs for this date are completed
      const allCompleted = dateLogs.every((log) => log.done);

      const logDate = parseThaiDate(date);
      logDate.setHours(0, 0, 0, 0);

      // Check if this date matches our checking date
      if (logDate.getTime() === checkDate.getTime()) {
        if (allCompleted) {
          currentStreak++;
          // Move to previous day
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        // Gap in dates
        break;
      }
    }

    return currentStreak;
  };

  const parseThaiDate = (dateStr: string): Date => {
    // Assuming format is "DD / MM / YY" in Buddhist year
    const parts = dateStr.split("/").map((p) => p.trim());
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]) + 2500; // Convert Buddhist year to full year
      return new Date(year, month, day);
    }
    return new Date();
  };

  // Calendar data for August 2568 (2025)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const startDay = 5; // August 1, 2025 starts on Friday (5)
  const emptyDays = Array.from({ length: startDay }, (_, i) => null);

  const isCompleted = (day: number) => {
    // Check if this day is in the completedDates set
    return completedDates.has(day.toString());
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={["#016236", "#35EA44", "#02894B"]}
          style={styles.header}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>สถิติ</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {/* Streak Card */}
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{streak} วัน</Text>
              <Text style={styles.statLabel}>ความต่อเนื่อง</Text>
            </View>

            {/* Completion Card */}
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statValue}>{completionRate}%</Text>
              <Text style={styles.statLabel}>อัตรา{"\n"}ความสำเร็จ</Text>
            </View>

            {/* Total Card */}
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>✓</Text>
              <Text style={styles.statValue}>
                {totalCompleted}/{totalHabits}
              </Text>
              <Text style={styles.statLabel}>Habits ทำเสร็จ</Text>
            </View>
          </View>

          {/* Weekly Chart */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>กราฟความสำเร็จ</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendBox, { backgroundColor: "#4CAF50" }]}
                  />
                  <Text style={styles.legendText}>สำเร็จ</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendBox, { backgroundColor: "#F44336" }]}
                  />
                  <Text style={styles.legendText}>ไม่สำเร็จ</Text>
                </View>
              </View>
            </View>

            {/* Bar Chart */}
            <View style={styles.chartContainer}>
              {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, index) => {
                const successCount = weeklyData[index][0];
                const failCount = weeklyData[index][1];
                const maxHeight = 100;
                const totalCount = successCount + failCount;

                // Calculate bar heights (minimum 5px for visibility)
                const successHeight =
                  totalCount > 0
                    ? Math.max(
                        (successCount / Math.max(totalCount, 5)) * maxHeight,
                        successCount > 0 ? 10 : 0
                      )
                    : 0;
                const failHeight =
                  totalCount > 0
                    ? Math.max(
                        (failCount / Math.max(totalCount, 5)) * maxHeight,
                        failCount > 0 ? 10 : 0
                      )
                    : 0;

                return (
                  <View key={day} style={styles.barColumn}>
                    <View style={styles.barGroup}>
                      {/* Success bar */}
                      <View
                        style={[
                          styles.bar,
                          styles.successBar,
                          { height: successHeight },
                        ]}
                      />
                      {/* Fail bar */}
                      <View
                        style={[
                          styles.bar,
                          styles.failBar,
                          { height: failHeight },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </LinearGradient>

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>ปฏิทิน Habits</Text>
            <View style={styles.monthSelector}>
              <TouchableOpacity>
                <Text style={styles.monthArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>{selectedMonth}</Text>
              <TouchableOpacity>
                <Text style={styles.monthArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendar}>
            {/* Day Headers */}
            <View style={styles.weekRow}>
              {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
                <Text key={day} style={styles.dayHeader}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.daysGrid}>
              {[...emptyDays, ...daysInMonth].map((day, index) => (
                <View key={index} style={styles.dayCell}>
                  {day && (
                    <View
                      style={[
                        styles.dayCircle,
                        isCompleted(day) && styles.dayCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isCompleted(day) && styles.dayTextCompleted,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

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
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../../assets/StatisticIcon.png")}
            style={[styles.navIconImage, styles.navIconActive]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "white",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsIcon: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "31%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  chartSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  legendContainer: {
    flexDirection: "row",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: "#666",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 120,
    paddingBottom: 5,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
  },
  barGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    marginBottom: 8,
  },
  bar: {
    width: 12,
    borderRadius: 4,
  },
  successBar: {
    backgroundColor: "#4CAF50",
  },
  failBar: {
    backgroundColor: "#F44336",
  },
  barLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  calendarSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarHeader: {
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  monthArrow: {
    fontSize: 24,
    color: "#333",
    fontWeight: "bold",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  calendar: {
    gap: 8,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  dayHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    width: 40,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayCell: {
    width: "13%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dayCompleted: {
    backgroundColor: "#4CAF50",
  },
  dayText: {
    fontSize: 14,
    color: "#333",
  },
  dayTextCompleted: {
    color: "white",
    fontWeight: "bold",
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
});
