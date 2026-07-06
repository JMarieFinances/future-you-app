import BusinessStep from "@/components/onboarding/BusinessStep";
import DebtStep from "@/components/onboarding/DebtStep";
import FinishStep from "@/components/onboarding/FinishStep";
import FixedExpensesStep, { OnboardingLineItem } from "@/components/onboarding/FixedExpensesStep";
import GoalsStep, { OnboardingGoal } from "@/components/onboarding/GoalsStep";
import HouseholdStep from "@/components/onboarding/HouseholdStep";
import IncomeStep from "@/components/onboarding/IncomeStep";
import LifestyleStep from "@/components/onboarding/LifestyleStep";
import NameStep from "@/components/onboarding/NameStep";
import SubscriptionsStep from "@/components/onboarding/SubscriptionsStep";
import ThemeStep from "@/components/onboarding/ThemeStep";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import AppPage from "@/components/ui/AppPage";
import { updateAppData } from "@/lib/appStore";
import { CalendarEvent } from "@/lib/calendarStore";
import { ThemeType } from "@/lib/settingsStore";
import { Business, Goal, Household } from "@/lib/types";
import { router } from "expo-router";
import { useState } from "react";

type IncomeMode = "main" | "combined" | "separate";

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [paycheckAmount, setPaycheckAmount] = useState("");
  const [paySchedule, setPaySchedule] = useState("biweekly");
  const [payday, setPayday] = useState("1");
  const [secondPayday, setSecondPayday] = useState("15");
