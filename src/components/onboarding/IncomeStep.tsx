import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import { Pressable, View } from "react-native";
import OnboardingHeader from "./OnboardingHeader";

const schedules = [
  { label: "Weekly", value: "weekly" },
  { label: "Biweekly", value: "biweekly" },
  { label: "Twice Monthly", value: "twice-monthly" },
  { label: "Monthly", value: "monthly" },
  { label: "Variable", value: "variable" },
];

const weekdays = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

export default function IncomeStep({
  income,
  setIncome,
  paycheckAmount,
  setPaycheckAmount,
  paySchedule,
  setPaySchedule,
  payday,
  setPayday,
  secondPayday,
  setSecondPayday,
  weekday,
  setWeekday,
  nextPayDate,
  setNextPayDate,
  onBack,
  onNext,
}: {
  income: string;
  setIncome: (value: string) => void;
  paycheckAmount: string;
  setPaycheckAmount: (value: string) => void;
  paySchedule: string;
  setPaySchedule: (value: string) => void;
  payday: string;
  setPayday: (value: string) => void;
  secondPayday: string;
  setSecondPayday: (value: string) => void;
  weekday: string;
  setWeekday: (value: string) => void;
  nextPayDate: string;
  setNextPayDate: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <OnboardingHeader
        title="Let's talk income."
        subtitle="Future You uses your monthly income for the budget and your paycheck amount for the calendar."
        step={3}
        total={12}
      />

      <AppCard>
        <View style={{ gap: 12 }}>
          <AppInput
            placeholder="Monthly take-home income"
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
          />

          <AppInput
            placeholder="How much is each paycheck?"
            value={paycheckAmount}
            onChangeText={setPaycheckAmount}
            keyboardType="numeric"
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">How often do you get paid?</AppText>

        <View style={{ marginTop: 12, gap: 8 }}>
          {schedules.map((item) => (
            <Choice
              key={item.value}
              label={item.label}
              active={paySchedule === item.value}
              onPress={() => setPaySchedule(item.value)}
            />
          ))}
        </View>
      </AppCard>

      {paySchedule === "weekly" ? (
        <AppCard>
          <AppText variant="section">Which weekday?</AppText>
          <View style={{ marginTop: 12, gap: 8 }}>
            {weekdays.map((item) => (
              <Choice
                key={item.value}
                label={item.label}
                active={weekday === item.value}
                onPress={() => setWeekday(item.value)}
              />
            ))}
          </View>
        </AppCard>
      ) : null}

      {paySchedule === "biweekly" ? (
        <AppCard>
          <AppText variant="section">Next paycheck date</AppText>
          <AppText variant="muted">
            Use YYYY-MM-DD. Future You will repeat this every 14 days.
          </AppText>

          <View style={{ marginTop: 12 }}>
            <AppInput
              placeholder="2026-07-15"
              value={nextPayDate}
              onChangeText={setNextPayDate}
            />
          </View>
        </AppCard>
      ) : null}

      {paySchedule === "twice-monthly" ? (
        <AppCard>
          <AppText variant="section">Paydays each month</AppText>
          <AppText variant="muted">Example: 1 and 15.</AppText>

          <View style={{ marginTop: 12, gap: 12 }}>
            <AppInput
              placeholder="First payday"
              value={payday}
              onChangeText={setPayday}
              keyboardType="numeric"
            />

            <AppInput
              placeholder="Second payday"
              value={secondPayday}
              onChangeText={setSecondPayday}
              keyboardType="numeric"
            />
          </View>
        </AppCard>
      ) : null}

      {paySchedule === "monthly" ? (
        <AppCard>
          <AppText variant="section">Payday each month</AppText>

          <View style={{ marginTop: 12 }}>
            <AppInput
              placeholder="Day of month"
              value={payday}
              onChangeText={setPayday}
              keyboardType="numeric"
            />
          </View>
        </AppCard>
      ) : null}

      {paySchedule === "variable" ? (
        <AppCard>
          <AppText variant="section">Variable income</AppText>
          <AppText variant="muted">
            Your monthly income will still power your budget. You can add
            individual paydays from the Calendar later.
          </AppText>
        </AppCard>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="Back" onPress={onBack} variant="outline" />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton title="Continue" onPress={onNext} />
        </View>
      </View>
    </>
  );
}

function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <AppCard>
        <AppText variant={active ? "bold" : "muted"}>
          {active ? "✓ " : ""}
          {label}
        </AppText>
      </AppCard>
    </Pressable>
  );
}