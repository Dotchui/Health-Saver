import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COMMON_ADDICTIONS, UserAddiction } from '../types';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

type RootStackParamList = {
  Home: undefined;
  AddictionSelection: undefined;
  ReminderSettings: { addictionId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ReminderSettings'>;

export default function ReminderSettingsScreen({ route, navigation }: Props) {
  const { addictionId } = route.params;
  const addiction = COMMON_ADDICTIONS.find((a) => a.id === addictionId);

  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [existingAddiction, setExistingAddiction] = useState<UserAddiction | null>(null);
  
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadExistingSettings();
  }, []);

  const scrollToSelectedTime = () => {
    // Each time option has ~40px height (8px padding top + 8px bottom + ~24px content)
    const itemHeight = 40;
    
    if (hourScrollRef.current) {
      hourScrollRef.current.scrollTo({ y: selectedHour * itemHeight, animated: false });
    }
    
    if (minuteScrollRef.current) {
      const minuteIndex = selectedMinute / 5; // Convert minute to index (0, 5, 10... becomes 0, 1, 2...)
      minuteScrollRef.current.scrollTo({ y: minuteIndex * itemHeight, animated: false });
    }
  };

  const loadExistingSettings = async () => {
    const addictions = await storageService.getAddictions();
    const existing = addictions.find((a) => a.addictionId === addictionId);
    
    if (existing) {
      setExistingAddiction(existing);
      const [hour, minute] = existing.reminderTime.split(':').map(Number);
      setSelectedHour(hour);
      setSelectedMinute(minute);
      setEnabled(existing.enabled);
      
      // Scroll to the time after a short delay to ensure layout is complete
      setTimeout(() => {
        scrollToTime(hour, minute);
      }, 300);
    } else if (addictions.length > 0) {
      // For new addictions, use the time from the most recently saved addiction
      const lastAddiction = addictions[addictions.length - 1];
      const [hour, minute] = lastAddiction.reminderTime.split(':').map(Number);
      setSelectedHour(hour);
      setSelectedMinute(minute);
      
      // Scroll to the time after a short delay to ensure layout is complete
      setTimeout(() => {
        scrollToTime(hour, minute);
      }, 300);
    }
  };

  const scrollToTime = (hour: number, minute: number) => {
    // Calculate actual item height: padding (8*2) + fontSize (16) + some line spacing
    // Let's measure more accurately: each TouchableOpacity with padding 8 top/bottom
    // Text is 16px, but actual rendered height with padding is closer to 32px per item
    const itemHeight = 32; 
    const scrollViewHeight = 100; // Height of scrollPicker from styles
    const centerOffset = (scrollViewHeight / 2) - (itemHeight / 2);
    
    if (hourScrollRef.current) {
      const scrollY = (hour * itemHeight) - centerOffset;
      hourScrollRef.current.scrollTo({ y: Math.max(0, scrollY), animated: true });
    }
    
    if (minuteScrollRef.current) {
      const minuteIndex = minute / 5;
      const scrollY = (minuteIndex * itemHeight) - centerOffset;
      minuteScrollRef.current.scrollTo({ y: Math.max(0, scrollY), animated: true });
    }
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
    };

    try {
      if (existingAddiction) {
        await storageService.updateAddiction(addictionId, {
          reminderTime,
          enabled,
        });
      } else {
        await storageService.addAddiction(userAddiction);
      }

      if (enabled) {
        await notificationService.scheduleReminder(userAddiction);
      }

      Alert.alert(
        'Success!',
        `Your reminder for ${addiction.name} has been ${existingAddiction ? 'updated' : 'set up'}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    }
  };

  if (!addiction) {
    return (
      <View style={styles.container}>
        <Text>Addiction not found</Text>
      </View>
    );
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

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
                nestedScrollEnabled={true} 
                scrollEnabled={enabled}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeOption,
                      selectedHour === hour && styles.timeOptionSelected,
                    ]}
                    onPress={() => enabled && setSelectedHour(hour)}
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
                nestedScrollEnabled={true} 
                scrollEnabled={enabled}
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeOption,
                      selectedMinute === minute && styles.timeOptionSelected,
                    ]}
                    onPress={() => enabled && setSelectedMinute(minute)}
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
    backgroundColor: '#6366f1',
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
    height: 100,
    width: 70,
  },
  timeOption: {
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeOptionSelected: {
    backgroundColor: '#6366f1',
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
    color: '#6366f1',
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
