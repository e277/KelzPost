import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

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
        <h1 style={{ fontSize: "1.5rem", color: "var(--navy)", marginBottom: 6 }}>Admin Login</h1>
        <p style={{ color: "var(--gray-400)", fontSize: ".9rem", marginBottom: 32 }}>Sign in to manage your blog</p>

        <LoginForm />
      </div>
    </div>
  );
}
