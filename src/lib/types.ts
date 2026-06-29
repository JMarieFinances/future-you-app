export type Goal = {
  id: string;
  emoji: string;
  name: string;
  target: number;
  current: number;
  monthly: number;
};

export type PlanData = {
  income: number;
  obligations: number;
  debt: number;
  lifestyle: number;
  safeToSpend: number;
  goalContributions: number;

  incomeDetails: Record<string, number>;
  obligationDetails: Record<string, number>;
  debtDetails: Record<string, number>;
  lifestyleDetails: Record<string, number>;

  goals: Goal[];
};

export type Household = {
  id: string;
  name: string;
  description: string;
  members: number;
};

export type Business = {
  id: string;
  name: string;
  description: string;
  businessType: string;
};

export type NotificationSettings = {
  goalReminders: boolean;
  billReminders: boolean;
  milestones: boolean;
  monthlyCheckIn: boolean;
  affordAlerts: boolean;
  budgetWarnings: boolean;
};

export type ThemeType =
  | "future-you"
  | "midnight"
  | "lavender"
  | "ocean"
  | "rose-gold"
  | "money-mode";

export type AppData = {
  personalPlan: PlanData;

  households: Household[];

  businesses: Business[];

  settings: {
    theme: ThemeType;
    notifications: NotificationSettings;
  };
};