import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

const isWeb = Platform.OS === "web";

const webStorage =
  typeof window !== "undefined"
    ? {
        getItem: (key: string) => window.localStorage.getItem(key),
        setItem: (key: string, value: string) =>
          window.localStorage.setItem(key, value),
        removeItem: (key: string) => window.localStorage.removeItem(key),
      }
    : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isWeb ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});