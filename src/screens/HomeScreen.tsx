import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserAddiction } from '../types';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

type RootStackParamList = {
  Home: undefined;
  AddictionSelection: undefined;
  ReminderSettings: { addictionId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [addictions, setAddictions] = useState<UserAddiction[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Calculate days sober
      const updated = data.map((addiction) => ({
        ...addiction,
        daysSober: Math.floor(
          (new Date().getTime() - new Date(addiction.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      }));
      setAddictions(updated);
    } catch (error) {
      console.error('Error loading addictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (addictionId: string) => {
    Alert.alert(
      'Remove Addiction',
      'Are you sure you want to remove this addiction tracking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await storageService.removeAddiction(addictionId);
            loadAddictions();
          },
        },
      ]
    );
  };

  const renderAddictionCard = ({ item }: { item: UserAddiction }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('ReminderSettings', { addictionId: item.addictionId })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.icon}>{item.addiction.icon}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.addictionName}>{item.addiction.name}</Text>
          <Text style={styles.reminderTime}>
            Reminder: {item.reminderTime} {item.enabled ? '✅' : '⏸️'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item.addictionId)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{item.daysSober}</Text>
          <Text style={styles.statLabel}>Days Sober</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>HealthSaver 🌟</Text>
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
    backgroundColor: '#6366f1',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 4,
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
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
  },
  statsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
    backgroundColor: '#6366f1',
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
