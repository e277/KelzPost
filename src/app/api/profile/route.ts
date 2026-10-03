import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { adminUsers, db } from "@/db";
import { isAdmin, requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { PROFILE_LIMITS, uniqueAuthorSlug } from "@/lib/team";

/** Updates the signed-in team member's public profile: display name, bio and photo. */
export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const displayName = typeof body.displayName === "string" ? body.displayName.trim().replace(/\s+/g, " ") : user.displayName;
  const bio = typeof body.bio === "string" ? body.bio.trim() : user.bio;
  const avatar = typeof body.avatar === "string" ? body.avatar.trim() : user.avatar;

  if (displayName.length > PROFILE_LIMITS.displayName) {
    return NextResponse.json({ error: `Display name can be up to ${PROFILE_LIMITS.displayName} characters.` }, { status: 400 });
  }
  // Admins without a name write as the blog's author from Pages → About; everyone else needs one.
  if (!displayName && !isAdmin(user)) {
    return NextResponse.json({ error: "Please enter the name readers should see on your posts." }, { status: 400 });
  }
  if (bio.length > PROFILE_LIMITS.bio) {
    return NextResponse.json({ error: `Bio can be up to ${PROFILE_LIMITS.bio} characters.` }, { status: 400 });
  }
  if (avatar && !/^(https?:\/\/|\/|data:image\/)/i.test(avatar)) {
    return NextResponse.json({ error: "That photo address isn't valid." }, { status: 400 });
  }

  const slug = displayName === user.displayName && user.slug ? user.slug : await uniqueAuthorSlug(displayName, user.id);
  const [updated] = await db
    .update(adminUsers)
    .set({ displayName, bio, avatar, slug })
    .where(eq(adminUsers.id, user.id))
    .returning({ displayName: adminUsers.displayName, bio: adminUsers.bio, avatar: adminUsers.avatar, slug: adminUsers.slug });

  refreshPublicPages();
  return NextResponse.json(updated);
}
