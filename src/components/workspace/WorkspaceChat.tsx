import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import {
    getWorkspaceMessages,
    sendWorkspaceMessage,
    subscribeToWorkspaceMessages,
} from "@/lib/workspaceChatStore";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

export default function WorkspaceChat({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function load() {
    setMessages(
      await getWorkspaceMessages(workspaceId)
    );
  }

  useEffect(() => {
    load();

    return subscribeToWorkspaceMessages(
      workspaceId,
      load
    );
  }, [workspaceId]);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 10,
        }}
      >
        {messages.map((message: any) => (
          <AppCard key={message.id}>
            <AppText>
              {message.message}
            </AppText>

            <AppText variant="muted">
              {new Date(
                message.created_at
              ).toLocaleString()}
            </AppText>
          </AppCard>
        ))}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginTop: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppInput
            value={text}
            placeholder="Type a message..."
            onChangeText={setText}
          />
        </View>

        <AppButton
          title="Send"
          onPress={async () => {
            if (!text.trim()) return;

            await sendWorkspaceMessage(
              workspaceId,
              text
            );

            setText("");
          }}
        />
      </View>
    </>
  );
}