import type { Purchase } from "@/lib/types";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type Props = {
  visible: boolean;
  editingPurchase: Purchase | null;
  purchaseName: string;
  purchaseAmount: string;
  purchaseCategory: string;
  categories: string[];
  onChangeName: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function PurchaseFormModal({
  visible,
  editingPurchase,
  purchaseName,
  purchaseAmount,
  purchaseCategory,
  categories,
  onChangeName,
  onChangeAmount,
  onChangeCategory,
  onSave,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalBackdrop}>
        <View style={modalCard}>
          <Text style={modalTitle}>
            {editingPurchase ? "Edit Purchase" : "Add Purchase"}
          </Text>

          <TextInput
            placeholder="Purchase Name"
            value={purchaseName}
            onChangeText={onChangeName}
            style={inputStyle}
          />

          <TextInput
            placeholder="Amount"
            value={purchaseAmount}
            onChangeText={onChangeAmount}
            keyboardType="numeric"
            style={inputStyle}
          />

          <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Category</Text>

          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => onChangeCategory(category)}
              style={[
                categoryButton,
                purchaseCategory === category && selectedCategory,
              ]}
            >
              <Text>{category}</Text>
            </Pressable>
          ))}

          <Pressable onPress={onSave} style={saveButton}>
            <Text style={buttonText}>
              {editingPurchase ? "Save Changes" : "Save Purchase"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose}>
            <Text style={{ textAlign: "center" }}>Cancel</Text>
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
  marginBottom: 20,
};

const inputStyle = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
};

const categoryButton = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
};

const selectedCategory = {
  backgroundColor: "#d9f99d",
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