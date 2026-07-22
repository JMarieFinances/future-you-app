export type BudgetItem = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  dueDay?: number;
  notes?: string;

  assignedMemberId?: string;
  splitType?: HouseholdSplitType;
  memberSplits?: HouseholdMemberSplit[];
};

export type PurchaseType = "income" | "expense";

export type BudgetType =
  | "personal"
  | "household"
  | "business";

export type Purchase = {
  id: string;
  name: string;
  merchant?: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  notes?: string;
  type: PurchaseType;
  budgetType: BudgetType;
  budgetId?: string;

  paidByMemberId?: string;
  createdByUserId?: string;
  createdByDisplayName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type HouseholdRole =
  | "owner"
  | "editor"
  | "viewer";

export type HouseholdMemberStatus =
  | "pending"
  | "active"
  | "left"
  | "removed";

export type HouseholdSplitType =
  | "equal"
  | "single"
  | "percentage"
  | "custom";

export type HouseholdActivityType =
  | "household_created"
  | "household_updated"
  | "household_deleted"
  | "transaction_created"
  | "transaction_updated"
  | "transaction_deleted"
  | "contribution_created"
  | "contribution_updated"
  | "contribution_deleted"
  | "budget_created"
  | "budget_updated"
  | "budget_deleted"
  | "member_invited"
  | "member_joined"
  | "member_updated"
  | "member_removed"
  | "member_left"
  | "ownership_transferred";

export type HouseholdMemberSplit = {
  memberId: string;
  amount?: number;
  percentage?: number;
};

export type HouseholdMember = {
  id: string;
  workspaceId?: string;
  userId?: string;
  email?: string;

  accountName?: string;
  displayName?: string;

  role: HouseholdRole;
  status: HouseholdMemberStatus;

  plannedContribution: number;
  contributedAmount: number;
  savingsContribution: number;

  joinedAt?: string;
  invitedAt?: string;
  updatedAt?: string;

  hasCompletedSetup?: boolean;
};

export type HouseholdContribution = {
  id: string;
  householdId: string;
  memberId: string;

  amount: number;
  contributionType: "household" | "savings";
  date: string;
  notes?: string;

  createdByUserId?: string;
  createdByDisplayName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type HouseholdActivity = {
  id: string;
  householdId: string;
  workspaceId?: string;

  userId?: string;
  memberId?: string;
  displayName: string;

  type: HouseholdActivityType;
  message: string;

  transactionId?: string;
  contributionId?: string;
  budgetItemId?: string;
  affectedMemberId?: string;

  amount?: number;
  previousAmount?: number;
  merchant?: string;
  category?: string;

  createdAt: string;
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
  workspaceId?: string;

  name: string;
  description: string;

  members: number;
  memberList?: HouseholdMember[];

  budget: HouseholdBudget;
  contributions?: HouseholdContribution[];
  activity?: HouseholdActivity[];

  includedInPersonalPlan: boolean;
  personalContribution?: number;

  createdByUserId?: string;
  createdAt?: string;
  updatedAt?: string;

  hasCompletedSetup?: boolean;
};

export type BusinessIncomeMode =
  | "main"
  | "combined"
  | "separate";

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
  incomeMode: BusinessIncomeMode;
  ownerPay: number;
  budget: BusinessBudget;
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

export type CalendarEventRepeat =
  | "never"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export type CalendarEventType =
  | "payday"
  | "bill"
  | "goal"
  | "business"
  | "household"
  | "review"
  | "custom";

export type CalendarEventSourceType =
  | "personal"
  | "household"
  | "business"
  | "goal"
  | "system";

export type CalendarEvent = {
  id: string;
  title: string;
  amount?: number;

  day: number;
  month?: number;
  year?: number;

  repeat?: CalendarEventRepeat;
  type: CalendarEventType;

  notes?: string;

  sourceId?: string;
  sourceType?: CalendarEventSourceType;

  completed?: boolean;
  createdAt?: string;
};

export type PaySchedule =
  | "weekly"
  | "biweekly"
  | "twice-monthly"
  | "monthly"
  | "variable";

export type BudgetStyle =
  | "zero-based"
  | "50-30-20"
  | "custom";

export type PaydayConfig = {
  nextDate?: string;
  firstDay?: number;
  secondDay?: number;
  weekday?: number;
  monthlyDay?: number;
};

export type AppSettings = {
  theme: ThemeType;
  notifications: NotificationSettings;

  onboarded?: boolean;
  userName?: string;

  paySchedule?: PaySchedule;
  budgetStyle?: BudgetStyle;
  primaryGoal?: string;

  paydayConfig?: PaydayConfig;
};

export type AppData = {
  personalPlan: PlanData;
  purchases: Purchase[];
  households: Household[];
  businesses: Business[];
  calendarEvents?: CalendarEvent[];
  settings: AppSettings;
};