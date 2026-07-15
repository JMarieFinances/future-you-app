import CalendarDayDetails from "@/components/calendar/CalendarDayDetails";
import CalendarEventModal from "@/components/calendar/CalendarEventModal";
import CalendarFilters from "@/components/calendar/CalendarFilters";
import CalendarMonth from "@/components/calendar/CalendarMonth";
import {
    CalendarFilter,
    filterEvents,
    getEventsForDay,
    getEventsForMonth,
    getMonthlyEventTotal,
    getTodaysEvents,
    getUpcomingEvents,
} from "@/components/calendar/calendarUtils";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import {
    addCalendarEvent,
    deleteCalendarEvent,
    getCalendarEventsBySource,
    updateCalendarEvent,
} from "@/lib/calendarStore";
import {
    CalendarEvent,
    CalendarEventRepeat,
    CalendarEventSourceType,
    CalendarEventType,
} from "@/lib/types";
import { useState } from "react";
import { View } from "react-native";

type WorkspaceCalendarProps = {
  sourceType: CalendarEventSourceType;
  sourceId?: string;
  title: string;
  subtitle: string;
  defaultEventType?: CalendarEventType;
};

const cleanAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

export default function WorkspaceCalendar({
  sourceType,
  sourceId,
  title,
  subtitle,
  defaultEventType = "custom",
}: WorkspaceCalendarProps) {
  const now = new Date();

  const [viewMonth, setViewMonth] = useState(
    now.getMonth()
  );

  const [viewYear, setViewYear] = useState(
    now.getFullYear()
  );

  const [selectedDay, setSelectedDay] = useState(
    now.getDate()
  );

  const [activeFilter, setActiveFilter] =
    useState<CalendarFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingEvent, setEditingEvent] =
    useState<CalendarEvent | null>(null);

  const [titleValue, setTitleValue] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const [type, setType] =
    useState<CalendarEventType>(defaultEventType);

  const [repeat, setRepeat] =
    useState<CalendarEventRepeat>("never");

  const [notes, setNotes] = useState("");

  const [, forceUpdate] = useState(0);

  const events = getCalendarEventsBySource(
    sourceType,
    sourceId
  );

  const filteredEvents = filterEvents(
    events,
    activeFilter
  );

  const monthEvents = getEventsForMonth(
    filteredEvents,
    viewMonth,
    viewYear
  );

  const todaysEvents = getTodaysEvents(
    filteredEvents
  );

  const upcomingEvents = getUpcomingEvents(
    filteredEvents
  );

  const selectedDayEvents = getEventsForDay(
    filteredEvents,
    selectedDay,
    viewMonth,
    viewYear
  );

  const totalScheduled =
    getMonthlyEventTotal(monthEvents);

  const resetForm = (selectedDate: number) => {
    setEditingEvent(null);
    setTitleValue("");
    setAmount("");
    setDay(String(selectedDate));
    setType(defaultEventType);
    setRepeat("never");
    setNotes("");
  };

  const openNewEvent = () => {
    resetForm(selectedDay);
    setModalOpen(true);
  };

  const openDayEvent = (selectedDate: number) => {
    setSelectedDay(selectedDate);
    resetForm(selectedDate);
    setModalOpen(true);
  };

  const openEditEvent = (
    event: CalendarEvent
  ) => {
    setEditingEvent(event);
    setTitleValue(event.title);

    setAmount(
      event.amount !== undefined
        ? String(event.amount)
        : ""
    );

    setDay(String(event.day));
    setType(event.type);
    setRepeat(event.repeat ?? "never");
    setNotes(event.notes ?? "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
  };

  const saveEvent = async () => {
    if (!titleValue.trim()) {
      return;
    }

    const cleanDay = Math.min(
      Math.max(Number(day) || 1, 1),
      31
    );

    const eventData: CalendarEvent = {
      id:
        editingEvent?.id ??
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
      title: titleValue.trim(),
      amount: amount.trim()
        ? Number(amount) || 0
        : undefined,
      day: cleanDay,
      month: viewMonth,
      year: viewYear,
      type,
      repeat,
      notes: notes.trim() || undefined,
      sourceType,
      sourceId,
      completed: editingEvent?.completed ?? false,
      createdAt:
        editingEvent?.createdAt ??
        new Date().toISOString(),
    };

    if (editingEvent) {
      await updateCalendarEvent(eventData);
    } else {
      await addCalendarEvent(eventData);
    }

    setSelectedDay(cleanDay);
    closeModal();
    forceUpdate((previous) => previous + 1);
  };

  const removeEvent = async () => {
    if (!editingEvent) {
      return;
    }

    await deleteCalendarEvent(editingEvent.id);

    closeModal();
    forceUpdate((previous) => previous + 1);
  };

  const previousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((previous) => previous - 1);
      return;
    }

    setViewMonth((previous) => previous - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((previous) => previous + 1);
      return;
    }

    setViewMonth((previous) => previous + 1);
  };

  return (
    <>
      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              {title}
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="muted">
                {subtitle}
              </AppText>
            </View>
          </View>

          <AppButton
            title="Add Event"
            onPress={openNewEvent}
          />
        </AppRow>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Today"
            value={String(todaysEvents.length)}
            caption="Events"
            tone={
              todaysEvents.length > 0
                ? "warning"
                : "success"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Scheduled"
            value={formatMoney(totalScheduled)}
            caption="This month"
            tone="primary"
          />
        </View>
      </View>

      <CalendarFilters
        activeFilter={activeFilter}
        onChange={setActiveFilter}
      />

      <CalendarMonth
        events={filteredEvents}
        month={viewMonth}
        year={viewYear}
        onPreviousMonth={previousMonth}
        onNextMonth={nextMonth}
        onSelectDay={setSelectedDay}
      />

      <CalendarDayDetails
        day={selectedDay}
        month={viewMonth}
        year={viewYear}
        events={selectedDayEvents}
        onAdd={() => openDayEvent(selectedDay)}
        onOpenEvent={openEditEvent}
      />

      <AppCard>
        <AppText variant="section">
          Upcoming
        </AppText>

        {upcomingEvents.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState message="No upcoming events yet." />
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 10 }}>
            {upcomingEvents.map((event) => (
              <CalendarDayDetails
                key={event.id}
                day={event.day}
                month={
                  event.month ?? viewMonth
                }
                year={event.year ?? viewYear}
                events={[event]}
                onAdd={() =>
                  openDayEvent(event.day)
                }
                onOpenEvent={openEditEvent}
              />
            ))}
          </View>
        )}
      </AppCard>

      <CalendarEventModal
        visible={modalOpen}
        event={editingEvent}
        title={titleValue}
        amount={amount}
        day={day}
        type={type}
        repeat={repeat}
        notes={notes}
        setTitle={setTitleValue}
        setAmount={(value) =>
          setAmount(cleanAmount(value))
        }
        setDay={setDay}
        setType={setType}
        setRepeat={setRepeat}
        setNotes={setNotes}
        onSave={saveEvent}
        onDelete={removeEvent}
        onClose={closeModal}
      />
    </>
  );
}