import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import {
    inviteWorkspaceMember,
    type WorkspaceRole,
} from "@/lib/sharedWorkspaceStore";
import { useTheme } from "@/lib/useTheme";
import { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  workspaceName: string;
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export default function InviteMemberModal({
  visible,
  workspaceName,
  workspaceId,
  onClose,
  onSuccess,
}: Props) {
  const { colors, theme } = useTheme();

  const [email, setEmail] = useState("");
  const [role, setRole] =
    useState<WorkspaceRole>("editor");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!visible) {
      setEmail("");
      setRole("editor");
      setErrorMessage("");
      setLoading(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (loading) return;

    setEmail("");
    setRole("editor");
    setErrorMessage("");
    onClose();
  };

  const handleInvite = async () => {
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!workspaceId) {
      setErrorMessage(
        "The shared workspace is still loading."
      );
      return;
    }

    if (!normalizedEmail) {
      setErrorMessage(
        "Enter the member's email address."
      );
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage(
        "Enter a valid email address."
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await inviteWorkspaceMember({
        workspaceId,
        email: normalizedEmail,
        role,
      });

      setEmail("");
      setRole("editor");

      await onSuccess();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the invitation."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        onPress={handleClose}
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor:
            "rgba(0, 0, 0, 0.58)",
          padding: 22,
        }}
      >
        <Pressable
          onPress={(event) =>
            event.stopPropagation()
          }
          style={{
            width: "100%",
            maxWidth: 520,
            alignSelf: "center",
            padding: 22,
            borderRadius:
              theme.radius.card,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 24,
            shadowOffset: {
              width: 0,
              height: 12,
            },
            elevation: 12,
          }}
        >
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                Invite Member
              </AppText>

              <AppText variant="muted">
                Add someone to {workspaceName}.
              </AppText>
            </View>

            <Pressable
              disabled={loading}
              onPress={handleClose}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 8,
                opacity:
                  pressed || loading
                    ? 0.55
                    : 1,
              })}
            >
              <AppText variant="muted">
                Close
              </AppText>
            </Pressable>
          </AppRow>

          <View
            style={{
              marginTop: 20,
              gap: 18,
            }}
          >
            <View>
              <AppText variant="bold">
                Email Address
              </AppText>

              <View style={{ marginTop: 8 }}>
                <AppInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);

                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  placeholder="member@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View>
              <AppText variant="bold">
                Access Level
              </AppText>

              <View
                style={{
                  marginTop: 10,
                  gap: 10,
                }}
              >
                <RoleOption
                  title="Editor"
                  description="Can update budgets, transactions, calendars, chat, and shared content."
                  active={role === "editor"}
                  disabled={loading}
                  onPress={() =>
                    setRole("editor")
                  }
                />

                <RoleOption
                  title="Viewer"
                  description="Can view the workspace but cannot make changes."
                  active={role === "viewer"}
                  disabled={loading}
                  onPress={() =>
                    setRole("viewer")
                  }
                />
              </View>
            </View>

            {errorMessage ? (
              <View
                style={{
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  backgroundColor:
                    "rgba(239, 68, 68, 0.08)",
                }}
              >
                <AppText variant="muted">
                  {errorMessage}
                </AppText>
              </View>
            ) : null}

            <View style={{ gap: 10 }}>
              <AppButton
                title="Send Invitation"
                loading={loading}
                disabled={
                  loading ||
                  !workspaceId ||
                  !email.trim()
                }
                onPress={handleInvite}
              />

              <AppButton
                title="Cancel"
                variant="outline"
                disabled={loading}
                onPress={handleClose}
              />
            </View>

            <AppText variant="muted">
              The invitation will appear in the
              recipient’s Future You account when
              they sign in using this email.
            </AppText>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RoleOption({
  title,
  description,
  active,
  disabled,
  onPress,
}: {
  title: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: active
          ? colors.primary
          : colors.border,
        backgroundColor: active
          ? "rgba(34, 197, 94, 0.08)"
          : "transparent",
        opacity:
          disabled || pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 20,
          height: 20,
          marginTop: 1,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: active
            ? colors.primary
            : colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {active ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor:
                colors.primary,
            }}
          />
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <AppText variant="bold">
          {title}
        </AppText>

        <View style={{ marginTop: 3 }}>
          <AppText variant="muted">
            {description}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}