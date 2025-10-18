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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth, db } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  scheduleHabitNotification,
  cancelHabitNotification,
} from "../utils/notificationService";

// Available colors
const COLORS = [
  "#E74C3C",
  "#E7A03C",
  "#E7D93C",
  "#9AE73C",
  "#3CE7D9",
  "#3D58E6",
  "#B03DE6",
];

// Available icons with categories
const ICONS = {
  ชีวิตประจำวัน: [
    { name: "BedTime", file: "BedTime.png" },
    { name: "Brushteeth", file: "Brushteeth.png" },
    { name: "DrinkWater", file: "DrinkWater.png" },
    { name: "EatTime", file: "EatTime.png" },
    { name: "Water", file: "Water.png" },
    { name: "PrepairTime", file: "PrepairTime.png" },
    { name: "SweepHouse", file: "SweepHouse.png" },
  ],
  "การเรียนรู้/การทำงาน": [
    { name: "WorkingTime", file: "WorkingTime.png" },
    { name: "LearningTime", file: "LearningTime.png" },
    { name: "FullLearnTime", file: "FullLearnTime.png" },
    { name: "LearningLanggTime", file: "LearningLanggTime.png" },
    { name: "CodingTime", file: "CodingTime.png" },
    { name: "LetterTime", file: "LetterTime.png" },
    { name: "MeetTime", file: "MeetTime.png" },
    { name: "LectureTime", file: "LectureTime.png" },
    { name: "DocTime", file: "DocTime.png" },
  ],
  ออกกำลังกาย: [
    { name: "BikecycleTime", file: "BikecycleTime.png" },
    { name: "WeightTime", file: "WeightTime.png" },
    { name: "YokaTime", file: "YokaTime.png" },
    { name: "RunTime", file: "RunTime.png" },
  ],
  งานอดิเรก: [
    { name: "ArtTime", file: "ArtTime.png" },
    { name: "MusicTime", file: "MusicTime.png" },
    { name: "BoradcastTime", file: "BoradcastTime.png" },
    { name: "SeriesTime", file: "SeriesTime.png" },
    { name: "GameTime", file: "GameTime.png" },
    { name: "PetTime", file: "PetTime.png" },
    { name: "Shoptime", file: "Shoptime.png" },
  ],
};

