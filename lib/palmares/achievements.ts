
// FIX: was selecting pseudo which does not exist - use username
import { createClient } from "@/lib/supabase/client";

export async function getUserAchievements(userId: string) {
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("username, display_name").eq("id", userId).single();
  return profile;
}
