import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManage, roleOf } from "@/lib/roles";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(roleOf(user.app_metadata))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (user.id === id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "User management isn't configured yet — the server is missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 501 }
    );
  }

  const requesterRole = roleOf(user.app_metadata);
  const { data: targetData, error: fetchError } = await admin.auth.admin.getUserById(id);
  if (fetchError || !targetData.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const targetRole = roleOf(targetData.user.app_metadata);
  if (targetRole === "admin" && requesterRole !== "admin") {
    return NextResponse.json({ error: "Managers can't delete admin accounts." }, { status: 403 });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
