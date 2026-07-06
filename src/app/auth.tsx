import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Pressable, View } from "react-native";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  const handleAuth = async () => {
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const result = isLogin
      ? await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
      : await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (!isLogin) {
      setMessage("Account created. Check your email if confirmation is required.");
    }
  };

  return (
    <AppPage>
      <PageHeader
        title={isLogin ? "Welcome Back" : "Create Account"}
        subtitle="Sign in to continue planning your life, not just your money."
      />

      <AppCard>
        <View style={{ gap: 12 }}>
          <AppInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <AppInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {message ? <AppText variant="muted">{message}</AppText> : null}

          <AppButton
            title={loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
            onPress={handleAuth}
          />

          <Pressable
            onPress={() => {
              setMode(isLogin ? "signup" : "login");
              setMessage("");
            }}
          >
            <AppText variant="muted">
              {isLogin
                ? "New to Future You? Create an account."
                : "Already have an account? Log in."}
            </AppText>
          </Pressable>
        </View>
      </AppCard>
    </AppPage>
  );
}