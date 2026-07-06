import ProgressBar from "@/components/budget/ProgressBar";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";

import { getPlanData, setPlanData } from "@/lib/planStore";
import type { Goal, GoalCollection, GoalMilestone } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

const goalTemplates = [
  { emoji: "🚨", name: "Emergency Fund", note: "Recommended: 3–6 months of expenses." },
  { emoji: "🏡", name: "House", note: "Down payment, closing costs, repairs, and furniture." },
  { emoji: "🚗", name: "Vehicle", note: "Save for a down payment or full cash purchase." },
  { emoji: "✈️", name: "Vacation", note: "Flights, hotel, spending money, and travel extras." },
  { emoji: "🎓", name: "Education", note: "Tuition, books, fees, certifications, or courses." },
  { emoji: "💼", name: "Business", note: "Startup money, licenses, equipment, or inventory." },
  { emoji: "💍", name: "Wedding", note: "Venue, outfits, photography, honeymoon, and more." },
  { emoji: "✨", name: "Custom Goal", note: "Create your own Future You goal." },
];

export default function GoalsTab() {
  const { colors } = useTheme();
  const [plan, setPlan] = useState(getPlanData());

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [extraGoal, setExtraGoal] = useState<Goal | null>(null);

  const [emoji, setEmoji] = useState("✨");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [monthly, setMonthly] = useState("");
  const [notes, setNotes] = useState("");
  const [collectionId, setCollectionId] = useState<string | null>(null);

  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);

  const [collectionName, setCollectionName] = useState("");
  const [extraAmount, setExtraAmount] = useState("");

  const goals = plan.goals.filter((goal) => !goal.archived);
  const archivedGoals = plan.goals.filter((goal) => goal.archived);
  const completedGoals = goals.filter(
    (goal) => goal.target > 0 && goal.current >= goal.target
  );
  const activeGoals = goals.filter(
    (goal) => goal.target <= 0 || goal.current < goal.target
  );
  const collections = plan.goalCollections ?? [];

  const totalMonthly = activeGoals.reduce((sum, goal) => sum + goal.monthly, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.current, 0);
  const overallPercent = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const closestGoal = [...activeGoals].sort((a, b) => getRemaining(a) - getRemaining(b))[0];

  const saveUpdatedPlan = async (
    updatedGoals: Goal[],
    updatedCollections = collections
  ) => {
    const updatedPlan = {
      ...plan,
      goals: updatedGoals,
      goalCollections: updatedCollections,
      goalContributions: updatedGoals
        .filter((goal) => !goal.archived)
        .reduce((sum, goal) => sum + goal.monthly, 0),
    };

    setPlan(updatedPlan);
    await setPlanData(updatedPlan);
  };

  const resetGoalForm = () => {
    setSelectedGoal(null);
    setEmoji("✨");
    setName("");
    setTarget("");
    setCurrent("");
    setMonthly("");
    setNotes("");
    setCollectionId(null);
    setMilestones([]);
    setMilestoneName("");
    setMilestoneAmount("");
    setGoalModalOpen(false);
  };

  const openNewGoal = (template?: { emoji: string; name: string; note: string }) => {
    setSelectedGoal(null);
    setEmoji(template?.emoji ?? "✨");
    setName(template?.name === "Custom Goal" ? "" : template?.name ?? "");
    setTarget("");
    setCurrent("");
    setMonthly("");
    setNotes(template?.note ?? "");
    setCollectionId(null);
    setMilestones([]);
    setGoalModalOpen(true);
  };

  const openEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setEmoji(goal.emoji);
    setName(goal.name);
    setTarget(String(goal.target));
    setCurrent(String(goal.current));
    setMonthly(String(goal.monthly));
    setNotes(goal.notes ?? "");
    setCollectionId(goal.collectionId ?? null);
    setMilestones(goal.milestones ?? []);
    setGoalModalOpen(true);
  };

  const saveGoal = async () => {
    if (!name.trim()) return;

    const goalData: Goal = {
      id: selectedGoal?.id ?? Date.now().toString(),
      emoji: emoji || "✨",
      name: name.trim(),
      target: Number(target) || 0,
      current: Number(current) || 0,
      monthly: Number(monthly) || 0,
      notes: notes.trim(),
      collectionId,
      milestones,
      archived: selectedGoal?.archived ?? false,
    };

    const updatedGoals = selectedGoal
      ? plan.goals.map((goal) => (goal.id === selectedGoal.id ? goalData : goal))
      : [...plan.goals, goalData];

    await saveUpdatedPlan(updatedGoals);
    resetGoalForm();
  };

  const archiveGoal = async (goal: Goal) => {
    await saveUpdatedPlan(
      plan.goals.map((item) =>
        item.id === goal.id ? { ...item, archived: true } : item
      )
    );
  };

  const restoreGoal = async (goal: Goal) => {
    await saveUpdatedPlan(
      plan.goals.map((item) =>
        item.id === goal.id ? { ...item, archived: false } : item
      )
    );
  };

  const deleteGoal = async (goal: Goal) => {
    await saveUpdatedPlan(
      plan.goals.filter((item) => item.id !== goal.id)
    );
  };

  const addMilestone = () => {
    if (!milestoneName.trim()) return;

    setMilestones((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: milestoneName.trim(),
        amount: Number(milestoneAmount) || 0,
      },
    ]);

    setMilestoneName("");
    setMilestoneAmount("");
  };

  const saveCollection = async () => {
    if (!collectionName.trim()) return;

    const updatedCollections: GoalCollection[] = [
      ...collections,
      { id: Date.now().toString(), name: collectionName.trim() },
    ];

    setCollectionName("");
    setCollectionModalOpen(false);
    await saveUpdatedPlan(plan.goals, updatedCollections);
  };

  const contributeExtra = async () => {
    if (!extraGoal) return;

    const amount = Number(extraAmount) || 0;
    if (amount <= 0) return;

    const updatedGoals = plan.goals.map((goal) =>
      goal.id === extraGoal.id
        ? { ...goal, current: goal.current + amount }
        : goal
    );

    setExtraGoal(null);
    setExtraAmount("");
    await saveUpdatedPlan(updatedGoals);
  };

  const standaloneGoals = activeGoals.filter((goal) => !goal.collectionId);
  const insights = getGoalInsights(activeGoals, completedGoals, closestGoal, totalMonthly);

  return (
    <AppPage>
      <PageHeader
        title="Goals"
        subtitle="Build the version of you that already has the money ready."
      />

      <AppCard>
        <AppText variant="muted">Future You Progress</AppText>

        <Text
          style={{
            color: colors.primary,
            fontSize: 46,
            fontWeight: "bold",
            marginTop: 4,
          }}
        >
          {overallPercent.toFixed(0)}%
        </Text>

        <ProgressBar percent={overallPercent} />

        <AppText variant="muted">
          ${totalSaved.toFixed(0)} saved of ${totalTarget.toFixed(0)}
        </AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Saved"
            value={`$${totalSaved.toFixed(0)}`}
            caption="Across all goals"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Monthly"
            value={`$${totalMonthly.toFixed(0)}`}
            caption="Planned contributions"
            tone="primary"
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Active"
            value={`${activeGoals.length}`}
            caption="Goals in progress"
            tone="warning"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Completed"
            value={`${completedGoals.length}`}
            caption="Finished goals"
            tone="success"
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="Add Goal" onPress={() => openNewGoal()} />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton
            title="Add Collection"
            onPress={() => setCollectionModalOpen(true)}
            variant="outline"
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Smart Insights</AppText>

        <View style={{ marginTop: 10, gap: 8 }}>
          {insights.map((insight) => (
            <AppText key={insight} variant="muted">
              {insight}
            </AppText>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Goal Templates</AppText>

        <View style={{ marginTop: 12, gap: 10 }}>
          {goalTemplates.map((template) => (
            <Pressable
              key={template.name}
              onPress={() => openNewGoal(template)}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                backgroundColor: colors.card,
              }}
            >
              <AppText variant="bold">
                {template.emoji} {template.name}
              </AppText>
              <AppText variant="muted">{template.note}</AppText>
            </Pressable>
          ))}
        </View>
      </AppCard>

      {collections.map((collection) => {
        const collectionGoals = activeGoals.filter(
          (goal) => goal.collectionId === collection.id
        );

        if (collectionGoals.length === 0) return null;

        const collectionTarget = collectionGoals.reduce(
          (sum, goal) => sum + goal.target,
          0
        );
        const collectionSaved = collectionGoals.reduce(
          (sum, goal) => sum + goal.current,
          0
        );
        const collectionPercent =
          collectionTarget > 0
            ? Math.min((collectionSaved / collectionTarget) * 100, 100)
            : 0;

        return (
          <AppCard key={collection.id}>
            <AppRow>
              <View>
                <AppText variant="section">{collection.name}</AppText>
                <AppText variant="muted">
                  {collectionGoals.length} goal
                  {collectionGoals.length === 1 ? "" : "s"}
                </AppText>
              </View>

              <AppText variant="bold">{collectionPercent.toFixed(0)}%</AppText>
            </AppRow>

            <ProgressBar percent={collectionPercent} />

            <View style={{ marginTop: 10, gap: 12 }}>
              {collectionGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => openEditGoal(goal)}
                  onArchive={() => archiveGoal(goal)}
                  onContribute={() => setExtraGoal(goal)}
                />
              ))}
            </View>
          </AppCard>
        );
      })}

      <AppCard>
        <AppText variant="section">Standalone Goals</AppText>

        {standaloneGoals.length === 0 ? (
          <View style={{ marginTop: 8 }}>
            <EmptyState message="No standalone goals yet. Add one or use a template to start." />
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 12 }}>
            {standaloneGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEditGoal(goal)}
                onArchive={() => archiveGoal(goal)}
                onContribute={() => setExtraGoal(goal)}
              />
            ))}
          </View>
        )}
      </AppCard>

      {completedGoals.length > 0 ? (
        <AppCard>
          <AppText variant="section">Completed Goals</AppText>

          <View style={{ marginTop: 12, gap: 12 }}>
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEditGoal(goal)}
                onArchive={() => archiveGoal(goal)}
                onContribute={() => setExtraGoal(goal)}
              />
            ))}
          </View>
        </AppCard>
      ) : null}

      {archivedGoals.length > 0 ? (
        <AppCard>
          <AppText variant="section">Archived Goals</AppText>

          <View style={{ marginTop: 12, gap: 12 }}>
            {archivedGoals.map((goal) => (
              <ArchivedGoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEditGoal(goal)}
                onRestore={() => restoreGoal(goal)}
                onDelete={() => deleteGoal(goal)}
              />
            ))}
          </View>
        </AppCard>
      ) : null}

      <GoalModal
        visible={goalModalOpen}
        selectedGoal={selectedGoal}
        emoji={emoji}
        name={name}
        target={target}
        current={current}
        monthly={monthly}
        notes={notes}
        collectionId={collectionId}
        collections={collections}
        milestones={milestones}
        milestoneName={milestoneName}
        milestoneAmount={milestoneAmount}
        setEmoji={setEmoji}
        setName={setName}
        setTarget={setTarget}
        setCurrent={setCurrent}
        setMonthly={setMonthly}
        setNotes={setNotes}
        setCollectionId={setCollectionId}
        setMilestoneName={setMilestoneName}
        setMilestoneAmount={setMilestoneAmount}
        addMilestone={addMilestone}
        removeMilestone={(id) =>
          setMilestones((prev) => prev.filter((milestone) => milestone.id !== id))
        }
        onSave={saveGoal}
        onClose={resetGoalForm}
      />

      <SimpleModal
        visible={collectionModalOpen}
        title="Add Collection"
        onClose={() => setCollectionModalOpen(false)}
      >
        <AppInput
          placeholder="Collection Name"
          value={collectionName}
          onChangeText={setCollectionName}
        />

        <View style={{ marginTop: 12 }}>
          <AppButton title="Save Collection" onPress={saveCollection} />
        </View>
      </SimpleModal>

      <SimpleModal
        visible={extraGoal !== null}
        title="Contribute Extra"
        onClose={() => setExtraGoal(null)}
      >
        <AppText variant="bold">
          {extraGoal?.emoji} {extraGoal?.name}
        </AppText>

        <View style={{ marginTop: 12 }}>
          <AppInput
            placeholder="Extra Amount"
            value={extraAmount}
            onChangeText={setExtraAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <AppButton title="Add Contribution" onPress={contributeExtra} />
        </View>
      </SimpleModal>
    </AppPage>
  );
}

