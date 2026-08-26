import { redirect } from "next/navigation";
export default function ProfileIndexRedirect() {
  redirect("/dashboard");
}
