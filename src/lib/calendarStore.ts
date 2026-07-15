import { getAppData, updateAppData } from "./appStore";
import {
  CalendarEvent,
  CalendarEventSourceType,
} from "./types";

export function getCalendarEvents(): CalendarEvent[] {
  return getAppData().calendarEvents ?? [];
}

export function getCalendarEvent(
  eventId: string
): CalendarEvent | undefined {
  return getCalendarEvents().find(
    (event) => event.id === eventId
  );
}

export function getCalendarEventsBySource(
  sourceType: CalendarEventSourceType,
  sourceId?: string
): CalendarEvent[] {
  return getCalendarEvents()
    .filter((event) => {
      if (event.sourceType !== sourceType) {
        return false;
      }

      if (sourceId && event.sourceId !== sourceId) {
        return false;
      }

      return true;
    })
    .sort(sortCalendarEvents);
}

export function getBusinessCalendarEvents(
  businessId: string
): CalendarEvent[] {
  return getCalendarEventsBySource(
    "business",
    businessId
  );
}

export function getHouseholdCalendarEvents(
  householdId: string
): CalendarEvent[] {
  return getCalendarEventsBySource(
    "household",
    householdId
  );
}

export function getPersonalCalendarEvents(): CalendarEvent[] {
  return getCalendarEvents()
    .filter(
      (event) =>
        event.sourceType === "personal" ||
        !event.sourceType
    )
    .sort(sortCalendarEvents);
}

export async function addCalendarEvent(
  event: CalendarEvent
) {
  await updateAppData((app) => {
    app.calendarEvents ??= [];

    const existingIndex =
      app.calendarEvents.findIndex(
        (item) => item.id === event.id
      );

    if (existingIndex >= 0) {
      app.calendarEvents[existingIndex] = event;
      return;
    }

    app.calendarEvents.push({
      ...event,
      repeat: event.repeat ?? "never",
      createdAt:
        event.createdAt ?? new Date().toISOString(),
      completed: event.completed ?? false,
    });
  });
}

export async function updateCalendarEvent(
  updatedEvent: CalendarEvent
) {
  await updateAppData((app) => {
    app.calendarEvents ??= [];

    const eventIndex = app.calendarEvents.findIndex(
      (event) => event.id === updatedEvent.id
    );

    if (eventIndex < 0) {
      app.calendarEvents.push({
        ...updatedEvent,
        repeat: updatedEvent.repeat ?? "never",
        createdAt:
          updatedEvent.createdAt ??
          new Date().toISOString(),
        completed: updatedEvent.completed ?? false,
      });

      return;
    }

    app.calendarEvents[eventIndex] = {
      ...app.calendarEvents[eventIndex],
      ...updatedEvent,
    };
  });
}

export async function toggleCalendarEventComplete(
  eventId: string
) {
  await updateAppData((app) => {
    app.calendarEvents ??= [];

    const event = app.calendarEvents.find(
      (item) => item.id === eventId
    );

    if (!event) {
      return;
    }

    event.completed = !event.completed;
  });
}

export async function deleteCalendarEvent(
  eventId: string
) {
  await updateAppData((app) => {
    app.calendarEvents ??= [];

    app.calendarEvents =
      app.calendarEvents.filter(
        (event) => event.id !== eventId
      );
  });
}

export async function deleteCalendarEventsBySource(
  sourceType: CalendarEventSourceType,
  sourceId: string
) {
  await updateAppData((app) => {
    app.calendarEvents ??= [];

    app.calendarEvents =
      app.calendarEvents.filter(
        (event) =>
          !(
            event.sourceType === sourceType &&
            event.sourceId === sourceId
          )
      );
  });
}

export function getUpcomingCalendarEvents(
  events: CalendarEvent[],
  limit = 5,
  fromDate = new Date()
): CalendarEvent[] {
  return [...events]
    .filter((event) => {
      if (event.completed) {
        return false;
      }

      const eventDate = getNextEventDate(
        event,
        fromDate
      );

      return eventDate !== null;
    })
    .sort((first, second) => {
      const firstDate = getNextEventDate(
        first,
        fromDate
      );

      const secondDate = getNextEventDate(
        second,
        fromDate
      );

      if (!firstDate && !secondDate) return 0;
      if (!firstDate) return 1;
      if (!secondDate) return -1;

      return (
        firstDate.getTime() -
        secondDate.getTime()
      );
    })
    .slice(0, limit);
}

export function getNextEventDate(
  event: CalendarEvent,
  fromDate = new Date()
): Date | null {
  const repeat = event.repeat ?? "never";

  const eventMonth =
    event.month !== undefined
      ? event.month
      : fromDate.getMonth();

  const eventYear =
    event.year !== undefined
      ? event.year
      : fromDate.getFullYear();

  if (repeat === "never") {
    const date = new Date(
      eventYear,
      eventMonth,
      event.day
    );

    return date >= startOfDay(fromDate)
      ? date
      : null;
  }

  if (repeat === "monthly") {
    let date = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      event.day
    );

    if (date < startOfDay(fromDate)) {
      date = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth() + 1,
        event.day
      );
    }

    return date;
  }

  if (repeat === "yearly") {
    let date = new Date(
      fromDate.getFullYear(),
      eventMonth,
      event.day
    );

    if (date < startOfDay(fromDate)) {
      date = new Date(
        fromDate.getFullYear() + 1,
        eventMonth,
        event.day
      );
    }

    return date;
  }

  if (
    repeat === "weekly" ||
    repeat === "biweekly"
  ) {
    const baseDate = new Date(
      eventYear,
      eventMonth,
      event.day
    );

    const intervalDays =
      repeat === "weekly" ? 7 : 14;

    let nextDate = new Date(baseDate);

    while (nextDate < startOfDay(fromDate)) {
      nextDate = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate() + intervalDays
      );
    }

    return nextDate;
  }

  return null;
}

function sortCalendarEvents(
  first: CalendarEvent,
  second: CalendarEvent
) {
  const now = new Date();

  const firstDate = getNextEventDate(first, now);
  const secondDate = getNextEventDate(second, now);

  if (!firstDate && !secondDate) return 0;
  if (!firstDate) return 1;
  if (!secondDate) return -1;

  return (
    firstDate.getTime() -
    secondDate.getTime()
  );
}

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}