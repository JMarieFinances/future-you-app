import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import {
    getWorkspaceActivity,
    subscribeToWorkspaceActivity,
    type WorkspaceActivity,
} from "@/lib/activityStore";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

type Props = {
  workspaceId: string;
  limit?: number;
  onSeeAll?: () => void;
};

type ActivityWithProfile = WorkspaceActivity & {
  profile?: {
    display_name?: string | null;
  } | null;
};

export default function RecentActivityCard({
  workspaceId,
  limit = 5,
  onSeeAll,
}: Props) {
  const [activity, setActivity] = useState<
    ActivityWithProfile[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

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
        const loadedActivity =
          await getWorkspaceActivity(workspaceId);

        setActivity(
          (loadedActivity ?? []).slice(
            0,
            limit
          ) as ActivityWithProfile[]
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load recent activity."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId, limit]
  );

  useEffect(() => {
    loadActivity(true);
  }, [loadActivity]);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    return subscribeToWorkspaceActivity(
      workspaceId,
      () => {
        loadActivity(false);
      }
    );
  }, [workspaceId, loadActivity]);

  return (
    <AppCard>
      <AppRow>
        <View style={{ flex: 1 }}>
          <AppText variant="section">
            Recent Activity
          </AppText>

          <AppText variant="muted">
            Latest changes in this workspace
          </AppText>
        </View>

        {onSeeAll ? (
          <AppButton
            title="See All"
            variant="outline"
            onPress={onSeeAll}
          />
        ) : (
          <AppButton
            title="Refresh"
            variant="outline"
            loading={refreshing}
            onPress={() =>
              loadActivity(false)
            }
          />
        )}
      </AppRow>

      {loading ? (
        <View style={{ marginTop: 14 }}>
          <AppText variant="muted">
            Loading recent activity...
          </AppText>
        </View>
      ) : null}

      {!loading && errorMessage ? (
        <View style={{ marginTop: 14 }}>
          <AppText variant="bold">
            Activity could not be loaded
          </AppText>

          <View style={{ marginTop: 5 }}>
            <AppText variant="muted">
              {errorMessage}
            </AppText>
          </View>

          <View style={{ marginTop: 12 }}>
            <AppButton
              title="Try Again"
              onPress={() =>
                loadActivity(false)
              }
            />
          </View>
        </View>
      ) : null}

      {!loading &&
      !errorMessage &&
      activity.length === 0 ? (
        <View style={{ marginTop: 14 }}>
          <EmptyState message="Nothing has happened in this workspace yet." />
        </View>
      ) : null}

      {!loading &&
      !errorMessage &&
      activity.length > 0 ? (
        <View
          style={{
            marginTop: 14,
            gap: 14,
          }}
        >
          {activity.map((item, index) => (
            <ActivityRow
              key={item.id}
              activity={item}
              showDivider={
                index < activity.length - 1
              }
            />
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

function ActivityRow({
  activity,
  showDivider,
}: {
  activity: ActivityWithProfile;
  showDivider: boolean;
}) {
  const author =
    activity.profile?.display_name ??
    "Workspace member";

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
            width: 38,
            height: 38,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              "rgba(255,255,255,0.08)",
          }}
        >
          <AppText variant="bold">
            {getActivitySymbol(activity.type)}
          </AppText>
        </View>

        <View style={{ flex: 1 }}>
          <AppText variant="bold">
            {activity.title}
          </AppText>

          {activity.description ? (
            <View style={{ marginTop: 3 }}>
              <AppText variant="muted">
                {activity.description}
              </AppText>
            </View>
          ) : null}

          {activity.amount !== undefined &&
          activity.amount !== null ? (
            <View style={{ marginTop: 5 }}>
              <AppText variant="bold">
                {formatMoney(
                  Number(activity.amount)
                )}
              </AppText>
            </View>
          ) : null}

          <View style={{ marginTop: 5 }}>
            <AppText variant="muted">
              {author} ·{" "}
              {formatRelativeTime(
                activity.created_at
              )}
            </AppText>
          </View>
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

function getActivitySymbol(
  type: WorkspaceActivity["type"]
) {
  if (type === "transaction") {
    return "$";
  }

  if (type === "message") {
    return "M";
  }

  if (type === "goal") {
    return "G";
  }

  if (type === "calendar") {
    return "C";
  }

  if (type === "member") {
    return "P";
  }

  return "B";
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRelativeTime(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !==
      now.getFullYear()
        ? "numeric"
        : undefined,
  });
}