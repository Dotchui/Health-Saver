import { currencyService } from '../services/currencyService';

export interface Addiction {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface StreakHistoryEntry {
  startDate: string;
  endDate: string;
  days: number;
  hours?: number;
  totalHours?: number;
}

export interface UserAddiction {
  addictionId: string;
  addiction: Addiction;
  startDate: Date | string;
  reminderTime: string; // HH:MM format
  enabled: boolean;
  daysSober: number;
  hoursSober?: number;
  streakHistory?: StreakHistoryEntry[];
  customDailyHours?: number;
  customDailyMoney?: number;
}

export interface SoberTime {
  days: number;
  hours: number;
  totalHours: number;
  formattedShort: string;
  formattedLong: string;
}

export function calculateSoberTime(
  startDate: Date | string,
  endDate: Date | string = new Date()
): SoberTime {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const totalHours = Math.max(0, Math.floor((endMs - startMs) / (1000 * 60 * 60)));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  let formattedShort = '';
  let formattedLong = '';

  if (days > 0) {
    formattedShort = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    const dayLabel = days === 1 ? '1 Day' : `${days} Days`;
    const hourLabel = hours === 1 ? '1 Hour' : `${hours} Hours`;
    formattedLong = hours > 0 ? `${dayLabel}, ${hourLabel}` : dayLabel;
  } else {
    formattedShort = `${hours}h`;
    formattedLong = hours === 1 ? '1 Hour' : `${hours} Hours`;
  }

  return {
    days,
    hours,
    totalHours,
    formattedShort,
    formattedLong,
  };
}

export interface ReminderSettings {
  time: string; // HH:MM format
  enabled: boolean;
  message?: string;
}

export const COMMON_ADDICTIONS: Addiction[] = [
  {
    id: 'smoking',
    name: 'Smoking',
    icon: '🚭',
    description: 'Cigarettes and tobacco products',
  },
  {
    id: 'vaping',
    name: 'Vaping',
    icon: '💨',
    description: 'E-cigarettes and vaping devices',
  },
  {
    id: 'alcohol',
    name: 'Alcohol',
    icon: '🍺',
    description: 'Alcoholic beverages',
  },
  {
    id: 'drugs',
    name: 'Drugs',
    icon: '💊',
    description: 'Recreational drugs',
  },
  {
    id: 'gambling',
    name: 'Gambling',
    icon: '🎰',
    description: 'Betting and gambling',
  },
  {
    id: 'social-media',
    name: 'Social Media',
    icon: '📱',
    description: 'Excessive social media use',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    description: 'Video game addiction',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    description: 'Compulsive shopping',
  },
  {
    id: 'sugar',
    name: 'Sugar',
    icon: '🍭',
    description: 'Excessive sugar consumption',
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    icon: '☕',
    description: 'Coffee and energy drinks',
  },
  {
    id: 'pornography',
    name: 'Pornography',
    icon: '🔞',
    description: 'Adult content',
  },
  {
    id: 'procrastination',
    name: 'Procrastination',
    icon: '⏰',
    description: 'Chronic avoidance and delays',
  },
];

export interface AddictionSavingsEstimate {
  dailyMoney: number; // in USD
  dailyHours: number; // in hours
}

export const ADDICTION_SAVINGS_MAP: Record<string, AddictionSavingsEstimate> = {
  smoking: { dailyMoney: 12, dailyHours: 2 },
  vaping: { dailyMoney: 6, dailyHours: 1 },
  alcohol: { dailyMoney: 15, dailyHours: 1 },
  drugs: { dailyMoney: 25, dailyHours: 3 },
  gambling: { dailyMoney: 30, dailyHours: 3 },
  'social-media': { dailyMoney: 2, dailyHours: 3 },
  gaming: { dailyMoney: 4, dailyHours: 4 },
  shopping: { dailyMoney: 20, dailyHours: 1.5 },
  sugar: { dailyMoney: 5, dailyHours: 0.5 },
  caffeine: { dailyMoney: 6, dailyHours: 0.5 },
  pornography: { dailyMoney: 2, dailyHours: 1 },
  procrastination: { dailyMoney: 5, dailyHours: 2 },
};

export const DEFAULT_SAVINGS: AddictionSavingsEstimate = {
  dailyMoney: 10,
  dailyHours: 2,
};

export function getAddictionSavings(
  addictionId: string,
  startDate: Date | string,
  daysSober: number,
  streakHistory?: StreakHistoryEntry[],
  customDailyHours?: number,
  customDailyMoney?: number
) {
  const defaultEstimate = ADDICTION_SAVINGS_MAP[addictionId] || DEFAULT_SAVINGS;
  const dailyMoney = typeof customDailyMoney === 'number' ? customDailyMoney : defaultEstimate.dailyMoney;
  const dailyHours = typeof customDailyHours === 'number' ? customDailyHours : defaultEstimate.dailyHours;

  const startMs = new Date(startDate).getTime();
  const nowMs = Date.now();
  const currentDiffHours = Math.max(0, (nowMs - startMs) / (1000 * 60 * 60));
  const currentDiffDays = currentDiffHours / 24;

  const pastTotalHours = streakHistory?.reduce((acc, item) => {
    if (typeof item.totalHours === 'number') return acc + item.totalHours;
    if (item.startDate && item.endDate) {
      const ms = new Date(item.endDate).getTime() - new Date(item.startDate).getTime();
      return acc + Math.max(0, ms / (1000 * 60 * 60));
    }
    return acc + ((item.days || 0) * 24 + (item.hours || 0));
  }, 0) || 0;

  const pastDays = pastTotalHours / 24;
  const totalDays = currentDiffDays + pastDays;

  const money = totalDays * dailyMoney;
  const totalHoursSaved = totalDays * dailyHours;

  let timeString = `${Math.round(totalHoursSaved)}h`;
  if (totalHoursSaved >= 48) {
    const days = Math.floor(totalHoursSaved / 24);
    const remHours = Math.round(totalHoursSaved % 24);
    timeString = remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }

  return {
    moneySaved: currencyService.formatMoney(money),
    timeSaved: timeString,
  };
}
