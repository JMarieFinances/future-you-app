import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import { useMemo, useState } from "react";
import { View } from "react-native";

type Props = {
  workspaceLabel: string;
  available: number;
  plannedAvailable?: number;
  monthlyIncome: number;
  monthlyAssigned: number;
  monthlySpent: number;
  onAddTransaction: () => void;
};

const formatMoney = (
  amount: number,
  cents = false
) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })}`;

const cleanAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts.slice(1).join("")}`;
};

export default function WorkspaceAfford({
  workspaceLabel,
  available,
  plannedAvailable,
  monthlyIncome,
  monthlyAssigned,
  monthlySpent,
  onAddTransaction,
}: Props) {
  const [purchaseName, setPurchaseName] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");

  const amount = Number(purchaseAmount) || 0;

  /*
   * A purchase must fit both:
   * 1. the cash currently remaining after logged spending, and
   * 2. the money that remains after the full monthly plan.
   *
   * We use the smaller number so planned bills/savings are protected.
   */
  const spendableAvailable =
    plannedAvailable === undefined
      ? available
      : Math.min(available, plannedAvailable);

  const afterPurchase = spendableAvailable - amount;

  const result = useMemo(() => {
    if (amount <= 0) {
      return {
        status: "waiting" as const,
        title: "Enter a purchase",
        message: `Add an amount to check it against the ${workspaceLabel.toLowerCase()} budget.`,
      };
    }

    if (spendableAvailable <= 0) {
      const shortage = Math.abs(spendableAvailable) + amount;

      return {
        status: "danger" as const,
        title: "This purchase does not fit",
        message: `The plan is already short ${formatMoney(
          shortage,
          true
        )} after including this purchase.`,
      };
    }

    if (amount > spendableAvailable) {
      return {
        status: "danger" as const,
        title: "This purchase does not fit",
        message: `You are short ${formatMoney(
          amount - spendableAvailable,
          true
        )}.`,
      };
    }

    const remainingPercent =
      monthlyIncome > 0
        ? (afterPurchase / monthlyIncome) * 100
        : 0;

    if (remainingPercent < 5) {
      return {
        status: "warning" as const,
        title: "You can afford it, but it is tight",
        message: `${formatMoney(
          afterPurchase,
          true
        )} would remain after protecting the monthly plan.`,
      };
    }

    return {
      status: "success" as const,
      title: "This purchase fits",
      message: `${formatMoney(
        afterPurchase,
        true
      )} would remain after protecting the monthly plan.`,
    };
  }, [
    afterPurchase,
    amount,
    monthlyIncome,
    spendableAvailable,
    workspaceLabel,
  ]);

  const tone =
    result.status === "danger"
      ? "danger"
      : result.status === "warning"
      ? "warning"
      : result.status === "success"
      ? "success"
      : "primary";

  const purchasePercent =
    spendableAvailable > 0
      ? Math.min(
          (amount / spendableAvailable) * 100,
          100
        )
      : amount > 0
      ? 100
      : 0;

  return (
    <>
      <AppCard>
        <AppText variant="section">
          Check a Purchase
        </AppText>

        <View style={{ marginTop: 6 }}>
          <AppText variant="muted">
            See how a purchase affects this{" "}
            {workspaceLabel.toLowerCase()} before
            committing to it.
          </AppText>
        </View>

        <View
          style={{
            marginTop: 16,
            gap: 12,
          }}
        >
          <AppInput
            placeholder="What are you buying?"
            value={purchaseName}
            onChangeText={setPurchaseName}
          />

          <AppInput
            placeholder="$0.00"
            value={purchaseAmount}
            onChangeText={(value) =>
              setPurchaseAmount(cleanAmount(value))
            }
            keyboardType="decimal-pad"
          />
        </View>
      </AppCard>

      <AppCard glass>
        <AppText variant="muted">
          {purchaseName.trim() || "Purchase"}
        </AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">
            {formatMoney(amount, true)}
          </AppText>
        </View>

        <View style={{ marginTop: 16 }}>
          <AppText variant="section">
            {result.title}
          </AppText>
        </View>

        <View style={{ marginTop: 6 }}>
          <AppText variant="muted">
            {result.message}
          </AppText>
        </View>

        {amount > 0 ? (
          <View
            style={{
              marginTop: 18,
              gap: 10,
            }}
          >
            <AppRow>
              <AppText variant="muted">
                Purchase uses
              </AppText>

              <AppText variant="bold">
                {purchasePercent.toFixed(0)}% of
                spendable funds
              </AppText>
            </AppRow>

            <View
              style={{
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                backgroundColor:
                  "rgba(255,255,255,0.08)",
              }}
            >
              <View
                style={{
                  width: `${purchasePercent}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor:
                    result.status === "danger"
                      ? "#ef4444"
                      : result.status === "warning"
                      ? "#f59e0b"
                      : "#22c55e",
                }}
              />
            </View>
          </View>
        ) : null}
      </AppCard>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spendable"
            value={formatMoney(spendableAvailable)}
            caption="After protecting plan"
            tone={
              spendableAvailable < 0
                ? "danger"
                : "success"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="After Purchase"
            value={formatMoney(afterPurchase)}
            caption="Estimated"
            tone={tone}
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">
          Budget Impact
        </AppText>

        <View
          style={{
            marginTop: 14,
            gap: 12,
          }}
        >
          <AppRow>
            <AppText variant="muted">
              Monthly income
            </AppText>

            <AppText variant="bold">
              {formatMoney(monthlyIncome, true)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Planned
            </AppText>

            <AppText variant="bold">
              {formatMoney(monthlyAssigned, true)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Already spent
            </AppText>

            <AppText variant="bold">
              {formatMoney(monthlySpent, true)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Cash remaining
            </AppText>

            <AppText variant="bold">
              {formatMoney(available, true)}
            </AppText>
          </AppRow>

          {plannedAvailable !== undefined ? (
            <AppRow>
              <AppText variant="muted">
                Planned remaining
              </AppText>

              <AppText variant="bold">
                {formatMoney(
                  plannedAvailable,
                  true
                )}
              </AppText>
            </AppRow>
          ) : null}

          <AppRow>
            <AppText variant="muted">
              Spendable after plan
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                spendableAvailable,
                true
              )}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Purchase
            </AppText>

            <AppText variant="bold">
              {formatMoney(amount, true)}
            </AppText>
          </AppRow>

          <View
            style={{
              height: 1,
              backgroundColor:
                "rgba(255,255,255,0.08)",
            }}
          />

          <AppRow>
            <AppText variant="bold">
              Remaining afterward
            </AppText>

            <AppText variant="bold">
              {formatMoney(
                afterPurchase,
                true
              )}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      {amount > 0 &&
      result.status !== "danger" ? (
        <AppButton
          title="Add as Transaction"
          onPress={onAddTransaction}
        />
      ) : null}
    </>
  );
}