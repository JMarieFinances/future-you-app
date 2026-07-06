import AppText from "@/components/ui/AppText";
import { useTheme } from "@/lib/useTheme";
import { Pressable, View } from "react-native";
import { CalendarFilter } from "./calendarUtils";

const filters: { label: string; value: CalendarFilter }[] = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Bills", value: "bills" },
  { label: "Goals", value: "goals" },
  { label: "Business", value: "business" },
  { label: "Household", value: "household" },
  { label: "Review", value: "review" },
  { label: "Custom", value: "custom" },
];

export default function CalendarFilters({
  activeFilter,
  onChange,
}: {
  activeFilter: CalendarFilter;
  onChange: (filter: CalendarFilter) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {filters.map((filter) => {
        const active = activeFilter === filter.value;

        return (
          <Pressable
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={{
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primary : "transparent",
              borderRadius: 999,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <AppText variant="bold">{filter.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}