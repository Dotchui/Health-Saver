import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COMMON_ADDICTIONS, UserAddiction, ADDICTION_SAVINGS_MAP, DEFAULT_SAVINGS } from '../types';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import CustomAlertModal, { AlertButton } from '../components/CustomAlertModal';

type RootStackParamList = {
  Home: undefined;
  AddictionSelection: undefined;
  ReminderSettings: {
    addictionId: string;
    initialDailyHours?: number;
    initialDailyMoney?: number;
  };
  Stats: { addictionId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ReminderSettings'>;

const ITEM_HEIGHT = 40;
const PICKER_HEIGHT = 120;
const HALF_PICKER = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

export default function ReminderSettingsScreen({ route, navigation }: Props) {
  const { addictionId, initialDailyHours, initialDailyMoney } = route.params;
  const addiction = COMMON_ADDICTIONS.find((a) => a.id === addictionId);

  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [dailyHours, setDailyHours] = useState<number>(
    initialDailyHours || ADDICTION_SAVINGS_MAP[addictionId]?.dailyHours || DEFAULT_SAVINGS.dailyHours
  );

  const [dailyMoney, setDailyMoney] = useState<number>(
    initialDailyMoney || ADDICTION_SAVINGS_MAP[addictionId]?.dailyMoney || DEFAULT_SAVINGS.dailyMoney
  );

  const [enabled, setEnabled] = useState(true);
  const [existingAddiction, setExistingAddiction] = useState<UserAddiction | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'success' | 'danger' | 'info' | 'warning';
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
  });
  
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  useEffect(() => {
    loadExistingSettings();
  }, []);

  const scrollToTime = (hour: number, minute: number, animated = false) => {
    if (hourScrollRef.current) {
      hourScrollRef.current.scrollTo({ y: hour * ITEM_HEIGHT, animated });
    }
    
    if (minuteScrollRef.current) {
      const minuteIndex = minute / 5;
      minuteScrollRef.current.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated });
    }
  };

  const loadExistingSettings = async () => {
    const addictions = await storageService.getAddictions();
    const existing = addictions.find((a) => a.addictionId === addictionId);
    
    let hourToSet = 9;
    let minuteToSet = 0;

    if (existing) {
      setExistingAddiction(existing);
      if (typeof existing.customDailyHours === 'number') {
        setDailyHours(existing.customDailyHours);
      }
      const [hour, minute] = existing.reminderTime.split(':').map(Number);
      hourToSet = hour;
      minuteToSet = minute;
      setEnabled(existing.enabled);
    } else if (addictions.length > 0) {
      // For new addictions, use the time from the most recently saved addiction
      const lastAddiction = addictions[addictions.length - 1];
      const [hour, minute] = lastAddiction.reminderTime.split(':').map(Number);
      hourToSet = hour;
      minuteToSet = minute;
    }

    setSelectedHour(hourToSet);
    setSelectedMinute(minuteToSet);

    // Scroll to center the time after a short delay to ensure layout is complete
    setTimeout(() => {
      scrollToTime(hourToSet, minuteToSet, false);
    }, 150);
  };

  const handleHourSelect = (hour: number) => {
    if (!enabled) return;
    setSelectedHour(hour);
    hourScrollRef.current?.scrollTo({ y: hour * ITEM_HEIGHT, animated: true });
  };

  const handleMinuteSelect = (minute: number) => {
    if (!enabled) return;
    setSelectedMinute(minute);
    minuteScrollRef.current?.scrollTo({ y: (minute / 5) * ITEM_HEIGHT, animated: true });
  };

  const handleHourScrollEnd = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, hours.length - 1));
    setSelectedHour(clampedIndex);
  };

  const handleMinuteScrollEnd = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, minutes.length - 1));
    setSelectedMinute(minutes[clampedIndex]);
  };

  const handleSave = async () => {
    if (!addiction) return;

    const reminderTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute
      .toString()
      .padStart(2, '0')}`;

    const userAddiction: UserAddiction = {
      addictionId: addiction.id,
      addiction,
      startDate: existingAddiction?.startDate || new Date(),
      reminderTime,
      enabled,
      daysSober: existingAddiction?.daysSober || 0,
      streakHistory: existingAddiction?.streakHistory,
      customDailyHours: dailyHours,
    };

    try {
      if (existingAddiction) {
        await storageService.updateAddiction(addictionId, {
          reminderTime,
          enabled,
          customDailyHours: dailyHours,
        });
      } else {
        await storageService.addAddiction(userAddiction);
      }

      if (enabled) {
        await notificationService.scheduleReminder(userAddiction);
      }

      setAlertConfig({
        visible: true,
        title: 'Success!',
        message: `Your reminder for ${addiction.name} has been ${existingAddiction ? 'updated' : 'set up'}.`,
        type: 'success',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              setAlertConfig((prev) => ({ ...prev, visible: false }));
              navigation.popToTop();
            },
          },
        ],
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to save reminder. Please try again.',
        type: 'warning',
        buttons: [
          {
            text: 'OK',
            onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
          },
        ],
      });
    }
  };

  if (!addiction) {
    return (
      <View style={styles.container}>
        <Text>Addiction not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{addiction.icon}</Text>
        <Text style={styles.title}>{addiction.name}</Text>
        <Text style={styles.subtitle}>Set your daily reminder</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, !enabled && styles.sectionDisabled]}>
          <Text style={styles.sectionTitle}>Reminder Time</Text>
          <Text style={styles.sectionSubtitle}>
            Choose when you want to receive your daily motivation
          </Text>

          <View style={styles.timePickerContainer}>
            <View style={styles.timePicker}>
              <Text style={styles.timeLabel}>Hour</Text>
              <ScrollView 
                ref={hourScrollRef}
                style={styles.scrollPicker}
                contentContainerStyle={styles.scrollPickerContent}
                nestedScrollEnabled={true} 
                scrollEnabled={enabled}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleHourScrollEnd}
                onScrollEndDrag={handleHourScrollEnd}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeOption,
                      selectedHour === hour && styles.timeOptionSelected,
                    ]}
                    onPress={() => handleHourSelect(hour)}
                    disabled={!enabled}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedHour === hour && styles.timeTextSelected,
                      ]}
                    >
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            <View style={styles.timePicker}>
              <Text style={styles.timeLabel}>Minute</Text>
              <ScrollView 
                ref={minuteScrollRef}
                style={styles.scrollPicker}
                contentContainerStyle={styles.scrollPickerContent}
                nestedScrollEnabled={true} 
                scrollEnabled={enabled}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMinuteScrollEnd}
                onScrollEndDrag={handleMinuteScrollEnd}
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeOption,
                      selectedMinute === minute && styles.timeOptionSelected,
                    ]}
                    onPress={() => handleMinuteSelect(minute)}
                    disabled={!enabled}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedMinute === minute && styles.timeTextSelected,
                      ]}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Reminder will be sent at:</Text>
            <Text style={styles.previewTime}>
              {selectedHour.toString().padStart(2, '0')}:
              {selectedMinute.toString().padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Daily Time Lost Estimation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Time Lost</Text>
          <Text style={styles.sectionSubtitle}>
            Estimated hours lost per day to calculate your reclaimed time
          </Text>

          <View style={styles.dailyHoursRow}>
            <TouchableOpacity
              style={styles.hourStepBtn}
              onPress={() => setDailyHours((prev) => Math.max(0.5, Math.round((prev - 0.5) * 10) / 10))}
              activeOpacity={0.7}
            >
              <Text style={styles.hourStepText}>−</Text>
            </TouchableOpacity>

            <View style={styles.hourValueContainer}>
              <Text style={styles.hourValueText}>{dailyHours}</Text>
              <Text style={styles.hourValueUnit}>
                {dailyHours === 1 ? 'hour / day' : 'hours / day'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.hourStepBtn}
              onPress={() => setDailyHours((prev) => Math.min(24, Math.round((prev + 0.5) * 10) / 10))}
              activeOpacity={0.7}
            >
              <Text style={styles.hourStepText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Enable Reminder</Text>
              <Text style={styles.toggleSubtext}>
                Receive daily notifications
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={enabled ? '#6366f1' : '#f3f4f6'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {existingAddiction ? 'Update Reminder' : 'Save & Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 12,
    backgroundColor: '#292949',
    alignItems: 'center',
    paddingTop: 10,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 2,
  },
  content: {
    padding: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  timePicker: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  scrollPicker: {
    height: PICKER_HEIGHT,
    width: 70,
  },
  scrollPickerContent: {
    paddingVertical: HALF_PICKER,
  },
  timeOption: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  timeOptionSelected: {
    backgroundColor: '#292949',
  },
  timeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  timeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#292949',
    marginHorizontal: 12,
  },
  previewContainer: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  previewTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
  },
  dailyHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
  },
  hourStepBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hourStepText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4f46e5',
  },
  hourValueContainer: {
    alignItems: 'center',
  },
  hourValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
  },
  hourValueUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  toggleSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
