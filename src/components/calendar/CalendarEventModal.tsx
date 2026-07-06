import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import {
    CalendarEvent,
    CalendarEventType,
    CalendarRepeat,
} from "@/lib/calendarStore";
import { useTheme } from "@/lib/useTheme";
import { Modal, Pressable, View } from "react-native";

const eventTypes: CalendarEventType[] = [
  "payday",
  "bill",
  "goal",
  "business",
  "household",
  "review",
  "custom",
];

const repeatOptions: CalendarRepeat[] = [
  "never",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
];

export default function CalendarEventModal({
  visible,
  event,
  title,
  amount,
  day,
  type,
  repeat,
  notes,
  setTitle,
  setAmount,
  setDay,
  setType,
  setRepeat,
  setNotes,
  onSave,
  onDelete,
  onClose,
}: {
  visible: boolean;
  event: CalendarEvent | null;
  title: string;
  amount: string;
  day: string;
  type: CalendarEventType;
  repeat: CalendarRepeat;
  notes: string;
  setTitle: (value: string) => void;
  setAmount: (value: string) => void;
  setDay: (value: string) => void;
  setType: (value: CalendarEventType) => void;
  setRepeat: (value: CalendarRepeat) => void;
  setNotes: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { colors, theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,.45)",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: theme.radius.card,
            padding: 20,
          }}
        >
          <AppRow>
            <AppText variant="section">
              {event ? "Edit Event" : "Add Event"}
            </AppText>

            <Pressable onPress={onClose}>
              <AppText variant="muted">Close</AppText>
            </Pressable>
          </AppRow>

          <View style={{ marginTop: 16, gap: 12 }}>
            <AppInput placeholder="Title" value={title} onChangeText={setTitle} />

            <AppInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <AppInput
              placeholder="Day of month"
              value={day}
              onChangeText={setDay}
              keyboardType="numeric"
            />

            <AppInput placeholder="Notes" value={notes} onChangeText={setNotes} />

            <AppText variant="bold">Type</AppText>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {eventTypes.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={type === item}
                  onPress={() => setType(item)}
                />
              ))}
            </View>

            <AppText variant="bold">Repeat</AppText>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {repeatOptions.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={repeat === item}
                  onPress={() => setRepeat(item)}
                />
              ))}
            </View>

            <AppButton title="Save Event" onPress={onSave} />

            {event ? (
              <AppButton
                title="Delete Event"
                onPress={onDelete}
                variant="outline"
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : "transparent",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      <AppText variant="bold">{label}</AppText>
    </Pressable>
  );
}