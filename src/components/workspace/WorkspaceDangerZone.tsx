import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";
import {
    deleteSharedWorkspace,
    leaveSharedWorkspace,
    type SharedWorkspace,
    type WorkspaceType,
} from "@/lib/sharedWorkspaceStore";
import { useState } from "react";
import {
    Alert,
    View,
} from "react-native";

type Props = {
  workspaceType: WorkspaceType;
  sharedWorkspace: SharedWorkspace;
  isOwner: boolean;
  onWorkspaceExit?: () => void;
};

export default function WorkspaceDangerZone({
  workspaceType,
  sharedWorkspace,
  isOwner,
  onWorkspaceExit,
}: Props) {
  const [processing, setProcessing] =
    useState(false);

  const workspaceLabel =
    workspaceType === "business"
      ? "Business"
      : "Household";

  const handleLeave = async () => {
    const confirmed =
      await confirmAction(
        `Leave ${workspaceLabel.toLowerCase()}?`,
        `You will lose access to ${sharedWorkspace.name}. The ${workspaceLabel.toLowerCase()} and its shared information will be removed from your account.`,
        `Leave ${workspaceLabel}`
      );

    if (!confirmed) {
      return;
    }

    setProcessing(true);

    try {
      await leaveSharedWorkspace(
        sharedWorkspace.id
      );

      showSuccess(
        `${workspaceLabel} left`,
        `You no longer have access to ${sharedWorkspace.name}.`,
        onWorkspaceExit
      );
    } catch (error) {
      showError(
        `Unable to leave ${workspaceLabel.toLowerCase()}`,
        error
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    const confirmed =
      await confirmAction(
        `Delete ${workspaceLabel.toLowerCase()}?`,
        `This permanently deletes ${sharedWorkspace.name} for every member. Its shared members, invitations, chat, activity, and workspace data may also be deleted. This cannot be undone.`,
        `Delete ${workspaceLabel}`
      );

    if (!confirmed) {
      return;
    }

    const finalConfirmation =
      await confirmAction(
        `Permanently delete ${sharedWorkspace.name}?`,
        `This is your final confirmation. Every member will lose access immediately.`,
        "Delete Permanently"
      );

    if (!finalConfirmation) {
      return;
    }

    setProcessing(true);

    try {
      await deleteSharedWorkspace(
        sharedWorkspace.id
      );

      showSuccess(
        `${workspaceLabel} deleted`,
        `${sharedWorkspace.name} was permanently deleted.`,
        onWorkspaceExit
      );
    } catch (error) {
      showError(
        `Unable to delete ${workspaceLabel.toLowerCase()}`,
        error
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppCard>
      <View style={{ gap: 14 }}>
        <View style={{ gap: 5 }}>
          <AppText variant="section">
            {isOwner
              ? `Delete ${workspaceLabel}`
              : `Leave ${workspaceLabel}`}
          </AppText>

          <AppText variant="muted">
            {isOwner
              ? `Deleting this ${workspaceLabel.toLowerCase()} permanently removes it for every member.`
              : `Leaving removes this ${workspaceLabel.toLowerCase()} from your account and ends your access.`}
          </AppText>
        </View>

        <AppButton
          title={
            isOwner
              ? `Delete ${workspaceLabel}`
              : `Leave ${workspaceLabel}`
          }
          variant="danger"
          loading={processing}
          disabled={processing}
          onPress={
            isOwner
              ? handleDelete
              : handleLeave
          }
        />
      </View>
    </AppCard>
  );
}

async function confirmAction(
  title: string,
  message: string,
  actionLabel: string
) {
  if (
    typeof window !== "undefined"
  ) {
    return window.confirm(
      `${title}\n\n${message}`
    );
  }

  return new Promise<boolean>(
    (resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () =>
              resolve(false),
          },
          {
            text: actionLabel,
            style: "destructive",
            onPress: () =>
              resolve(true),
          },
        ],
        {
          cancelable: true,
          onDismiss: () =>
            resolve(false),
        }
      );
    }
  );
}

function showSuccess(
  title: string,
  message: string,
  onComplete?: () => void
) {
  if (
    typeof window !== "undefined"
  ) {
    window.alert(
      `${title}\n\n${message}`
    );

    onComplete?.();
    return;
  }

  Alert.alert(
    title,
    message,
    [
      {
        text: "Continue",
        onPress: onComplete,
      },
    ],
    {
      cancelable: false,
    }
  );
}

function showError(
  title: string,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Something went wrong.";

  if (
    typeof window !== "undefined"
  ) {
    window.alert(
      `${title}\n\n${message}`
    );

    return;
  }

  Alert.alert(title, message);
}