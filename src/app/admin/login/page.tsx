import Link from "next/link";
import { redirect } from "next/navigation";
import { db, adminUsers } from "@/db";
import { getSettings } from "@/lib/site";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
import { SetupForm } from "@/components/admin/setup-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Login", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const session = await getSession();
  if (session) redirect("/admin");

  const [settings, adminCount] = await Promise.all([
    getSettings(),
    db.$count(adminUsers),
  ]);
  const needsSetup = adminCount === 0;

  const title = settings.blogTitle || "The Journal";
  const words = title.trim().split(/\s+/);
  const last = words.pop() || "";
  const lead = words.join(" ");

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="blog-logo" style={{ justifyContent: "center", marginBottom: 32 }}>
          <div className="blog-logo__mark">{title[0]?.toUpperCase() || "J"}</div>
          <div className="blog-logo__text" style={{ color: "var(--navy)" }}>
            {lead ? `${lead} ` : ""}
            <span>{last}</span>
          </div>
        </div>
        <h1 style={{ fontSize: "1.5rem", color: "var(--navy)", marginBottom: 6 }}>{needsSetup ? "Welcome!" : "Admin Login"}</h1>
        <p style={{ color: "var(--gray-400)", fontSize: ".9rem", marginBottom: 32 }}>
          {needsSetup ? "Create the admin account for your blog" : "Sign in to manage your blog"}
        </p>

        {needsSetup ? <SetupForm /> : <LoginForm next={next} />}
      </div>
      <Link href="/" className="login-back">
        ← Back to {title}
      </Link>
    </div>
  );
}
