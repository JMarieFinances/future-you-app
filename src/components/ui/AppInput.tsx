import { useTheme } from "@/lib/useTheme";
import { TextInput, TextInputProps } from "react-native";

export default function AppInput(props: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      {...props}
      placeholderTextColor={theme.colors.muted}
      style={[theme.input, props.style]}
    />
  );
}