import { getSettings } from "@/lib/site";
import { isAdmin, requirePageUser } from "@/lib/current-user";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProfileForm } from "@/components/admin/profile-form";
import { PasswordForm } from "@/components/admin/password-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [user, settings] = await Promise.all([requirePageUser(), getSettings()]);

  return (
    <AdminShell active="profile" title="Your Profile">
      <div className="profile-grid">
        <ProfileForm
          username={user.username}
          role={isAdmin(user) ? "admin" : "author"}
          displayName={user.displayName}
          bio={user.bio}
          avatar={user.avatar}
          slug={user.slug}
          siteAuthorName={settings.authorName}
        />
        <PasswordForm />
      </div>
    </AdminShell>
  );
}
