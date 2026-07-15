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
  | "chat";

type Props = {
  title: string;
  subtitle?: string;
  backLabel: string;
  onBack: () => void;

  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;

  overview: ReactNode;
  budget: ReactNode;
  transactions: ReactNode;
  afford: ReactNode;
  calendar: ReactNode;
  members: ReactNode;
  chat: ReactNode;

  memberBadge?: number;
  chatBadge?: number;
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
  chat,
  memberBadge = 0,
  chatBadge = 0,
}: Props) {
  const tabs: WorkspaceTabOption<WorkspaceTab>[] = [
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
      key: "chat",
      label: "Chat",
      badge: chatBadge,
    },
  ];

  const contentByTab: Record<WorkspaceTab, ReactNode> = {
    overview,
    budget,
    transactions,
    afford,
    calendar,
    members,
    chat,
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
        activeTab={activeTab}
        onChange={onTabChange}
      />

      {contentByTab[activeTab]}
    </AppPage>
  );
}