export default function EditHabitScreen({ route, navigation }: any) {
  const { habitToEdit } = route.params || {};

  const [habitName, setHabitName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [repeatDay, setRepeatDay] = useState("ทุกวัน");
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showCustomDayModal, setShowCustomDayModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [color, setColor] = useState("#E74C3C");
  const [icon, setIcon] = useState("BedTime");
  const [iconFile, setIconFile] = useState("BedTime.png");
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);

  // Load habit data when component mounts
  useEffect(() => {
    if (habitToEdit) {
      setHabitName(habitToEdit.title || "");
      setDescription(habitToEdit.description || "");
      setColor(habitToEdit.color || "#E74C3C");
      setIcon(habitToEdit.icon || "BedTime");
      setIconFile(habitToEdit.icon ? `${habitToEdit.icon}.png` : "BedTime.png");
      setRepeatDay(habitToEdit.repeatDay || "ทุกวัน");

      // Parse dates
      if (habitToEdit.startDate) {
        setStartDate(parseThaiDate(habitToEdit.startDate));
      }
      if (habitToEdit.endDate) {
        setEndDate(parseThaiDate(habitToEdit.endDate));
      }

      // Parse time
      if (habitToEdit.time) {
        const [hours, minutes] = habitToEdit.time.split(":").map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours);
        timeDate.setMinutes(minutes);
        setTime(timeDate);
      }
    }
  }, [habitToEdit]);

  const parseThaiDate = (dateStr: string): Date => {
    try {
      const parts = dateStr.split("/").map((p) => p.trim());
      if (parts.length !== 3) return new Date();

      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      let year = parseInt(parts[2]);

      // Handle 2-digit year
      if (year < 100) {
        year = year + 2500;
      }

      // Convert Thai Buddhist year to Gregorian
      const gregorianYear = year - 543;

      return new Date(gregorianYear, month - 1, day);
    } catch {
      return new Date();
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = (date.getFullYear() + 543) % 100;
    return `${day} / ${month} / ${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleRepeatDaySelect = (option: string) => {
    if (option === "ปรับแต่ง") {
      setShowRepeatModal(false);
      setShowCustomDayModal(true);
    } else {
      setRepeatDay(option);
      setSelectedDays([]);
      setShowRepeatModal(false);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const confirmCustomDays = () => {
    if (selectedDays.length > 0) {
      setRepeatDay(`ปรับแต่ง (${selectedDays.length} วัน)`);
    }
    setShowCustomDayModal(false);
  };

  const handleUpdateHabit = async () => {
    if (!habitName || !description) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกชื่อและคำอธิบาย Habit");
      return;
    }

    if (!auth.currentUser || !habitToEdit?.id) {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูล Habit");
      return;
    }

    setLoading(true);
    try {
      const habitRef = doc(db, "habits", habitToEdit.id);
      await updateDoc(habitRef, {
        title: habitName,
        description: description,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        repeatDay: repeatDay,
        color: color,
        icon: icon,
        time: formatTime(time),
        updatedAt: new Date(),
      });

      // Update notification if time changed
      if (habitToEdit.time !== formatTime(time)) {
        await cancelHabitNotification(habitToEdit.id);
        await scheduleHabitNotification(
          habitToEdit.id,
          habitName,
          formatTime(time)
        );
      }

      Alert.alert("สำเร็จ", "แก้ไข Habit เรียบร้อยแล้ว", [
        {
          text: "ตกลง",
          onPress: () => navigation.navigate("HabitManagement"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("เกิดข้อผิดพลาด", error.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Green Section */}
        <LinearGradient
          colors={["#016236", "#35EA44", "#02894B"]}
          style={styles.greenSection}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>แก้ไข Habit</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Habit Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ชื่อ Habits</Text>
              <TextInput
                style={styles.input}
                placeholder="อ่านหนังสือตอน"
                placeholderTextColor="#999"
                value={habitName}
                onChangeText={setHabitName}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>คำอธิบาย</Text>
              <TextInput
                style={styles.input}
                placeholder="วิ่ง คริบอติมาสเตอร์"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Start Date & End Date */}
            <View style={styles.rowGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>วันเริ่มต้น</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateIcon}>📅</Text>
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>วันสิ้นสุด</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateIcon}>📅</Text>
                  <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Repeat Day & Color */}
            <View style={styles.rowGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>วนซ้ำ</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setShowRepeatModal(true)}
                >
                  <Text style={styles.selectText}>{repeatDay}</Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>สี</Text>
                <View style={styles.centerWrapper}>
                  <TouchableOpacity
                    style={styles.colorInput}
                    onPress={() => setShowColorModal(true)}
                  >
                    <View
                      style={[styles.colorBox, { backgroundColor: color }]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Icon & Time */}
            <View style={styles.rowGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>ไอคอน</Text>
                <View style={styles.centerWrapper}>
                  <TouchableOpacity
                    style={styles.iconInput}
                    onPress={() => setShowIconModal(true)}
                  >
                    <Image
                      source={getIconSource(iconFile)}
                      style={styles.iconImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>เวลา</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeText}>{formatTime(time)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Update Button */}
        <View style={styles.buttonContainer}>
          <LinearGradient
            colors={["#E74C3C", "#D11400"]}
            style={styles.createButton}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          >
            <TouchableOpacity
              onPress={handleUpdateHabit}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.buttonTouchable}
            >
              <Text style={styles.createButtonText}>
                {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Color Modal */}
      <Modal
        visible={showColorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowColorModal(false)}
            >
              <Text style={styles.closeIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>สี</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => {
                    setColor(c);
                    setShowColorModal(false);
                  }}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Repeat Day Modal */}
      <Modal
        visible={showRepeatModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRepeatModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRepeatModal(false)}
        >
          <View style={styles.repeatModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRepeatModal(false)}
            >
              <Text style={styles.closeIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>วนซ้ำ</Text>
            {["ทุกวัน", "จันทร์ถึงศุกร์", "เสาร์-อาทิตย์", "ปรับแต่ง"].map(
              (option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.repeatOption,
                    repeatDay.startsWith(option) && styles.repeatOptionSelected,
                  ]}
                  onPress={() => handleRepeatDaySelect(option)}
                >
                  <Text
                    style={[
                      styles.repeatOptionText,
                      repeatDay.startsWith(option) &&
                        styles.repeatOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {option === "ปรับแต่ง" && (
                    <Text style={styles.arrowIcon}>▶</Text>
                  )}
                </TouchableOpacity>
              )
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Day Modal */}
      <Modal
        visible={showCustomDayModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomDayModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCustomDayModal(false)}
        >
          <View style={styles.customDayModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCustomDayModal(false)}
            >
              <Text style={styles.closeIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>ปรับแต่ง</Text>
            <View style={styles.daysGrid}>
              {[
                "จันทร์",
                "อังคาร",
                "พุธ",
                "พฤหัสบดี",
                "ศุกร์",
                "เสาร์",
                "อาทิตย์",
              ].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={styles.dayOptionRow}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={styles.dayOptionText}>{day}</Text>
                  <View
                    style={[
                      styles.checkboxCircle,
                      selectedDays.includes(day) &&
                        styles.checkboxCircleSelected,
                    ]}
                  >
                    {selectedDays.includes(day) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmCustomDays}
            >
              <Text style={styles.confirmButtonText}>ยืนยัน</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Icon Modal */}
      <Modal
        visible={showIconModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIconModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIconModal(false)}
        >
          <View style={styles.iconModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowIconModal(false)}
            >
              <Text style={styles.closeIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>ไอคอน</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(ICONS).map(([category, icons]) => (
                <View key={category} style={styles.iconCategory}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View style={styles.iconGrid}>
                    {icons.map((iconItem) => (
                      <TouchableOpacity
                        key={iconItem.file}
                        style={[
                          styles.iconOption,
                          iconFile === iconItem.file &&
                            styles.iconOptionSelected,
                        ]}
                        onPress={() => {
                          setIcon(iconItem.name);
                          setIconFile(iconItem.file);
                          setShowIconModal(false);
                        }}
                      >
                        <Image
                          source={getIconSource(iconItem.file)}
                          style={styles.iconOptionImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Time Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setTime(selectedTime);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  greenSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
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
    padding: 14,
    fontSize: 15,
    color: "#000",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  rowGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  halfInput: {
    width: "48%",
  },
  centerWrapper: {
    alignItems: "center",
  },
  dateInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dateText: {
    fontSize: 13,
    color: "#333",
  },
  selectInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#00E676",
  },
  colorInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: 60,
    height: 60,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  iconInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: 60,
    height: 60,
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  timeInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    height: 70,
  },
  timeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00E676",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  createButton: {
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonTouchable: {
    width: "100%",
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  iconModalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 28,
    color: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  colorGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  colorOption: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#333",
    transform: [{ scale: 1.1 }],
  },
  repeatModalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "70%",
    maxWidth: 350,
  },
  repeatOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  repeatOptionSelected: {
    backgroundColor: "#E8F5E9",
  },
  repeatOptionText: {
    fontSize: 16,
    color: "#333",
  },
  repeatOptionTextSelected: {
    color: "#00E676",
    fontWeight: "600",
  },
  arrowIcon: {
    fontSize: 14,
    color: "#999",
  },
  customDayModalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  daysGrid: {
    gap: 10,
    marginBottom: 20,
  },
  dayOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dayOptionText: {
    fontSize: 15,
    color: "#333",
  },
  checkboxCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCircleSelected: {
    backgroundColor: "#00E676",
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  confirmButton: {
    backgroundColor: "#00E676",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  iconCategory: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconOption: {
    width: 60,
    height: 60,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconOptionSelected: {
    borderColor: "#00E676",
    backgroundColor: "#E8F5E9",
  },
  iconOptionImage: {
    width: 40,
    height: 40,
  },
});
