import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import type { Purchase } from "@/lib/types";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

type TransactionFilter =
  | "all"
  | "income"
  | "expense";

type Props = {
  transactions: Purchase[];
  workspaceLabel: string;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Purchase) => void;
  onDeleteTransaction: (transactionId: string) => void;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function WorkspaceTransactions({
  transactions,
  workspaceLabel,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<TransactionFilter>("all");

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (first, second) =>
          new Date(second.date).getTime() -
          new Date(first.date).getTime()
      ),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return sortedTransactions.filter(
      (transaction) => {
        if (
          filter !== "all" &&
          transaction.type !== filter
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          transaction.name,
          transaction.category,
          transaction.subcategory,
          transaction.notes,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedSearch)
        );
      }
    );
  }, [filter, search, sortedTransactions]);

  const totalIncome = transactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (sum, transaction) =>
        sum + transaction.amount,
      0
    );

  const totalExpenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (sum, transaction) =>
        sum + transaction.amount,
      0
    );

  const netActivity =
    totalIncome - totalExpenses;

  return (
    <>
      <AppCard glass>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              {workspaceLabel} Activity
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">
                {formatMoney(netActivity)}
              </AppText>
            </View>

            <AppText variant="muted">
              Net logged transaction activity
            </AppText>
          </View>

          <AppButton
            title="Add Transaction"
            onPress={onAddTransaction}
          />
        </AppRow>
      </AppCard>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppCard>
            <AppText variant="muted">
              Income
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="section">
                {formatMoney(totalIncome)}
              </AppText>
            </View>
          </AppCard>
        </View>

        <View style={{ flex: 1 }}>
          <AppCard>
            <AppText variant="muted">
              Expenses
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="section">
                {formatMoney(totalExpenses)}
              </AppText>
            </View>
          </AppCard>
        </View>
      </View>

      <AppCard>
        <AppText variant="section">
          Search and Filter
        </AppText>

        <View
          style={{
            marginTop: 12,
            gap: 12,
          }}
        >
          <AppInput
            placeholder="Search transactions"
            value={search}
            onChangeText={setSearch}
          />

          <View
            style={{
              flexDirection: "row",
              gap: 8,
            }}
          >
            <FilterButton
              label="All"
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />

            <FilterButton
              label="Income"
              active={filter === "income"}
              onPress={() =>
                setFilter("income")
              }
            />

            <FilterButton
              label="Expenses"
              active={filter === "expense"}
              onPress={() =>
                setFilter("expense")
              }
            />
          </View>
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Transactions
            </AppText>

            <AppText variant="muted">
              {filteredTransactions.length} shown
            </AppText>
          </View>

          <AppText variant="muted">
            {transactions.length} total
          </AppText>
        </AppRow>

        {filteredTransactions.length === 0 ? (
          <View style={{ marginTop: 14 }}>
            <EmptyState message="No transactions match the current search and filter." />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 10,
            }}
          >
            {filteredTransactions.map(
              (transaction) => (
                <AppCard key={transaction.id}>
                  <AppRow>
                    <Pressable
                      onPress={() =>
                        onEditTransaction(
                          transaction
                        )
                      }
                      style={{ flex: 1 }}
                    >
                      <AppText variant="bold">
                        {transaction.name}
                      </AppText>

                      <AppText variant="muted">
                        {transaction.subcategory ??
                          transaction.category}
                      </AppText>

                      <AppText variant="muted">
                        {new Date(
                          transaction.date
                        ).toLocaleDateString()}
                      </AppText>
                    </Pressable>

                    <View
                      style={{
                        alignItems: "flex-end",
                        marginLeft: 12,
                      }}
                    >
                      <AppText variant="bold">
                        {transaction.type ===
                        "income"
                          ? "+"
                          : "-"}
                        {formatMoney(
                          transaction.amount
                        )}
                      </AppText>

                      <Pressable
                        onPress={() =>
                          onDeleteTransaction(
                            transaction.id
                          )
                        }
                        style={({ pressed }) => ({
                          marginTop: 6,
                          opacity: pressed
                            ? 0.55
                            : 1,
                        })}
                      >
                        <AppText variant="muted">
                          Delete
                        </AppText>
                      </Pressable>
                    </View>
                  </AppRow>

                  {transaction.notes ? (
                    <View
                      style={{
                        marginTop: 10,
                      }}
                    >
                      <AppText variant="muted">
                        {transaction.notes}
                      </AppText>
                    </View>
                  ) : null}
                </AppCard>
              )
            )}
          </View>
        )}
      </AppCard>
    </>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active
          ? "rgba(255,255,255,0.12)"
          : "transparent",
        borderWidth: 1,
        borderColor: active
          ? "rgba(255,255,255,0.2)"
          : "rgba(255,255,255,0.08)",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppText
        variant={active ? "bold" : "muted"}
      >
        {label}
      </AppText>
    </Pressable>
  );
}