const [weekday, setWeekday] = useState("5");
const [nextPayDate, setNextPayDate] = useState("");

  const [fixedExpenses, setFixedExpenses] = useState<OnboardingLineItem[]>([
    { id: "rent", name: "Rent / Mortgage", amount: "", dueDay: "" },
    { id: "electric", name: "Electricity", amount: "", dueDay: "" },
    { id: "water", name: "Water", amount: "", dueDay: "" },
    { id: "gas", name: "Gas", amount: "", dueDay: "" },
    { id: "internet", name: "Internet", amount: "", dueDay: "" },
    { id: "phone", name: "Phone", amount: "", dueDay: "" },
    { id: "insurance", name: "Insurance", amount: "", dueDay: "" },
  ]);

  const [subscriptions, setSubscriptions] = useState<OnboardingLineItem[]>([
    { id: "netflix", name: "Netflix", amount: "", dueDay: "" },
    { id: "spotify", name: "Spotify", amount: "", dueDay: "" },
    { id: "hulu", name: "Hulu", amount: "", dueDay: "" },
    { id: "disney", name: "Disney+", amount: "", dueDay: "" },
    { id: "prime", name: "Amazon Prime", amount: "", dueDay: "" },
    { id: "chatgpt", name: "ChatGPT", amount: "", dueDay: "" },
    { id: "gym", name: "Gym Membership", amount: "", dueDay: "" },
  ]);

  const [debts, setDebts] = useState<OnboardingLineItem[]>([
    { id: "credit-card", name: "Credit Card", amount: "" },
    { id: "student-loan", name: "Student Loan", amount: "" },
    { id: "car-loan", name: "Car Loan", amount: "" },
    { id: "medical", name: "Medical Debt", amount: "" },
    { id: "personal-loan", name: "Personal Loan", amount: "" },
  ]);

  const [lifestyle, setLifestyle] = useState<OnboardingLineItem[]>([
    { id: "groceries", name: "Groceries", amount: "" },
    { id: "dining", name: "Dining Out", amount: "" },
    { id: "gas-car", name: "Gas", amount: "" },
    { id: "shopping", name: "Shopping", amount: "" },
    { id: "entertainment", name: "Entertainment", amount: "" },
    { id: "travel", name: "Travel", amount: "" },
    { id: "personal-care", name: "Personal Care", amount: "" },
  ]);

  const [goal, setGoal] = useState<OnboardingGoal>({
    emoji: "🚨",
    name: "Emergency Fund",
    target: "1000",
    monthly: "100",
  });

  const [hasHousehold, setHasHousehold] = useState(false);
  const [householdName, setHouseholdName] = useState("My Household");
  const [householdContribution, setHouseholdContribution] = useState("");
  const [householdIncluded, setHouseholdIncluded] = useState(true);

  const [hasBusiness, setHasBusiness] = useState(false);
  const [businessName, setBusinessName] = useState("My Business");
  const [businessIncome, setBusinessIncome] = useState("");
  const [incomeMode, setIncomeMode] = useState<IncomeMode>("separate");

  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("future-you");

  const next = () => setStep((prev) => Math.min(prev + 1, 12));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const finish = async () => {
    const monthlyIncome = Number(income) || 0;

    const cleanFixed = cleanItems(fixedExpenses);
    const cleanSubs = cleanItems(subscriptions);
    const cleanDebts = cleanItems(debts);
    const cleanLifestyle = cleanItems(lifestyle);

    const obligationDetails = toDetails(cleanFixed);
    const subscriptionDetails = toDetails(cleanSubs);
    const debtDetails = toDetails(cleanDebts);
    const lifestyleDetails = toDetails(cleanLifestyle);

    const obligationDueDates = toDueDates(cleanFixed);
    const subscriptionDueDates = toDueDates(cleanSubs);

    const obligations = sumDetails(obligationDetails);
    const subscriptionsTotal = sumDetails(subscriptionDetails);
    const debt = sumDetails(debtDetails);
    const lifestyleTotal = sumDetails(lifestyleDetails);

    const starterGoal: Goal = {
      id: Date.now().toString(),
      emoji: goal.emoji || "✨",
      name: goal.name.trim() || "Future Goal",
      target: Number(goal.target) || 0,
      current: 0,
      monthly: Number(goal.monthly) || 0,
      notes: "Created during onboarding.",
      archived: false,
      milestones: [
        { id: "first-100", name: "First $100", amount: 100 },
        { id: "halfway", name: "Halfway", amount: (Number(goal.target) || 0) / 2 },
        { id: "complete", name: "Complete", amount: Number(goal.target) || 0 },
      ],
    };

    const household: Household | null = hasHousehold
      ? {
          id: Date.now().toString() + "-household",
          name: householdName.trim() || "My Household",
          description: "Created during onboarding.",
          members: 1,
          includedInPersonalPlan: householdIncluded,
          budget: {
            householdIncome: Number(householdContribution) || 0,
            incomeSources: [
              {
                id: "household-contribution",
                name: "Household Contribution",
                budget: Number(householdContribution) || 0,
                spent: 0,
              },
            ],
            bills: [],
            spending: [],
            savings: [],
          },
        }
      : null;

    const business: Business | null = hasBusiness
      ? {
          id: Date.now().toString() + "-business",
          name: businessName.trim() || "My Business",
          description: "Created during onboarding.",
          businessType: "Business / Side Hustle",
          incomeMode,
          budget: {
            businessIncome: Number(businessIncome) || 0,
            revenueSources: [
              {
                id: "business-income",
                name: "Business Income",
                budget: Number(businessIncome) || 0,
                spent: 0,
              },
            ],
            operatingExpenses: [],
            businessSpending: [],
            businessSavings: [],
          },
        }
      : null;

    const calendarEvents: CalendarEvent[] = [
      {
        ...buildPaydayEvents({
   paycheckAmount: Number(paycheckAmount) || monthlyIncome,
  paySchedule,
  payday,
  secondPayday,
  weekday,
  nextPayDate,
}),
        id: "payday",
        title: "Payday",
        amount: monthlyIncome,
        day: clampDay(payday),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        type: "payday",
        repeat:
          paySchedule === "weekly"
            ? "weekly"
            : paySchedule === "biweekly"
            ? "biweekly"
            : "monthly",
        notes: "Created during onboarding.",
        sourceType: "personal",
      },
      {
        id: "monthly-review",
        title: "Monthly Review",
        day: 30,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        type: "review",
        repeat: "monthly",
        notes: "Review your month with Future You.",
        sourceType: "system",
      },
      ...cleanFixed.map((item) => ({
        id: `fixed-${item.id}`,
        title: item.name.trim(),
        amount: Number(item.amount) || 0,
        day: clampDay(item.dueDay || "1"),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        type: "bill" as const,
        repeat: "monthly" as const,
        notes: "Fixed expense created during onboarding.",
        sourceType: "personal" as const,
      })),
      ...cleanSubs.map((item) => ({
        id: `subscription-${item.id}`,
        title: item.name.trim(),
        amount: Number(item.amount) || 0,
        day: clampDay(item.dueDay || "1"),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        type: "subscription" as any,
        repeat: "monthly" as const,
        notes: "Subscription created during onboarding.",
        sourceType: "personal" as const,
      })),
    ];

    if (starterGoal.monthly > 0) {
      calendarEvents.push({
        id: `goal-${starterGoal.id}`,
        title: starterGoal.name,
        amount: starterGoal.monthly,
        day: 5,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        type: "goal",
        repeat: "monthly",
        notes: "Monthly goal contribution.",
        sourceId: starterGoal.id,
        sourceType: "goal",
      });
    }

    if (household && household.budget.householdIncome > 0) {
      calendarEvents.push({
        id: `household-${household.id}`,
        title: `${household.name} Contribution`,
        amount: household.budget.householdIncome,
        day: 3,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        type: "household",
        repeat: "monthly",
        notes: "Household contribution.",
        sourceId: household.id,
        sourceType: "household",
      });
    }

    if (business && business.budget.businessIncome > 0) {
      calendarEvents.push({
        id: `business-${business.id}`,
        title: `${business.name} Income`,
        amount: business.budget.businessIncome,
        day: 15,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        type: "business",
        repeat: "monthly",
        notes: "Business income.",
        sourceId: business.id,
        sourceType: "business",
      });
    }

    await updateAppData((app) => {
      app.personalPlan = {
        ...app.personalPlan,
        income: monthlyIncome,
        obligations,
        subscriptions: subscriptionsTotal,
        debt,
        lifestyle: lifestyleTotal,
        goalContributions: starterGoal.monthly,
        safeToSpend: 0,

        incomeDetails: { "Monthly Income": monthlyIncome },
        obligationDetails,
        subscriptionDetails,
        debtDetails,
        lifestyleDetails,
        obligationDueDates,
        subscriptionDueDates,

        goals: [starterGoal],
        goalCollections: app.personalPlan.goalCollections ?? [],
      };

      app.households = household ? [household] : [];
      app.businesses = business ? [business] : [];
      app.calendarEvents = calendarEvents;

      app.settings = {
        ...app.settings,
        onboarded: true,
        userName: name.trim(),
        theme: selectedTheme,
        paySchedule: paySchedule as any,
        budgetStyle: "custom",
        primaryGoal: starterGoal.name,
      };
    });

    router.replace("/(tabs)/today");
  };

  return (
    <AppPage>
      {step === 1 ? <WelcomeStep onNext={next} /> : null}

      {step === 2 ? (
        <NameStep name={name} setName={setName} onBack={back} onNext={next} />
      ) : null}

      {step === 3 ? (
       <IncomeStep
  income={income}
  setIncome={setIncome}
  paycheckAmount={paycheckAmount}
  setPaycheckAmount={setPaycheckAmount}
  paySchedule={paySchedule}
  setPaySchedule={setPaySchedule}
  payday={payday}
  setPayday={setPayday}
  secondPayday={secondPayday}
  setSecondPayday={setSecondPayday}
  weekday={weekday}
  setWeekday={setWeekday}
  nextPayDate={nextPayDate}
  setNextPayDate={setNextPayDate}
  onBack={back}
  onNext={next}
/>
      ) : null}

      {step === 4 ? (
        <FixedExpensesStep
          items={fixedExpenses}
          setItems={setFixedExpenses}
          onBack={back}
          onNext={next}
        />
      ) : null}

      {step === 5 ? (
        <SubscriptionsStep
          items={subscriptions}
          setItems={setSubscriptions}
          onBack={back}
          onNext={next}
        />
      ) : null}

      {step === 6 ? (
        <DebtStep
          items={debts}
          setItems={setDebts}
          onBack={back}
          onNext={next}
        />
      ) : null}

      {step === 7 ? (
        <LifestyleStep
          items={lifestyle}
          setItems={setLifestyle}
          onBack={back}
          onNext={next}
        />
      ) : null}

      {step === 8 ? (
        <GoalsStep goal={goal} setGoal={setGoal} onBack={back} onNext={next} />
      ) : null}

      {step === 9 ? (
        <HouseholdStep
          hasHousehold={hasHousehold}
          setHasHousehold={setHasHousehold}
          householdName={householdName}
          setHouseholdName={setHouseholdName}
          householdContribution={householdContribution}
          setHouseholdContribution={setHouseholdContribution}
          householdIncluded={householdIncluded}
          setHouseholdIncluded={setHouseholdIncluded}
          onBack={back}
          onNext={next}
        />
      ) : null}

      {step === 10 ? (
        <BusinessStep
          hasBusiness={hasBusiness}
          setHasBusiness={setHasBusiness}
          businessName={businessName}
          setBusinessName={setBusinessName}
          businessIncome={businessIncome}
          setBusinessIncome={setBusinessIncome}
          incomeMode={incomeMode}
          setIncomeMode={setIncomeMode}
          onBack={back}
          onNext={next}
        />
      ) : null}

      {step === 11 ? (
        <ThemeStep
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
          onBack={back}
          onNext={next}
        />
      ) : null}

      {step === 12 ? (
        <FinishStep
          billCount={
            cleanItems(fixedExpenses).length + cleanItems(subscriptions).length
          }
          hasHousehold={hasHousehold}
          hasBusiness={hasBusiness}
          onBack={back}
          onFinish={finish}
        />
      ) : null}
    </AppPage>
  );
}

