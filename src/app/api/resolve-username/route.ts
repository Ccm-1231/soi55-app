import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public on purpose: sign-in needs this before a session exists. Only ever returns a synthetic login email. */
export async function POST(request: Request) {
  const { username } = await request.json();
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });

  const match = data.users.find(
    (u) => typeof u.app_metadata?.username === "string" && u.app_metadata.username === username.toLowerCase()
  );

  if (!match?.email) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 404 });
  }

  return NextResponse.json({ email: match.email });
}
