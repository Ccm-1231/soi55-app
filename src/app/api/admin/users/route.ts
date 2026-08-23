import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { roleOf, type StaffRole } from "@/lib/roles";

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

export async function GET() {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { admin, error: configError } = adminClientOrError();
  if (!admin) return NextResponse.json({ error: configError }, { status: 501 });

  const { data, error } = await admin.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users
    .map((u) => ({
      id: u.id,
      email: u.email,
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

  const { admin, error: configError } = adminClientOrError();
  if (!admin) return NextResponse.json({ error: configError }, { status: 501 });

  const { email, password, role } = await request.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  const requesterRole = roleOf(user.app_metadata);
  const requestedRole: StaffRole = role === "admin" ? "admin" : "manager";
  if (requestedRole === "admin" && requesterRole !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can create another admin account." },
      { status: 403 }
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: requestedRole },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email, role: requestedRole, createdAt: data.user.created_at },
  });
}
