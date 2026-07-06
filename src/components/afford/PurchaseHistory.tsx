import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import { Purchase } from "@/lib/types";
import { Pressable, View } from "react-native";

export default function PurchaseHistory({
  purchases,
  onSelect,
  onDelete,
}: {
  purchases: Purchase[];
  onSelect: (purchase: Purchase) => void;
  onDelete: (purchaseId: string) => void;
}) {
  return (
    <AppCard>
      <AppText variant="section">Purchase History</AppText>

      <View style={{ marginTop: 12, gap: 12 }}>
        {purchases.length === 0 ? (
          <AppText variant="muted">No purchases saved yet.</AppText>
        ) : (
          purchases.map((purchase) => (
            <Pressable key={purchase.id} onPress={() => onSelect(purchase)}>
              <AppCard>
                <AppRow>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bold">{purchase.name}</AppText>
                    <AppText variant="muted">
                      {purchase.category} •{" "}
                      {new Date(purchase.date).toLocaleDateString()}
                    </AppText>
                  </View>

                  <AppText variant="bold">
                    ${purchase.amount.toFixed(2)}
                  </AppText>
                </AppRow>

                <View style={{ marginTop: 10 }}>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      onDelete(purchase.id);
                    }}
                  >
                    <AppText variant="muted">Delete</AppText>
                  </Pressable>
                </View>
              </AppCard>
            </Pressable>
          ))
        )}
      </View>
    </AppCard>
  );
}