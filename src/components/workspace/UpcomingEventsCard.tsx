import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import type { CalendarEvent } from "@/lib/calendarStore";
import { useMemo } from "react";
import { View } from "react-native";

type Props = {
  events: CalendarEvent[];
  limit?: number;
  title?: string;
  onOpenCalendar?: () => void;
};

export default function UpcomingEventsCard({
  events,
  limit = 5,
  title = "Upcoming",
  onOpenCalendar,
}: Props) {
  const upcomingEvents = useMemo(() => {
    const now = startOfDay(new Date());

    return events
      .map((event) => ({
        event,
        nextDate: getNextOccurrence(event, now),
      }))
      .filter(
        (
          item
        ): item is {
          event: CalendarEvent;
          nextDate: Date;
        } => Boolean(item.nextDate)
      )
      .sort(
        (first, second) =>
          first.nextDate.getTime() -
          second.nextDate.getTime()
      )
      .slice(0, limit);
  }, [events, limit]);

  return (
    <AppCard>
      <AppRow>
        <View style={{ flex: 1 }}>
          <AppText variant="section">
            {title}
          </AppText>

          <AppText variant="muted">
            Bills, deadlines, and reminders
          </AppText>
        </View>

        {onOpenCalendar ? (
          <AppButton
            title="Calendar"
            variant="outline"
            onPress={onOpenCalendar}
          />
        ) : null}
      </AppRow>

      {upcomingEvents.length === 0 ? (
        <View style={{ marginTop: 14 }}>
          <EmptyState message="Nothing is currently scheduled for this workspace." />
        </View>
      ) : (
        <View
          style={{
            marginTop: 14,
            gap: 14,
          }}
        >
          {upcomingEvents.map(
            ({ event, nextDate }, index) => (
              <EventRow
                key={event.id}
                event={event}
                nextDate={nextDate}
                showDivider={
                  index <
                  upcomingEvents.length - 1
                }
              />
            )
          )}
        </View>
      )}
    </AppCard>
  );
}

function EventRow({
  event,
  nextDate,
  showDivider,
}: {
  event: CalendarEvent;
  nextDate: Date;
  showDivider: boolean;
}) {
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View
          style={{
            minWidth: 54,
            alignItems: "center",
            paddingVertical: 9,
            paddingHorizontal: 8,
            borderRadius: 14,
            backgroundColor:
              "rgba(255,255,255,0.08)",
          }}
        >
          <AppText variant="bold">
            {nextDate
              .toLocaleDateString(undefined, {
                month: "short",
              })
              .toUpperCase()}
          </AppText>

          <View style={{ marginTop: 2 }}>
            <AppText variant="section">
              {nextDate.getDate()}
            </AppText>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">
                {event.title}
              </AppText>

              <AppText variant="muted">
                {formatDateLabel(nextDate)}
                {event.repeat &&
                event.repeat !== "never"
                  ? ` · ${formatRepeat(
                      event.repeat
                    )}`
                  : ""}
              </AppText>
            </View>

            {event.amount !== undefined ? (
              <AppText variant="bold">
                {formatMoney(event.amount)}
              </AppText>
            ) : null}
          </AppRow>

          {event.notes ? (
            <View style={{ marginTop: 5 }}>
              <AppText variant="muted">
                {event.notes}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      {showDivider ? (
        <View
          style={{
            height: 1,
            marginTop: 14,
            backgroundColor:
              "rgba(255,255,255,0.08)",
          }}
        />
      ) : null}
    </View>
  );
}

function getNextOccurrence(
  event: CalendarEvent,
  referenceDate: Date
) {
  const eventMonth =
    event.month ?? referenceDate.getMonth();

  const eventYear =
    event.year ?? referenceDate.getFullYear();

  const day = clampDay(event.day);

  let candidate = createSafeDate(
    eventYear,
    eventMonth,
    day
  );

  if (candidate >= referenceDate) {
    return candidate;
  }

  const repeat = event.repeat ?? "never";

  if (repeat === "never") {
    return null;
  }

  if (repeat === "weekly") {
    candidate = new Date(candidate);

    while (candidate < referenceDate) {
      candidate.setDate(
        candidate.getDate() + 7
      );
    }

    return candidate;
  }

  if (repeat === "biweekly") {
    candidate = new Date(candidate);

    while (candidate < referenceDate) {
      candidate.setDate(
        candidate.getDate() + 14
      );
    }

    return candidate;
  }

  if (repeat === "monthly") {
    const nextMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1
    );

    candidate = createSafeDate(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      day
    );

    if (candidate < referenceDate) {
      const followingMonth = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() + 1,
        1
      );

      candidate = createSafeDate(
        followingMonth.getFullYear(),
        followingMonth.getMonth(),
        day
      );
    }

    return candidate;
  }

  if (repeat === "yearly") {
    candidate = createSafeDate(
      referenceDate.getFullYear(),
      eventMonth,
      day
    );

    if (candidate < referenceDate) {
      candidate = createSafeDate(
        referenceDate.getFullYear() + 1,
        eventMonth,
        day
      );
    }

    return candidate;
  }

  return null;
}

function createSafeDate(
  year: number,
  month: number,
  day: number
) {
  const finalDay = Math.min(
    day,
    new Date(year, month + 1, 0).getDate()
  );

  return startOfDay(
    new Date(year, month, finalDay)
  );
}

function startOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function clampDay(day: number) {
  return Math.min(
    Math.max(Number(day) || 1, 1),
    31
  );
}

function formatDateLabel(date: Date) {
  const today = startOfDay(new Date());

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) {
    return "Today";
  }

  if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatRepeat(
  repeat: NonNullable<CalendarEvent["repeat"]>
) {
  if (repeat === "biweekly") {
    return "Every two weeks";
  }

  return (
    repeat.charAt(0).toUpperCase() +
    repeat.slice(1)
  );
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}