import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManage, roleOf, type StaffRole } from "@/lib/roles";

const USERNAME_DOMAIN = "users.soi55.internal";
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function adminClientOrError() {
  try {
    return { admin: createAdminClient(), error: null as string | null };
  } catch {
    return {
      admin: null,
      error: "User management isn't configured yet — the server is missing SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
}

function usernameOf(appMetadata: Record<string, unknown> | null | undefined): string | null {
  return typeof appMetadata?.username === "string" ? appMetadata.username : null;
}

export async function GET() {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(roleOf(user.app_metadata))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { admin, error: configError } = adminClientOrError();
  if (!admin) return NextResponse.json({ error: configError }, { status: 501 });

  const { data, error } = await admin.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users
    .map((u) => ({
      id: u.id,
      email: usernameOf(u.app_metadata) ? null : u.email,
      username: usernameOf(u.app_metadata),
      role: roleOf(u.app_metadata),
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  return NextResponse.json({
    users,
    currentUserId: user.id,
    currentUserRole: roleOf(user.app_metadata),
  });
}

export async function POST(request: Request) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requesterRole = roleOf(user.app_metadata);
  if (!canManage(requesterRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { admin, error: configError } = adminClientOrError();
  if (!admin) return NextResponse.json({ error: configError }, { status: 501 });

  const { email, username, password, role } = await request.json();
  const requestedRole: StaffRole = role === "admin" ? "admin" : role === "user" ? "user" : "manager";

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "A password of at least 8 characters is required." },
      { status: 400 }
    );
  }
  if (requestedRole === "admin" && requesterRole !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can create another admin account." },
      { status: 403 }
    );
  }

  let loginEmail: string;
  let appMetadata: Record<string, unknown> = { role: requestedRole };

  if (requestedRole === "user") {
    if (!username || !USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-32 characters: letters, numbers, dots, underscores, or hyphens." },
        { status: 400 }
      );
    }
    loginEmail = `${username.toLowerCase()}@${USERNAME_DOMAIN}`;
    appMetadata = { ...appMetadata, username: username.toLowerCase() };
  } else {
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    loginEmail = email;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });

  if (error) {
    const message =
      requestedRole === "user" && error.message.toLowerCase().includes("already")
        ? "That username is already taken."
        : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: requestedRole === "user" ? null : data.user.email,
      username: requestedRole === "user" ? username.toLowerCase() : null,
      role: requestedRole,
      createdAt: data.user.created_at,
    },
  });
}
