import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import { useTheme } from "@/lib/useTheme";
import { Text } from "react-native";

export default function PurchaseImpact({
  before,
  after,
  billsCovered,
  subscriptionsCovered,
  goalDelayDays,
}: {
  before: number;
  after: number;
  billsCovered: boolean;
  subscriptionsCovered: boolean;
  goalDelayDays: number;
}) {
  const { colors } = useTheme();

  const statusColor = after < 0 ? colors.danger : colors.success;

  return (
    <AppCard>
      <AppText variant="section">Purchase Impact</AppText>

      <AppRow style={{ marginTop: 16 }}>
        <AppText variant="muted">Remaining This Month</AppText>
        <Text style={{ color: statusColor, fontSize: 28, fontWeight: "bold" }}>
          ${after.toFixed(2)}
        </Text>
      </AppRow>

      <AppRow style={{ marginTop: 12 }}>
        <AppText variant="muted">Before Purchase</AppText>
        <AppText variant="bold">${before.toFixed(2)}</AppText>
      </AppRow>

      <ImpactRow label="Bills" good={billsCovered} />
      <ImpactRow label="Subscriptions" good={subscriptionsCovered} />

      <AppRow style={{ marginTop: 12 }}>
        <AppText variant="muted">Goals</AppText>
        <Text
          style={{
            color: goalDelayDays > 7 ? colors.warning : colors.success,
            fontWeight: "bold",
          }}
        >
          {goalDelayDays > 0
            ? `Delayed ${goalDelayDays} day${goalDelayDays === 1 ? "" : "s"}`
            : "No Impact"}
        </Text>
      </AppRow>
    </AppCard>
  );
}

function ImpactRow({ label, good }: { label: string; good: boolean }) {
  const { colors } = useTheme();

  return (
    <AppRow style={{ marginTop: 12 }}>
      <AppText variant="muted">{label}</AppText>
      <Text
        style={{
          color: good ? colors.success : colors.danger,
          fontWeight: "bold",
        }}
      >
        {good ? "Covered" : "Not Covered"}
      </Text>
    </AppRow>
  );
}