function cleanItems(items: OnboardingLineItem[]) {
  return items.filter((item) => item.name.trim() && Number(item.amount) > 0);
}

function toDetails(items: OnboardingLineItem[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.name.trim()] = Number(item.amount) || 0;
    return acc;
  }, {});
}

function toDueDates(items: OnboardingLineItem[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    if (item.dueDay) {
      acc[item.name.trim()] = clampDay(item.dueDay);
    }
    return acc;
  }, {});
}

function buildPaydayEvents({
  paycheckAmount,
  paySchedule,
  payday,
  secondPayday,
  weekday,
  nextPayDate,
}: {
  paycheckAmount: number;
  paySchedule: string;
  payday: string;
  secondPayday: string;
  weekday: string;
  nextPayDate: string;
}): CalendarEvent[] {

  const now = new Date();

  if (paySchedule === "twice-monthly") {
    return [
      makePayday("payday-first", paycheckAmount / 2, payday, "First monthly payday."),
      makePayday("payday-second", paycheckAmount / 2, secondPayday, "Second monthly payday."),
    ];
  }

  if (paySchedule === "monthly") {
    return [makePayday("payday-monthly", paycheckAmount, payday, "Monthly payday.")];
  }

  if (paySchedule === "weekly") {
    const date = getNextWeekdayDate(Number(weekday) || 5);
    return [makeDatePayday("payday-weekly", paycheckAmount / 4, date, "Weekly payday.")];
  }

  if (paySchedule === "biweekly") {
    const date = parseDateOrToday(nextPayDate);
    return [makeDatePayday("payday-biweekly", paycheckAmount / 2, date, "Biweekly payday.")];
  }

  return [];

  function makePayday(id: string, amount: number, dayValue: string, notes: string): CalendarEvent {
    return {
      id,
      title: "Payday",
      amount,
      day: clampDay(dayValue),
      month: now.getMonth(),
      year: now.getFullYear(),
      type: "payday",
      repeat: "monthly",
      notes,
      sourceType: "personal",
    };
  }
}

function makeDatePayday(
  id: string,
  amount: number,
  date: Date,
  notes: string
): CalendarEvent {
  return {
    id,
    title: "Payday",
    amount,
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
    type: "payday",
    repeat: "biweekly",
    notes,
    sourceType: "personal",
  };
}

function getNextWeekdayDate(targetWeekday: number) {
  const today = new Date();
  const current = today.getDay();
  const distance = (targetWeekday - current + 7) % 7 || 7;

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + distance
  );
}

function parseDateOrToday(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function sumDetails(details: Record<string, number>) {
  return Object.values(details).reduce((sum, value) => sum + value, 0);
}

function clampDay(value: string) {
  return Math.min(Math.max(Number(value) || 1, 1), 31);
}