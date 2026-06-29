import { Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

export default function CategoryInput({
  label,
  value,
  onChangeText,
}: Props) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          marginBottom: 4,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
        }}
      />
    </View>
  );
}