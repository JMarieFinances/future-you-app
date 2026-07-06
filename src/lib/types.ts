export type BudgetItem = {
  id: string;
  name: string;
  budget: number;
  spent: number;
};

export type Purchase = {
  id: string;
  name: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  notes?: string;
  type: "income" | "expense";
  budgetType: "personal" | "household" | "business";
  budgetId?: string;
};

export type HouseholdBudget = {
  householdIncome: number;
  incomeSources: BudgetItem[];
  bills: BudgetItem[];
  spending: BudgetItem[];
  savings: BudgetItem[];
};

export type Household = {
  id: string;
  name: string;
  description: string;
  members: number;
  budget: HouseholdBudget;
  includedInPersonalPlan: boolean;
};

export type BusinessBudget = {
  businessIncome: number;
  revenueSources: BudgetItem[];
  operatingExpenses: BudgetItem[];
  businessSpending: BudgetItem[];
  businessSavings: BudgetItem[];
};

export type Business = {
  id: string;
  name: string;
  description: string;
  businessType: string;
  budget: BusinessBudget;
  incomeMode: "main" | "combined" | "separate";
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

export type GoalMilestone = {
  id: string;
  name: string;
  amount: number;
};

export type GoalCollection = {
  id: string;
  name: string;
};

export type Goal = {
  id: string;
  emoji: string;
  name: string;
  target: number;
  current: number;
  monthly: number;
  collectionId?: string | null;
  milestones?: GoalMilestone[];
  notes?: string;
  archived?: boolean;
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

  subscriptions: number;
subscriptionDetails: Record<string, number>;
subscriptionDueDates?: Record<string, number>;
obligationDueDates?: Record<string, number>;

  goals: Goal[];
  goalCollections?: GoalCollection[];
};

export type AppData = {
  personalPlan: PlanData;
  purchases: Purchase[];
  households: Household[];
  businesses: Business[];

  calendarEvents?: {
    id: string;
    title: string;
    amount?: number;
    day: number;
    month?: number;
    year?: number;
    repeat?: "never" | "weekly" | "biweekly" | "monthly" | "yearly";
    type:
      | "payday"
      | "bill"
      | "goal"
      | "business"
      | "household"
      | "review"
      | "custom";
    notes?: string;
    sourceId?: string;
    sourceType?: "personal" | "household" | "business" | "goal" | "system";
  }[];

  settings: {
    theme: ThemeType;
    notifications: NotificationSettings;
    onboarded?: boolean;
    userName?: string;
    paySchedule?: "weekly" | "biweekly" | "twice-monthly" | "monthly" | "variable";
    budgetStyle?: "zero-based" | "50-30-20" | "custom";
    primaryGoal?: string;
    paydayConfig?: {
  nextDate?: string;
  firstDay?: number;
  secondDay?: number;
  weekday?: number;
  monthlyDay?: number;
};
  };
};