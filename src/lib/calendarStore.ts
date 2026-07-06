import { getAppData, updateAppData } from "./appStore";

export type CalendarEventType =
  | "payday"
  | "bill"
  | "subscription"
  | "goal"
  | "business"
  | "household"
  | "review"
  | "custom";

export type CalendarRepeat =
  | "never"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export type CalendarEvent = {
  id: string;
  title: string;
  amount?: number;
  day: number;
  month?: number;
  year?: number;
  type: CalendarEventType;
  repeat?: CalendarRepeat;
  notes?: string;
  sourceId?: string;
  sourceType?: "personal" | "household" | "business" | "goal" | "system";
};

export function getCalendarEvents(): CalendarEvent[] {
  return getAppData().calendarEvents ?? [];
}

export async function addCalendarEvent(event: CalendarEvent) {
  await updateAppData((app) => {
    app.calendarEvents ??= [];
    app.calendarEvents.push(event);
  });
}

export async function updateCalendarEvent(updated: CalendarEvent) {
  await updateAppData((app) => {
    app.calendarEvents ??= [];
    app.calendarEvents = app.calendarEvents.map((event) =>
      event.id === updated.id ? updated : event
    );
  });
}

export async function deleteCalendarEvent(id: string) {
  await updateAppData((app) => {
    app.calendarEvents ??= [];
    app.calendarEvents = app.calendarEvents.filter((event) => event.id !== id);
  });
}