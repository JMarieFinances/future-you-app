import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import { CalendarEvent } from "@/lib/calendarStore";
import { useTheme } from "@/lib/useTheme";
import { Pressable, View } from "react-native";
import { getEventColor, getEventsForDay } from "./calendarUtils";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarMonth({
  events,
  month,
  year,
  onPreviousMonth,
  onNextMonth,
  onSelectDay,
}: {
  events: CalendarEvent[];
  month: number;
  year: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: number) => void;
}) {
  const { colors } = useTheme();

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === month && today.getFullYear() === year;

  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <AppCard>
      <AppRow>
        <Pressable onPress={onPreviousMonth}>
          <AppText variant="bold">←</AppText>
        </Pressable>

        <AppText variant="section">
          {monthName} {year}
        </AppText>

        <Pressable onPress={onNextMonth}>
          <AppText variant="bold">→</AppText>
        </Pressable>
      </AppRow>

      <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 8 }}>
        {weekDays.map((day) => (
          <View key={day} style={{ flex: 1, alignItems: "center" }}>
            <AppText variant="muted">{day}</AppText>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((day, index) => {
          const dayEvents = day
            ? getEventsForDay(events, day, month, year)
            : [];

          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <View
              key={`${day}-${index}`}
              style={{
                width: `${100 / 7}%`,
                minHeight: 60,
                padding: 4,
              }}
            >
              {day ? (
                <Pressable
                  onPress={() => onSelectDay(day)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: isToday ? colors.primary : colors.border,
                    backgroundColor: isToday
                      ? colors.progressTrack
                      : "transparent",
                    borderRadius: 12,
                    padding: 6,
                    alignItems: "center",
                  }}
                >
                  <AppText variant={isToday ? "bold" : "muted"}>{day}</AppText>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      marginTop: 4,
                      gap: 2,
                    }}
                  >
                    {dayEvents.slice(0, 4).map((event) => (
  <View
    key={event.id}
    style={{
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: getEventColor(event.type),
    }}
  />
))}

                    {dayEvents.length > 3 ? (
                      <AppText variant="muted">+</AppText>
                    ) : null}
                  </View>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}