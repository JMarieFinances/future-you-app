import type { Purchase } from "@/lib/types";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  category: string | null;
  budget: number;
  purchases: Purchase[];
  onClose: () => void;
  onAddPurchase: () => void;
};

export default function CategoryDetailsModal({
  category,
  budget,
  purchases,
  onClose,
  onAddPurchase,
}: Props) {
  const spent = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const remaining = budget - spent;
  const overspent = Math.max(spent - budget, 0);
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  return (
    <Modal visible={category !== null} transparent animationType="slide">
      <View style={modalBackdrop}>
        <View style={modalCard}>
          <Text style={modalTitle}>{category}</Text>

          <Text>Budget: ${budget}</Text>
          <Text>Spent: ${spent}</Text>

          {overspent > 0 ? (
            <Text style={{ fontWeight: "bold", marginTop: 8 }}>
              🚨 Over by ${overspent}
            </Text>
          ) : (
            <Text style={{ marginTop: 8 }}>${remaining} remaining</Text>
          )}

          <View style={progressTrack}>
            <View style={[progressFill, { width: `${percent}%` }]} />
          </View>

          <Pressable onPress={onAddPurchase} style={saveButton}>
            <Text style={buttonText}>+ Add {category} Purchase</Text>
          </Pressable>

          <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 16 }}>
            Purchases
          </Text>

          {purchases.length === 0 ? (
            <Text style={{ marginTop: 8 }}>No purchases yet.</Text>
          ) : (
            purchases.map((purchase) => (
              <View key={purchase.id} style={purchaseRow}>
                <View>
                  <Text style={{ fontWeight: "bold" }}>{purchase.name}</Text>
                  <Text style={{ opacity: 0.7 }}>
                    {new Date(purchase.date).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={{ fontWeight: "bold" }}>-${purchase.amount}</Text>
              </View>
            ))
          )}

          <Pressable onPress={onClose} style={{ marginTop: 16 }}>
            <Text style={{ textAlign: "center" }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalBackdrop = {
  flex: 1,
  justifyContent: "center" as const,
  backgroundColor: "rgba(0,0,0,.4)",
  padding: 24,
};

const modalCard = {
  backgroundColor: "white",
  borderRadius: 20,
  padding: 20,
};

const modalTitle = {
  fontSize: 24,
  fontWeight: "bold" as const,
  marginBottom: 12,
};

const progressTrack = {
  height: 10,
  backgroundColor: "#e5e5e5",
  borderRadius: 999,
  marginVertical: 12,
  overflow: "hidden" as const,
};

const progressFill = {
  height: "100%",
  backgroundColor: "green",
  borderRadius: 999,
};

const saveButton = {
  backgroundColor: "black",
  padding: 14,
  borderRadius: 12,
  marginTop: 12,
};

const buttonText = {
  color: "white",
  textAlign: "center" as const,
  fontWeight: "600" as const,
};

const purchaseRow = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
};