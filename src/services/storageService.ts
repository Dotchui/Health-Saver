import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAddiction, StreakHistoryEntry, calculateSoberTime } from '../types';

const STORAGE_KEY = '@healthsaver_addictions';

export const storageService = {
  async saveAddictions(addictions: UserAddiction[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(addictions);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving addictions:', error);
      throw error;
    }
  },

  async getAddictions(): Promise<UserAddiction[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading addictions:', error);
      return [];
    }
  },

  async addAddiction(addiction: UserAddiction): Promise<void> {
    try {
      const addictions = await this.getAddictions();
      addictions.push(addiction);
      await this.saveAddictions(addictions);
    } catch (error) {
      console.error('Error adding addiction:', error);
      throw error;
    }
  },

  async removeAddiction(addictionId: string): Promise<void> {
    try {
      const addictions = await this.getAddictions();
      const filtered = addictions.filter((a) => a.addictionId !== addictionId);
      await this.saveAddictions(filtered);
    } catch (error) {
      console.error('Error removing addiction:', error);
      throw error;
    }
  },

  async updateAddiction(addictionId: string, updates: Partial<UserAddiction>): Promise<void> {
    try {
      const addictions = await this.getAddictions();
      const index = addictions.findIndex((a) => a.addictionId === addictionId);
      if (index !== -1) {
        addictions[index] = { ...addictions[index], ...updates };
        await this.saveAddictions(addictions);
      }
    } catch (error) {
      console.error('Error updating addiction:', error);
      throw error;
    }
  },

  async resetStreak(addictionId: string): Promise<UserAddiction | null> {
    try {
      const addictions = await this.getAddictions();
      const index = addictions.findIndex((a) => a.addictionId === addictionId);
      if (index !== -1) {
        const item = addictions[index];
        const startDate = new Date(item.startDate);
        const endDate = new Date();
        const soberTime = calculateSoberTime(startDate, endDate);

        const historyEntry: StreakHistoryEntry = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days: soberTime.days,
          hours: soberTime.hours,
          totalHours: soberTime.totalHours,
        };

        const updatedHistory = [...(item.streakHistory || []), historyEntry];

        const updatedAddiction: UserAddiction = {
          ...item,
          startDate: endDate.toISOString(),
          daysSober: 0,
          hoursSober: 0,
          streakHistory: updatedHistory,
        };

        addictions[index] = updatedAddiction;
        await this.saveAddictions(addictions);
        return updatedAddiction;
      }
      return null;
    } catch (error) {
      console.error('Error resetting streak:', error);
      throw error;
    }
  },
};
