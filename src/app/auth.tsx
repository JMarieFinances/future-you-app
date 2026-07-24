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
  const [mode, setMode] =
    useState<"login" | "signup">("login");

  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const isLogin = mode === "login";

  const handleAuth = async () => {
    setMessage("");

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanDisplayName =
      displayName.trim();

    if (
      !cleanEmail ||
      !password.trim()
    ) {
      setMessage(
        "Enter your email and password."
      );

      return;
    }

    if (
      !isLogin &&
      !cleanDisplayName
    ) {
      setMessage(
        "Enter your display name."
      );

      return;
    }

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );

      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } =
          await supabase.auth.signInWithPassword(
            {
              email: cleanEmail,
              password,
            }
          );

        if (error) {
          throw new Error(
            error.message
          );
        }

        return;
      }

      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name:
              cleanDisplayName,
          },
        },
      });

      if (error) {
        throw new Error(
          error.message
        );
      }

      const user = data.user;

      if (user) {
        const {
          error: profileError,
        } = await supabase
          .from("user_profiles")
          .upsert(
            {
              user_id: user.id,
              display_name:
                cleanDisplayName,
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                "user_id",
            }
          );

        if (profileError) {
          throw new Error(
            profileError.message
          );
        }
      }

      setMessage(
        "Account created. Check your email if confirmation is required."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppPage>
      <PageHeader
        title={
          isLogin
            ? "Welcome Back"
            : "Create Account"
        }
        subtitle="Sign in to continue planning your life, not just your money."
      />

      <AppCard>
        <View style={{ gap: 12 }}>
          {!isLogin ? (
            <AppInput
              placeholder="Display Name"
              value={displayName}
              onChangeText={
                setDisplayName
              }
              autoCapitalize="words"
            />
          ) : null}

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

          {message ? (
            <AppText variant="muted">
              {message}
            </AppText>
          ) : null}

          <AppButton
            title={
              loading
                ? "Please wait..."
                : isLogin
                  ? "Log In"
                  : "Sign Up"
            }
            loading={loading}
            disabled={loading}
            onPress={handleAuth}
          />

          <Pressable
            disabled={loading}
            onPress={() => {
              setMode(
                isLogin
                  ? "signup"
                  : "login"
              );

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