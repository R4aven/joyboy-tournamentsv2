
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, pseudo, email, username")
    .eq("id", user.id)
    .single();

  // Bypass pour owner + check role
  const isOwner = user.email === "edmondmorent@gmail.com";
  const isAdmin = profile?.role === "ADMIN" || profile?.role === "MODERATEUR" || isOwner;

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <AdminSidebar />
      {/* Le contenu doit être décalé de la sidebar 280px sur desktop */}
      <div className="lg:pl-[280px] w-full min-w-0">
        <div className="min-h-screen w-full">
          <div className="mx-auto max-w-[1600px] w-full p-4 lg:p-8 pt-6 lg:pt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
