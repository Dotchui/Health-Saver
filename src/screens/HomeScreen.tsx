import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserAddiction, getAddictionSavings, calculateSoberTime } from '../types';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import CustomAlertModal, { AlertButton } from '../components/CustomAlertModal';

type RootStackParamList = {
  Home: undefined;
  AddictionSelection: undefined;
  ReminderSettings: { addictionId: string };
  Stats: { addictionId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [addictions, setAddictions] = useState<UserAddiction[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadAddictions();
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAddictions();
    });
    return unsubscribe;
  }, [navigation]);

  const requestNotificationPermissions = async () => {
    await notificationService.requestPermissions();
  };

  const loadAddictions = async () => {
    try {
      const data = await storageService.getAddictions();
      const updated = data.map((addiction) => {
        const soberTime = calculateSoberTime(addiction.startDate);
        return {
          ...addiction,
          daysSober: soberTime.days,
          hoursSober: soberTime.hours,
        };
      });
      setAddictions(updated);
    } catch (error) {
      console.error('Error loading addictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (addictionId: string) => {
    setAlertConfig({
      visible: true,
      title: 'Remove Addiction',
      message: 'Are you sure you want to remove this addiction tracking?',
      type: 'danger',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            await storageService.removeAddiction(addictionId);
            loadAddictions();
          },
        },
      ],
    });
  };

  const handleFailedStreak = (item: UserAddiction) => {
    setAlertConfig({
      visible: true,
      title: 'Stay Strong! 💪',
      message:
        'Setbacks are part of recovery and growth. Your previous streak will be saved in your stats history.\n\nTake a deep breath and start fresh today!',
      type: 'info',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
        {
          text: 'Reset Streak',
          style: 'default',
          onPress: async () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            await storageService.resetStreak(item.addictionId);
            loadAddictions();
          },
        },
      ],
    });
  };

  const renderAddictionCard = ({ item }: { item: UserAddiction }) => {
    const soberTime = calculateSoberTime(item.startDate);
    const savings = getAddictionSavings(
      item.addictionId,
      item.startDate,
      soberTime.days,
      item.streakHistory,
      item.customDailyHours,
      item.customDailyMoney
    );

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('ReminderSettings', { addictionId: item.addictionId })
          }
        >
          <Text style={styles.icon}>{item.addiction.icon}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.addictionName}>{item.addiction.name}</Text>
            <Text style={styles.reminderTime}>
              Reminder: {item.reminderTime} {item.enabled ? '✅' : '⏸️'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.failedButton}
              activeOpacity={0.7}
              onPress={() => handleFailedStreak(item)}
            >
              <Text style={styles.failedButtonText}>I Failed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.addictionId)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statsContainer}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('Stats', { addictionId: item.addictionId })
          }
        >
          <View style={styles.leftStat}>
            <Text style={styles.statNumber}>{soberTime.formattedShort}</Text>
            <Text style={styles.statLabel}>
              {soberTime.days > 0 ? 'Time Sober' : 'Hours Sober'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rightStats}>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeIcon}>💰</Text>
              <View>
                <Text style={styles.statBadgeValue}>{savings.moneySaved}</Text>
                <Text style={styles.statBadgeLabel}>Money Saved</Text>
              </View>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeIcon}>⏳</Text>
              <View>
                <Text style={styles.statBadgeValue}>{savings.timeSaved}</Text>
                <Text style={styles.statBadgeLabel}>Time Saved</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HealthSaver</Text>
        <Text style={styles.subtitle}>Your Journey to Recovery</Text>
      </View>

      {addictions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyText}>No addictions tracked yet</Text>
          <Text style={styles.emptySubtext}>
            Start your recovery journey by adding an addiction to track
          </Text>
        </View>
      ) : (
        <FlatList
          data={addictions}
          keyExtractor={(item) => item.addictionId}
          renderItem={renderAddictionCard}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddictionSelection')}
      >
        <Text style={styles.addButtonText}>+ Add Addiction</Text>
      </TouchableOpacity>

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#292949',
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 40,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  addictionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  reminderTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  failedButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  failedButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  deleteButton: {
    padding: 6,
  },
  deleteText: {
    fontSize: 18,
  },
  statsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  rightStats: {
    flex: 1.3,
    justifyContent: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadgeIcon: {
    fontSize: 16,
  },
  statBadgeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  statBadgeLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#292949',
    margin: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
