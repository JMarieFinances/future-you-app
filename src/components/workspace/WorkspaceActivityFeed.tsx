import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import {
    getWorkspaceActivity,
    subscribeToWorkspaceActivity,
    type ActivityType,
    type WorkspaceActivity,
} from "@/lib/activityStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

type ActivityFilter = "all" | ActivityType;

type ActivityWithProfile = WorkspaceActivity & {
  profile?: {
    display_name?: string | null;
  } | null;
};

type Props = {
  workspaceId: string;
  workspaceLabel: string;
};

export default function WorkspaceActivityFeed({
  workspaceId,
  workspaceLabel,
}: Props) {
  const [activity, setActivity] = useState<ActivityWithProfile[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadActivity = useCallback(
    async (showLoading = false) => {
      if (!workspaceId) {
        setActivity([]);
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setErrorMessage("");

      try {
        const loaded = await getWorkspaceActivity(workspaceId);
        setActivity((loaded ?? []) as ActivityWithProfile[]);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load workspace activity."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    loadActivity(true);
  }, [loadActivity]);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    return subscribeToWorkspaceActivity(workspaceId, () => {
      loadActivity(false);
    });
  }, [workspaceId, loadActivity]);

  const filteredActivity = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return activity.filter((item) => {
      if (filter !== "all" && item.type !== filter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        item.title,
        item.description,
        item.type,
        item.profile?.display_name,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [activity, filter, search]);

  const groupedActivity = useMemo(() => {
    const groups: Record<string, ActivityWithProfile[]> = {};

    filteredActivity.forEach((item) => {
      const label = getDateGroup(item.created_at);

      if (!groups[label]) {
        groups[label] = [];
      }

      groups[label].push(item);
    });

    return Object.entries(groups);
  }, [filteredActivity]);

  return (
    <>
      <AppCard glass>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              {workspaceLabel} Activity
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">{activity.length}</AppText>
            </View>

            <AppText variant="muted">
              Recorded changes and updates
            </AppText>
          </View>

          <AppButton
            title="Refresh"
            variant="outline"
            loading={refreshing}
            onPress={() => loadActivity(false)}
          />
        </AppRow>
      </AppCard>

      <AppCard>
        <AppText variant="section">Search and Filter</AppText>

        <View
          style={{
            marginTop: 12,
            gap: 12,
          }}
        >
          <AppInput
            placeholder="Search activity"
            value={search}
            onChangeText={setSearch}
          />

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <FilterChip
              label="All"
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />

            <FilterChip
              label="Transactions"
              active={filter === "transaction"}
              onPress={() => setFilter("transaction")}
            />

            <FilterChip
              label="Messages"
              active={filter === "message"}
              onPress={() => setFilter("message")}
            />

            <FilterChip
              label="Members"
              active={filter === "member"}
              onPress={() => setFilter("member")}
            />

            <FilterChip
              label="Calendar"
              active={filter === "calendar"}
              onPress={() => setFilter("calendar")}
            />

            <FilterChip
              label="Budget"
              active={filter === "budget"}
              onPress={() => setFilter("budget")}
            />

            <FilterChip
              label="Goals"
              active={filter === "goal"}
              onPress={() => setFilter("goal")}
            />
          </View>
        </View>
      </AppCard>

      {loading ? (
        <AppCard>
          <AppText variant="muted">
            Loading workspace activity...
          </AppText>
        </AppCard>
      ) : null}

      {!loading && errorMessage ? (
        <AppCard>
          <AppText variant="section">
            Activity could not be loaded
          </AppText>

          <View style={{ marginTop: 6 }}>
            <AppText variant="muted">{errorMessage}</AppText>
          </View>

          <View style={{ marginTop: 14 }}>
            <AppButton
              title="Try Again"
              onPress={() => loadActivity(false)}
            />
          </View>
        </AppCard>
      ) : null}

      {!loading &&
      !errorMessage &&
      filteredActivity.length === 0 ? (
        <AppCard>
          <EmptyState
            message={
              activity.length === 0
                ? "Nothing has happened in this workspace yet."
                : "No activity matches the current search and filter."
            }
          />
        </AppCard>
      ) : null}

      {!loading && !errorMessage
        ? groupedActivity.map(([group, items]) => (
            <AppCard key={group}>
              <AppText variant="section">{group}</AppText>

              <View
                style={{
                  marginTop: 14,
                  gap: 14,
                }}
              >
                {items.map((item, index) => (
                  <ActivityRow
                    key={item.id}
                    activity={item}
                    showDivider={index < items.length - 1}
                  />
                ))}
              </View>
            </AppCard>
          ))
        : null}
    </>
  );
}

function ActivityRow({
  activity,
  showDivider,
}: {
  activity: ActivityWithProfile;
  showDivider: boolean;
}) {
  const memberName =
    activity.profile?.display_name ?? "Workspace member";

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
            width: 42,
            height: 42,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: getActivityBackground(activity.type),
          }}
        >
          <AppText variant="bold">
            {getActivitySymbol(activity.type)}
          </AppText>
        </View>

        <View style={{ flex: 1 }}>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="bold">{activity.title}</AppText>

              <AppText variant="muted">
                {memberName} · {formatTime(activity.created_at)}
              </AppText>
            </View>

            {activity.amount !== undefined &&
            activity.amount !== null ? (
              <AppText variant="bold">
                {formatMoney(Number(activity.amount))}
              </AppText>
            ) : null}
          </AppRow>

          {activity.description ? (
            <View style={{ marginTop: 6 }}>
              <AppText variant="muted">
                {activity.description}
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
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />
      ) : null}
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 9,
        paddingHorizontal: 13,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active
          ? "rgba(255,255,255,0.22)"
          : "rgba(255,255,255,0.08)",
        backgroundColor: active
          ? "rgba(255,255,255,0.12)"
          : "transparent",
        opacity: pressed ? 0.68 : 1,
      })}
    >
      <AppText variant={active ? "bold" : "muted"}>
        {label}
      </AppText>
    </Pressable>
  );
}

function getActivitySymbol(type: ActivityType) {
  if (type === "transaction") return "$";
  if (type === "message") return "M";
  if (type === "member") return "P";
  if (type === "calendar") return "C";
  if (type === "goal") return "G";
  return "B";
}

function getActivityBackground(type: ActivityType) {
  if (type === "transaction") {
    return "rgba(34,197,94,0.12)";
  }

  if (type === "message") {
    return "rgba(59,130,246,0.12)";
  }

  if (type === "member") {
    return "rgba(168,85,247,0.12)";
  }

  if (type === "calendar") {
    return "rgba(245,158,11,0.12)";
  }

  if (type === "goal") {
    return "rgba(234,179,8,0.12)";
  }

  return "rgba(255,255,255,0.08)";
}

function getDateGroup(value: string) {
  const date = startOfDay(new Date(value));
  const today = startOfDay(new Date());

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) {
    return "Today";
  }

  if (date.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year:
      date.getFullYear() !== today.getFullYear()
        ? "numeric"
        : undefined,
  });
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}