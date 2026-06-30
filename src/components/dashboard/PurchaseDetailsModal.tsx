import type { Purchase } from "@/lib/types";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  purchase: Purchase | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function PurchaseDetailsModal({
  purchase,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <Modal visible={purchase !== null} transparent animationType="slide">
      <View style={modalBackdrop}>
        <View style={modalCard}>
          <Text style={modalTitle}>Purchase Details</Text>

          {purchase && (
            <>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                {purchase.name}
              </Text>

              <Text style={{ marginTop: 16 }}>Amount: ${purchase.amount}</Text>
              <Text>Category: {purchase.category}</Text>
              <Text>Purchased: {formatDate(purchase.date)}</Text>

              <Pressable onPress={onEdit} style={saveButton}>
                <Text style={buttonText}>✏️ Edit</Text>
              </Pressable>

              <Pressable
                onPress={onDelete}
                style={[saveButton, { backgroundColor: "#dc2626" }]}
              >
                <Text style={buttonText}>🗑 Delete</Text>
              </Pressable>

              <Pressable onPress={onClose}>
                <Text style={{ textAlign: "center" }}>Close</Text>
              </Pressable>
            </>
          )}
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
  marginBottom: 20,
};

const saveButton = {
  backgroundColor: "black",
  padding: 14,
  borderRadius: 12,
  marginTop: 12,
  marginBottom: 10,
};

const buttonText = {
  color: "white",
  textAlign: "center" as const,
  fontWeight: "600" as const,
};