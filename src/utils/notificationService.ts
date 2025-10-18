import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure how notifications should behave
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not determined, ask user
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Save permission status
    await AsyncStorage.setItem(
      "notificationPermission",
      finalStatus === "granted" ? "granted" : "denied"
    );

    return {
      granted: finalStatus === "granted",
      canAskAgain: existingStatus === "undetermined",
    };
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return { granted: false, canAskAgain: false };
  }
}

// Check if permissions are granted
export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error checking notification permissions:", error);
    return false;
  }
}

// Schedule a notification for a habit
export async function scheduleHabitNotification(
  habitId: string,
  habitTitle: string,
  time: string // Format: "HH:mm"
): Promise<string | null> {
  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.log("No notification permission");
      return null;
    }

    // Parse time string (e.g., "14:30")
    const [hours, minutes] = time.split(":").map(Number);

    // Create trigger time
    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: hours,
      minute: minutes,
      repeats: true, // Repeat daily
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ เวลาทำ Habit แล้ว!",
        body: habitTitle,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { habitId },
      },
      trigger,
    });

    // Save notification ID for this habit
    await AsyncStorage.setItem(`notification_${habitId}`, notificationId);

    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

// Cancel a notification
export async function cancelHabitNotification(habitId: string): Promise<void> {
  try {
    const notificationId = await AsyncStorage.getItem(
      `notification_${habitId}`
    );
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(`notification_${habitId}`);
    }
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling all notifications:", error);
  }
}

// Get all scheduled notifications
export async function getAllScheduledNotifications() {
  try {
    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
}
