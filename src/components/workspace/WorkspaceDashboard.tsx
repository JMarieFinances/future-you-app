import AppButton from "@/components/ui/AppButton";
import AppPage from "@/components/ui/AppPage";
import PageHeader from "@/components/ui/PageHeader";
import WorkspaceTabs, {
  type WorkspaceTabOption,
} from "@/components/workspace/WorkspaceTabs";
import type { ReactNode } from "react";

export type WorkspaceTab =
  | "overview"
  | "budget"
  | "transactions"
  | "afford"
  | "calendar"
  | "members"
  | "activity"
  | "chat";

type Props = {
  title: string;
  subtitle?: string;
  backLabel: string;
  onBack: () => void;

  activeTab: WorkspaceTab;
  onTabChange: (
    tab: WorkspaceTab
  ) => void;

  overview: ReactNode;
  budget: ReactNode;
  transactions: ReactNode;
  afford: ReactNode;
  calendar: ReactNode;
  members: ReactNode;

  activity?: ReactNode;
  chat?: ReactNode;

  memberBadge?: number;
  activityBadge?: number;
  chatBadge?: number;

  activityLabel?: string;
};

export default function WorkspaceDashboard({
  title,
  subtitle,
  backLabel,
  onBack,
  activeTab,
  onTabChange,
  overview,
  budget,
  transactions,
  afford,
  calendar,
  members,
  activity,
  chat,
  memberBadge = 0,
  activityBadge,
  chatBadge = 0,
  activityLabel = "Activity",
}: Props) {
  const collaborationContent =
    activity ?? chat ?? null;

  const collaborationBadge =
    activityBadge ?? chatBadge;

  const normalizedActiveTab: Exclude<
    WorkspaceTab,
    "chat"
  > =
    activeTab === "chat"
      ? "activity"
      : activeTab;

  const tabs: WorkspaceTabOption<
    Exclude<WorkspaceTab, "chat">
  >[] = [
    {
      key: "overview",
      label: "Overview",
    },
    {
      key: "budget",
      label: "Budget",
    },
    {
      key: "transactions",
      label: "Transactions",
    },
    {
      key: "afford",
      label: "Afford",
    },
    {
      key: "calendar",
      label: "Calendar",
    },
    {
      key: "members",
      label: "Members",
      badge: memberBadge,
    },
    {
      key: "activity",
      label: activityLabel,
      badge: collaborationBadge,
    },
  ];

  const contentByTab: Record<
    Exclude<WorkspaceTab, "chat">,
    ReactNode
  > = {
    overview,
    budget,
    transactions,
    afford,
    calendar,
    members,
    activity: collaborationContent,
  };

  const handleTabChange = (
    tab: Exclude<
      WorkspaceTab,
      "chat"
    >
  ) => {
    onTabChange(tab);
  };

  return (
    <AppPage>
      <AppButton
        title={backLabel}
        onPress={onBack}
        variant="outline"
      />

      <PageHeader
        title={title}
        subtitle={subtitle}
      />

      <WorkspaceTabs
        tabs={tabs}
        activeTab={
          normalizedActiveTab
        }
        onChange={handleTabChange}
      />

      {
        contentByTab[
          normalizedActiveTab
        ]
      }
    </AppPage>
  );
}