function ArchivedGoalCard({
  goal,
  onEdit,
  onRestore,
  onDelete,
}: {
  goal: Goal;
  onEdit: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <AppRow>
        <View style={{ flex: 1 }}>
          <AppText variant="bold">
            {goal.emoji} {goal.name}
          </AppText>
          <AppText variant="muted">
            Archived • ${goal.current.toFixed(0)} saved of ${goal.target.toFixed(0)}
          </AppText>
        </View>
      </AppRow>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="Edit" onPress={onEdit} variant="outline" />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton title="Restore" onPress={onRestore} variant="outline" />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton title="Delete" onPress={onDelete} variant="outline" />
        </View>
      </View>
    </View>
  );
}

function GoalCard({
  goal,
  onEdit,
  onArchive,
  onContribute,
}: {
  goal: Goal;
  onEdit: () => void;
  onArchive: () => void;
  onContribute: () => void;
}) {
  const { colors } = useTheme();

  const percent =
    goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;

  const remaining = getRemaining(goal);
  const monthsRemaining =
    goal.monthly > 0 ? Math.ceil(remaining / goal.monthly) : null;

  const health =
    goal.target > 0 && goal.current >= goal.target
      ? { label: "Complete", tone: colors.success }
      : goal.monthly <= 0
      ? { label: "Paused", tone: colors.danger }
      : monthsRemaining !== null && monthsRemaining <= 24
      ? { label: "On Track", tone: colors.success }
      : { label: "Long Term", tone: colors.warning };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <AppRow>
        <AppText variant="bold">
          {goal.emoji} {goal.name}
        </AppText>

        <Text style={{ color: health.tone, fontWeight: "bold" }}>
          {health.label}
        </Text>
      </AppRow>

      <View style={{ marginTop: 8 }}>
        <AppText variant="muted">
          ${goal.current.toFixed(0)} / ${goal.target.toFixed(0)}
        </AppText>
      </View>

      <ProgressBar percent={percent} />

      <AppRow>
        <AppText variant="muted">{percent.toFixed(0)}% complete</AppText>
        <AppText variant="muted">${remaining.toFixed(0)} left</AppText>
      </AppRow>

      <View style={{ marginTop: 6 }}>
        <AppText variant="muted">
          {monthsRemaining !== null
            ? `Estimated finish: ${monthsRemaining} month${
                monthsRemaining === 1 ? "" : "s"
              }`
            : "Add a monthly contribution to calculate an ETA."}
        </AppText>
      </View>

      {goal.milestones && goal.milestones.length > 0 ? (
        <View style={{ marginTop: 12, gap: 6 }}>
          <AppText variant="bold">Milestones</AppText>

          {goal.milestones.map((milestone) => {
            const reached = goal.current >= milestone.amount;
            const left = Math.max(milestone.amount - goal.current, 0);

            return (
              <AppText key={milestone.id} variant="muted">
                {reached ? "✓" : "○"} {milestone.name}
                {reached ? "" : ` — $${left.toFixed(0)} left`}
              </AppText>
            );
          })}
        </View>
      ) : null}

      {goal.notes ? (
        <View style={{ marginTop: 10 }}>
          <AppText variant="muted">{goal.notes}</AppText>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="+ Extra" onPress={onContribute} variant="outline" />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton title="Edit" onPress={onEdit} variant="outline" />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton title="Archive" onPress={onArchive} variant="outline" />
        </View>
      </View>
    </View>
  );
}

function GoalModal(props: {
  visible: boolean;
  selectedGoal: Goal | null;
  emoji: string;
  name: string;
  target: string;
  current: string;
  monthly: string;
  notes: string;
  collectionId: string | null;
  collections: GoalCollection[];
  milestones: GoalMilestone[];
  milestoneName: string;
  milestoneAmount: string;
  setEmoji: (value: string) => void;
  setName: (value: string) => void;
  setTarget: (value: string) => void;
  setCurrent: (value: string) => void;
  setMonthly: (value: string) => void;
  setNotes: (value: string) => void;
  setCollectionId: (value: string | null) => void;
  setMilestoneName: (value: string) => void;
  setMilestoneAmount: (value: string) => void;
  addMilestone: () => void;
  removeMilestone: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <SimpleModal
      visible={props.visible}
      title={props.selectedGoal ? "Edit Goal" : "Add Goal"}
      onClose={props.onClose}
    >
      <ScrollView style={{ maxHeight: 620 }}>
        <AppInput placeholder="Emoji" value={props.emoji} onChangeText={props.setEmoji} />
        <View style={{ height: 10 }} />
        <AppInput placeholder="Goal Name" value={props.name} onChangeText={props.setName} />
        <View style={{ height: 10 }} />
        <AppInput placeholder="Target Amount" value={props.target} onChangeText={props.setTarget} keyboardType="numeric" />
        <View style={{ height: 10 }} />
        <AppInput placeholder="Current Saved" value={props.current} onChangeText={props.setCurrent} keyboardType="numeric" />
        <View style={{ height: 10 }} />
        <AppInput placeholder="Monthly Contribution" value={props.monthly} onChangeText={props.setMonthly} keyboardType="numeric" />

        <View style={{ marginTop: 14, gap: 8 }}>
          <AppText variant="bold">Collection</AppText>

          <AppButton
            title="No Collection"
            onPress={() => props.setCollectionId(null)}
            variant={props.collectionId === null ? "primary" : "outline"}
          />

          {props.collections.map((collection) => (
            <AppButton
              key={collection.id}
              title={collection.name}
              onPress={() => props.setCollectionId(collection.id)}
              variant={props.collectionId === collection.id ? "primary" : "outline"}
            />
          ))}
        </View>

        <View style={{ marginTop: 14 }}>
          <AppInput placeholder="Notes" value={props.notes} onChangeText={props.setNotes} />
        </View>

        <View style={{ marginTop: 14, gap: 8 }}>
          <AppText variant="bold">Milestones</AppText>

          {props.milestones.map((milestone) => (
            <AppRow key={milestone.id}>
              <AppText variant="muted">
                {milestone.name}: ${milestone.amount}
              </AppText>

              <Pressable onPress={() => props.removeMilestone(milestone.id)}>
                <AppText variant="muted">Remove</AppText>
              </Pressable>
            </AppRow>
          ))}

          <AppInput
            placeholder="Milestone Name"
            value={props.milestoneName}
            onChangeText={props.setMilestoneName}
          />

          <AppInput
            placeholder="Milestone Amount"
            value={props.milestoneAmount}
            onChangeText={props.setMilestoneAmount}
            keyboardType="numeric"
          />

          <AppButton title="Add Milestone" onPress={props.addMilestone} variant="outline" />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton title="Save Goal" onPress={props.onSave} />
          <AppButton title="Cancel" onPress={props.onClose} variant="outline" />
        </View>
      </ScrollView>
    </SimpleModal>
  );
}

function SimpleModal({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { colors, theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,.45)",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: theme.radius.card,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <AppRow>
            <AppText variant="section">{title}</AppText>

            <Pressable onPress={onClose}>
              <AppText variant="muted">Close</AppText>
            </Pressable>
          </AppRow>

          <View style={{ marginTop: 16 }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

function getRemaining(goal: Goal) {
  return Math.max(goal.target - goal.current, 0);
}

function getGoalInsights(
  activeGoals: Goal[],
  completedGoals: Goal[],
  closestGoal: Goal | undefined,
  totalMonthly: number
) {
  const insights: string[] = [];

  if (activeGoals.length === 0) {
    insights.push("Add your first goal to start building Future You.");
    return insights;
  }

  if (closestGoal) {
    insights.push(`${closestGoal.name} is your closest active goal.`);
  }

  if (totalMonthly > 0) {
    insights.push(`You are putting $${totalMonthly.toFixed(0)} per month toward your future.`);
  } else {
    insights.push("Add monthly contributions so Future You can calculate finish dates.");
  }

  if (completedGoals.length > 0) {
    insights.push(`${completedGoals.length} goal${completedGoals.length === 1 ? "" : "s"} completed so far.`);
  }

  const paused = activeGoals.filter((goal) => goal.monthly <= 0).length;

  if (paused > 0) {
    insights.push(`${paused} active goal${paused === 1 ? " is" : "s are"} missing a monthly contribution.`);
  }

  return insights.slice(0, 4);
}