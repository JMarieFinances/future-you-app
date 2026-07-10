import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Alert, Pressable, View } from "react-native";

type SupportRequest = {
  id: string;
  user_id: string;
  email: string | null;
  type: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
};

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [selected, setSelected] = useState<SupportRequest | null>(null);
  const [response, setResponse] = useState("");

  async function loadRequests() {
    const { data, error } = await supabase
      .from("support_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setRequests(data ?? []);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function saveResponse(status: "open" | "in_progress" | "closed") {
    if (!selected) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("support_requests")
      .update({
        status,
        admin_response: response,
        responded_at: new Date().toISOString(),
        responded_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Saved", "Support request updated.");
    setSelected(null);
    setResponse("");
    loadRequests();
  }

  return (
    <AppPage>
      <PageHeader
        title="Support Inbox"
        subtitle="View and manage user support requests."
      />

      {!selected ? (
        <View style={{ gap: 12 }}>
          {requests.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setSelected(item);
                setResponse(item.admin_response ?? "");
              }}
            >
              <AppCard>
                <View style={{ gap: 6 }}>
                  <AppText variant="title">{item.subject}</AppText>
                  <AppText>{item.email ?? "No email"}</AppText>
                  <AppText>Status: {item.status}</AppText>
                  <AppText>{item.message}</AppText>
                </View>
              </AppCard>
            </Pressable>
          ))}
        </View>
      ) : (
        <AppCard>
          <View style={{ gap: 12 }}>
            <AppText variant="title">{selected.subject}</AppText>
            <AppText>Email: {selected.email ?? "No email"}</AppText>
            <AppText>Type: {selected.type}</AppText>
            <AppText>Status: {selected.status}</AppText>
            <AppText>{selected.message}</AppText>

            <AppInput
              label="Admin Response"
              value={response}
              onChangeText={setResponse}
              placeholder="Write your response or internal note..."
              multiline
            />

            <AppButton
              title="Mark In Progress"
              onPress={() => saveResponse("in_progress")}
            />

            <AppButton
              title="Mark Closed"
              onPress={() => saveResponse("closed")}
            />

            <AppButton
              title="Back"
              variant="secondary"
              onPress={() => setSelected(null)}
            />
          </View>
        </AppCard>
      )}
    </AppPage>
  );
}