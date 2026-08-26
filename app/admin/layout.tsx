import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  // BYPASS TEMPORAIRE - autorise ton email même si RLS bloque
  const isAllowed = profile?.role === "ADMIN" || user.email === "edmondmorent@gmail.com";
  if (!isAllowed) redirect("/");

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <AdminSidebar />
      <div className="lg:pl-">
        <div className="min-h-screen">
          <div className="mx-auto max-w- p-4 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}