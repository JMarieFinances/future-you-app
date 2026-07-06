import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarEvent } from "@/lib/calendarStore";
import CalendarEventCard from "./CalendarEventCard";

export default function CalendarDayDetails({
  day,
  month,
  year,
  events,
  onAdd,
  onOpenEvent,
}: {
  day: number;
  month: number;
  year: number;
  events: CalendarEvent[];
  onAdd: () => void;
  onOpenEvent: (event: CalendarEvent) => void;
}) {
  const date = new Date(year, month, day);
  const label = date.toLocaleDateString("default", {
    month: "long",
    day: "numeric",
  });

  return (
    <AppCard>
      <AppText variant="section">{label}</AppText>

      {events.length === 0 ? (
        <EmptyState message="Nothing scheduled for this day." />
      ) : (
        events.map((event) => (
          <CalendarEventCard
            key={event.id}
            event={event}
            onPress={() => onOpenEvent(event)}
          />
        ))
      )}

      <AppButton title="Add Reminder" onPress={onAdd} variant="outline" />
    </AppCard>
  );
}