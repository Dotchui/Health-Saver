import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { UserAddiction } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push notification permissions!');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  },

  async scheduleReminder(userAddiction: UserAddiction): Promise<string | null> {
    try {
      const [hours, minutes] = userAddiction.reminderTime.split(':').map(Number);
      
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Stay Strong! 💪`,
          body: `Remember your commitment to quit ${userAddiction.addiction.name}. You've got this!`,
          data: { addictionId: userAddiction.addictionId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
          repeats: true,
          channelId: 'default',
        },
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  async cancelReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },

  async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  },
};
