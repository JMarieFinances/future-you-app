import { CalendarEvent } from "@/lib/calendarStore";

export type CalendarFilter =
  | "all"
  | "income"
  | "bills"
  | "subscriptions"
  | "goals"
  | "business"
  | "household"
  | "review"
  | "custom";

export function getEventColor(type: CalendarEvent["type"]) {
  if (type === "payday") return "#22c55e";
  if (type === "bill") return "#ef4444";
  if (type === "subscription") return "#a855f7";
  if (type === "goal") return "#eab308";
  if (type === "business") return "#1e3a8a";
  if (type === "household") return "#14b8a6";
  if (type === "review") return "#9ca3af";
  return "#64748b";
}

export function getEventsForMonth(
  events: CalendarEvent[],
  month: number,
  year: number
) {
  const results: CalendarEvent[] = [];

  events.forEach((event) => {
    if (event.repeat === "weekly" || event.repeat === "biweekly") {
      results.push(...expandRepeatingDateEvent(event, month, year));
      return;
    }

    if (event.repeat === "monthly") {
      results.push({
        ...event,
        month,
        year,
        day: clampDay(event.day, month, year),
      });
      return;
    }

    if (event.repeat === "yearly") {
      if (event.month === month) {
        results.push(event);
      }
      return;
    }

    if (
      (event.month === undefined || event.month === month) &&
      (event.year === undefined || event.year === year)
    ) {
      results.push(event);
    }
  });

  return results.sort((a, b) => a.day - b.day);
}

export function getEventsForDay(
  events: CalendarEvent[],
  day: number,
  month: number,
  year: number
) {
  return getEventsForMonth(events, month, year).filter(
    (event) => event.day === day
  );
}

export function getTodaysEvents(events: CalendarEvent[]) {
  const now = new Date();
  return getEventsForDay(events, now.getDate(), now.getMonth(), now.getFullYear());
}

export function getUpcomingEvents(events: CalendarEvent[]) {
  const now = new Date();
  const results: CalendarEvent[] = [];

  for (let i = 0; i <= 7; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);

    results.push(
      ...getEventsForDay(
        events,
        date.getDate(),
        date.getMonth(),
        date.getFullYear()
      )
    );
  }

  return results;
}

export function getMonthlyEventTotal(events: CalendarEvent[]) {
  return events.reduce((sum, event) => sum + (event.amount ?? 0), 0);
}

export function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => a.day - b.day);
}

export function eventMatchesFilter(event: CalendarEvent, filter: CalendarFilter) {
  if (filter === "all") return true;
  if (filter === "income") return event.type === "payday";
  if (filter === "bills") return event.type === "bill";
  if (filter === "subscriptions") return event.type === "subscription";
  if (filter === "goals") return event.type === "goal";
  if (filter === "business") return event.type === "business";
  if (filter === "household") return event.type === "household";
  if (filter === "review") return event.type === "review";
  if (filter === "custom") return event.type === "custom";
  return true;
}

export function filterEvents(events: CalendarEvent[], filter: CalendarFilter) {
  return events.filter((event) => eventMatchesFilter(event, filter));
}

function expandRepeatingDateEvent(
  event: CalendarEvent,
  month: number,
  year: number
) {
  const results: CalendarEvent[] = [];

  const start = new Date(
    event.year ?? year,
    event.month ?? month,
    event.day
  );

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const interval = event.repeat === "weekly" ? 7 : 14;

  let current = new Date(start);

  while (current < monthStart) {
    current.setDate(current.getDate() + interval);
  }

  while (current <= monthEnd) {
    results.push({
      ...event,
      day: current.getDate(),
      month: current.getMonth(),
      year: current.getFullYear(),
    });

    current.setDate(current.getDate() + interval);
  }

  return results;
}

function clampDay(day: number, month: number, year: number) {
  const max = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(day, 1), max);
}