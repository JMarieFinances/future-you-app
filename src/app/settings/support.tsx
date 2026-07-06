import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Alert, Pressable, View } from "react-native";

type IssueType = "bug" | "feature_request" | "general_question" | "billing_issue";

type SupportRequest = {
  id: string;
  issue_type: IssueType;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  created_at: string;
};

const issueTypes: { label: string; value: IssueType }[] = [
  { label: "🐛 Bug Report", value: "bug" },
  { label: "💡 Feature Request", value: "feature_request" },
  { label: "❓ General Question", value: "general_question" },
  { label: "💳 Billing Issue", value: "billing_issue" },
];

const statusLabels = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
};

export default function SupportCenter() {
  const [issueType, setIssueType] = useState<IssueType>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  async function loadRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("support_requests")
      .select("id, issue_type, subject, message, status, created_at")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      Alert.alert("Could not load requests", error.message);
      return;
    }

    setRequests(data ?? []);
  }

  async function submitRequest() {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing info", "Please add a subject and message.");
      return;
    }

    setSending(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setSending(false);
      Alert.alert("Not signed in", "Please log in again to contact support.");
      return;
    }

    const { error } = await supabase.from("support_requests").insert({
      user_id: user.id,
      email: user.email,
      issue_type: issueType,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
    });

    setSending(false);

    if (error) {
      Alert.alert("Could not submit request", error.message);
      return;
    }

    setSubject("");
    setMessage("");
    setIssueType("bug");

    Alert.alert("Request submitted", "We got your message.");
    loadRequests();
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <AppPage>
      <PageHeader
        title="Support Center"
        subtitle="Send us bugs, billing issues, questions, or feedback."
     showBack
     />

      <AppCard>
        <AppText variant="title">New Request</AppText>

        <View style={{ gap: 10, marginTop: 14 }}>
          {issueTypes.map((item) => {
            const selected = issueType === item.value;

            return (
              <Pressable key={item.value} onPress={() => setIssueType(item.value)}>
                <AppCard
                  style={{
                    borderWidth: 1,
                    opacity: selected ? 1 : 0.75,
                  }}
                >
                  <AppText>{item.label}</AppText>
                </AppCard>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 16, gap: 12 }}>
          <AppInput
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Briefly describe the issue"
          />

          <AppInput
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us what happened"
            multiline
          />

          <AppButton
            title={sending ? "Submitting..." : "Submit Request"}
            onPress={submitRequest}
            disabled={sending}
          />
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <AppText variant="title">My Requests</AppText>
          <AppText>{loading ? "Loading..." : `${requests.length}`}</AppText>
        </AppRow>

        <View style={{ gap: 10, marginTop: 14 }}>
          {requests.length === 0 ? (
            <AppText>No support requests yet.</AppText>
          ) : (
            requests.map((request) => (
              <AppCard key={request.id}>
                <AppRow>
                  <AppText variant="subtitle">{request.subject}</AppText>
                  <AppText>{statusLabels[request.status]}</AppText>
                </AppRow>

                <AppText style={{ marginTop: 6 }}>
                  {issueTypes.find((type) => type.value === request.issue_type)?.label}
                </AppText>

                <AppText style={{ marginTop: 6 }}>
                  {new Date(request.created_at).toLocaleDateString()}
                </AppText>
              </AppCard>
            ))
          )}
        </View>
      </AppCard>
    </AppPage>
  );
}