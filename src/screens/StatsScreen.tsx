import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  COMMON_ADDICTIONS,
  UserAddiction,
  getAddictionSavings,
  calculateSoberTime,
  StreakHistoryEntry,
} from '../types';
import { storageService } from '../services/storageService';

type RootStackParamList = {
  Home: undefined;
  AddictionSelection: undefined;
  ReminderSettings: { addictionId: string };
  Stats: { addictionId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export default function StatsScreen({ route, navigation }: Props) {
  const { addictionId } = route.params;
  const commonAddiction = COMMON_ADDICTIONS.find((a) => a.id === addictionId);
  const [userAddiction, setUserAddiction] = useState<UserAddiction | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    loadAddiction();
    const intervalId = setInterval(() => {
      setTick((t) => t + 1);
    });
    return () => clearInterval(intervalId);
  }, []);

  const loadAddiction = async () => {
    const addictions = await storageService.getAddictions();
    const found = addictions.find((a) => a.addictionId === addictionId);
    if (found) {
      const soberTime = calculateSoberTime(found.startDate);
      setUserAddiction({
        ...found,
        daysSober: soberTime.days,
        hoursSober: soberTime.hours,
      });
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const addictionName = userAddiction?.addiction.name || commonAddiction?.name || 'Addiction';
  const addictionIcon = userAddiction?.addiction.icon || commonAddiction?.icon || '🎯';
  const startDate = userAddiction?.startDate ?? new Date();
  const streakHistory = userAddiction?.streakHistory || [];

  const soberTime = calculateSoberTime(startDate);
  const currentTotalHours = soberTime.totalHours;

  const savings = getAddictionSavings(
    addictionId,
    startDate,
    soberTime.days,
    streakHistory,
    userAddiction?.customDailyHours,
    userAddiction?.customDailyMoney
  );

  const getStreakHours = (streak: StreakHistoryEntry) => {
    if (typeof streak.totalHours === 'number') return streak.totalHours;
    if (streak.startDate && streak.endDate) {
      return calculateSoberTime(streak.startDate, streak.endDate).totalHours;
    }
    return (streak.days || 0) * 24 + (streak.hours || 0);
  };

  const bestStreakHours = Math.max(
    currentTotalHours,
    ...streakHistory.map((s) => getStreakHours(s)),
    0
  );

  const bestStreakFormatted = () => {
    const d = Math.floor(bestStreakHours / 24);
    const h = bestStreakHours % 24;
    if (d > 0) {
      return h > 0 ? `${d}d ${h}h` : `${d} ${d === 1 ? 'day' : 'days'}`;
    }
    return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  };

  const totalAllTimeHours =
    currentTotalHours + streakHistory.reduce((sum, s) => sum + getStreakHours(s), 0);

  const totalAllTimeFormatted = () => {
    const d = Math.floor(totalAllTimeHours / 24);
    const h = totalAllTimeHours % 24;
    if (d > 0) {
      return h > 0 ? `${d} days, ${h} hours` : `${d} days`;
    }
    return `${h} hours`;
  };

  const handleAddTwelveHours = async () => {
    const currentStart = new Date(startDate).getTime();
    const newStart = new Date(currentStart - 12 * 60 * 60 * 1000).toISOString();
    
    if (userAddiction) {
      const newSoberTime = calculateSoberTime(newStart);
      const updated: UserAddiction = {
        ...userAddiction,
        startDate: newStart,
        daysSober: newSoberTime.days,
        hoursSober: newSoberTime.hours,
      };
      setUserAddiction(updated);
      await storageService.updateAddiction(addictionId, { startDate: newStart });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{addictionIcon}</Text>
        <Text style={styles.title}>{addictionName} Statistics</Text>
        <Text style={styles.subtitle}>Your recovery progress and achievements</Text>
      </View>

      <View style={styles.content}>
        {/* Main Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>CURRENT STREAK</Text>
          <View style={styles.heroTimeContainer}>
            {soberTime.days > 0 && (
              <View style={styles.heroTimeSegment}>
                <Text style={styles.heroNumber}>{soberTime.days}</Text>
                <Text style={styles.heroUnit}>{soberTime.days === 1 ? 'Day' : 'Days'}</Text>
              </View>
            )}
            <View style={styles.heroTimeSegment}>
              <Text style={styles.heroNumber}>{soberTime.hours}</Text>
              <Text style={styles.heroUnit}>{soberTime.hours === 1 ? 'Hour' : 'Hours'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addTimeButton}
            activeOpacity={0.7}
            onPress={handleAddTwelveHours}
          >
            <Text style={styles.addTimeButtonText}>+ 12h</Text>
          </TouchableOpacity>

          {streakHistory.length > 0 && (
            <View style={styles.bestStreakBadge}>
              <Text style={styles.bestStreakText}>🏆 Best: {bestStreakFormatted()}</Text>
            </View>
          )}
        </View>

        {/* Savings Grid */}
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, styles.moneyIconBg]}>
              <Text style={styles.cardIcon}>💰</Text>
            </View>
            <Text style={styles.cardValue}>{savings.moneySaved}</Text>
            <Text style={styles.cardLabel}>Money Saved</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconCircle, styles.timeIconBg]}>
              <Text style={styles.cardIcon}>⏳</Text>
            </View>
            <Text style={styles.cardValue}>{savings.timeSaved}</Text>
            <Text style={styles.cardLabel}>Time Reclaimed</Text>
          </View>
        </View>

        {/* Past Streaks History */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📜 Past Streaks History</Text>
            <Text style={styles.sectionCount}>
              {streakHistory.length} {streakHistory.length === 1 ? 'reset' : 'resets'}
            </Text>
          </View>

          {streakHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryIcon}>🌟</Text>
              <Text style={styles.emptyHistoryTitle}>First Continuous Streak</Text>
              <Text style={styles.emptyHistoryText}>
                You have not logged any resets yet. Keep pushing forward!
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {[...streakHistory].reverse().map((streak, idx) => {
                const sDate = new Date(streak.startDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
                const eDate = new Date(streak.endDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                const streakSoberTime = calculateSoberTime(streak.startDate, streak.endDate);
                const isBest = getStreakHours(streak) === bestStreakHours && bestStreakHours > 0;

                return (
                  <View key={idx} style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <View style={[styles.historyBadge, isBest && styles.bestHistoryBadge]}>
                        <Text style={[styles.historyBadgeText, isBest && styles.bestHistoryBadgeText]}>
                          {streakSoberTime.formattedShort}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.historyDates}>
                          {sDate} – {eDate}
                        </Text>
                        <Text style={styles.historyIndex}>
                          Streak #{streakHistory.length - idx} • {streakSoberTime.formattedLong}
                        </Text>
                      </View>
                    </View>
                    {isBest && (
                      <View style={styles.trophyBadge}>
                        <Text style={styles.trophyText}>🏆 Best</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Overview Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🌟 Overall Milestone Summary</Text>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Total Clean Time (All-Time):</Text>
            <Text style={styles.overviewValue}>{totalAllTimeFormatted()}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Current Streak Started:</Text>
            <Text style={styles.overviewValue}>
              {new Date(startDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
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
    backgroundColor: '#6366f1',
    padding: 20,
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
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  heroTimeSegment: {
    alignItems: 'center',
  },
  heroNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6366f1',
  },
  heroUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },
  addTimeButton: {
    marginTop: 14,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  addTimeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  bestStreakBadge: {
    marginTop: 12,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  bestStreakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  moneyIconBg: {
    backgroundColor: '#ecfdf5',
  },
  timeIconBg: {
    backgroundColor: '#eef2ff',
  },
  cardIcon: {
    fontSize: 20,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyHistoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bestHistoryBadge: {
    backgroundColor: '#fef3c7',
  },
  historyBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338ca',
  },
  bestHistoryBadgeText: {
    color: '#92400e',
  },
  historyDates: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  historyIndex: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  trophyBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trophyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  overviewLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  overviewValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
});

