import { redirect } from "next/navigation";

// Settings was renamed Configurations; keep old bookmarks working.
export default function OldSettingsPage() {
  redirect("/admin/configurations");
}
