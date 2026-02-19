export interface Addiction {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface UserAddiction {
  addictionId: string;
  addiction: Addiction;
  startDate: Date;
  reminderTime: string; // HH:MM format
  enabled: boolean;
  daysSober: number;
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
