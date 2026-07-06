import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import { CalendarEvent } from "@/lib/calendarStore";
import { Pressable, View } from "react-native";
import { getEventColor } from "./calendarUtils";

export default function CalendarEventCard({
  event,
  onPress,
}: {
  event: CalendarEvent;
  onPress: () => void;
}) {
  const color = getEventColor(event.type);

  return (
    <Pressable onPress={onPress}>
      <AppCard>
        <AppRow>
          <View
            style={{
              width: 5,
              height: 46,
              borderRadius: 999,
              backgroundColor: color,
              marginRight: 10,
            }}
          />

          <View style={{ flex: 1 }}>
            <AppText variant="bold">{event.title}</AppText>

            <AppText variant="muted">
              Day {event.day}
              {event.notes ? ` · ${event.notes}` : ""}
            </AppText>
          </View>

          {event.amount !== undefined ? (
            <AppText variant="bold">${event.amount.toFixed(0)}</AppText>
          ) : null}
        </AppRow>
      </AppCard>
    </Pressable>
  );
}