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
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { loadAppData } from "@/lib/appStore";
import {
  addCalendarEvent,
  CalendarEvent,
  CalendarEventType,
  CalendarRepeat,
  deleteCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
} from "@/lib/calendarStore";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function FinancialCalendarScreen() {
  const [isReady, setIsReady] = useState(false);
const [, forceUpdate] = useState(0);;

  const now = new Date();

  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const [type, setType] = useState<CalendarEventType>("bill");
  const [repeat, setRepeat] = useState<CalendarRepeat>("never");
  const [notes, setNotes] = useState("");

  useEffect(() => {
  const load = async () => {
    await loadAppData();
    forceUpdate((prev) => prev + 1);
    setIsReady(true);
  };

  load();
}, []);

  const events = getCalendarEvents();
  const filteredEvents = filterEvents(events, activeFilter);

  const monthEvents = getEventsForMonth(filteredEvents, viewMonth, viewYear);
  const todaysEvents = getTodaysEvents(filteredEvents);
  const upcomingEvents = getUpcomingEvents(filteredEvents);

  const selectedDayEvents = getEventsForDay(
    filteredEvents,
    selectedDay,
    viewMonth,
    viewYear
  );

  const totalScheduled = getMonthlyEventTotal(monthEvents);

  const openNewEvent = () => {
    setEditingEvent(null);
    setTitle("");
    setAmount("");
    setDay(String(selectedDay));
    setType("bill");
    setRepeat("monthly");
    setNotes("");
    setModalOpen(true);
  };

  const openDayEvent = (selected: number) => {
    setSelectedDay(selected);
    setEditingEvent(null);
    setTitle("");
    setAmount("");
    setDay(String(selected));
    setType("bill");
    setRepeat("monthly");
    setNotes("");
    setModalOpen(true);
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setAmount(event.amount !== undefined ? String(event.amount) : "");
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
    if (!title.trim()) return;

    const cleanDay = Math.min(Math.max(Number(day) || 1, 1), 31);

    const eventData: CalendarEvent = {
      id: editingEvent?.id ?? Date.now().toString(),
      title: title.trim(),
      amount: amount.trim() ? Number(amount) || 0 : undefined,
      day: cleanDay,
      month: viewMonth,
      year: viewYear,
      type,
      repeat,
      notes: notes.trim(),
      sourceType: editingEvent?.sourceType ?? "system",
      sourceId: editingEvent?.sourceId,
    };

    if (editingEvent) {
      await updateCalendarEvent(eventData);
    } else {
      await addCalendarEvent(eventData);
    }

    setSelectedDay(cleanDay);
    closeModal();
    forceUpdate((prev) => prev + 1);
  };

  const removeEvent = async () => {
    if (!editingEvent) return;

    await deleteCalendarEvent(editingEvent.id);
    closeModal();
    forceUpdate((prev) => prev + 1);
  };

  const previousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  if (!isReady) {
  return <AppPage />;
}

  return (
    <AppPage>
      <PageHeader
        title="Financial Calendar"
        subtitle="Track paydays, bills, goals, reviews, and money reminders."
      />

      <AppCard>
        <AppText variant="muted">This Month</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">{monthEvents.length} Events</AppText>
        </View>

        <AppText variant="muted">
          Filter your month, tap a day, and manage reminders from one place.
        </AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Today"
            value={`${todaysEvents.length}`}
            caption="Events"
            tone={todaysEvents.length > 0 ? "warning" : "success"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Scheduled"
            value={`$${totalScheduled.toFixed(0)}`}
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

      <AppButton title="Add Calendar Event" onPress={openNewEvent} />

      <AppCard>
        <AppText variant="section">Today</AppText>

        {todaysEvents.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <AppText variant="muted">Nothing scheduled for today.</AppText>
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 10 }}>
            {todaysEvents.map((event) => (
              <CalendarDayDetails
                key={event.id}
                day={event.day}
                month={viewMonth}
                year={viewYear}
                events={[event]}
                onAdd={() => openDayEvent(event.day)}
                onOpenEvent={openEditEvent}
              />
            ))}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">Upcoming</AppText>

        {upcomingEvents.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <AppText variant="muted">No upcoming events yet.</AppText>
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 10 }}>
            {upcomingEvents.map((event) => (
              <CalendarDayDetails
                key={event.id}
                day={event.day}
                month={viewMonth}
                year={viewYear}
                events={[event]}
                onAdd={() => openDayEvent(event.day)}
                onOpenEvent={openEditEvent}
              />
            ))}
          </View>
        )}
      </AppCard>

      <CalendarEventModal
        visible={modalOpen}
        event={editingEvent}
        title={title}
        amount={amount}
        day={day}
        type={type}
        repeat={repeat}
        notes={notes}
        setTitle={setTitle}
        setAmount={setAmount}
        setDay={setDay}
        setType={setType}
        setRepeat={setRepeat}
        setNotes={setNotes}
        onSave={saveEvent}
        onDelete={removeEvent}
        onClose={closeModal}
      />
    </AppPage>
  );
}