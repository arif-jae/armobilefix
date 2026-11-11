// Supabase Edge Function: staff-admin
// ใช้ให้ "เจ้าของร้าน" เพิ่ม/ปิดใช้งาน/เปลี่ยนรหัสผ่านพนักงาน
// SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ถูกใส่ให้อัตโนมัติโดย Supabase (ไม่ต้องตั้งเอง)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const j = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ตรวจว่าผู้เรียกเป็นเจ้าของร้านที่ยังเปิดใช้งานอยู่
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return j({ error: "ยังไม่ได้ล็อกอิน" }, 401);
    const { data: me } = await admin.from("profiles").select("role,active").eq("user_id", u.user.id).maybeSingle();
    if (!me || me.role !== "owner" || !me.active) return j({ error: "เฉพาะเจ้าของร้านเท่านั้น" }, 403);

    const b = await req.json();

    if (b.action === "create") {
      const email = String(b.email || "").trim().toLowerCase();
      const name = String(b.name || "").trim();
      const role = b.role === "owner" ? "owner" : "staff";
      if (!email || !name || String(b.password || "").length < 6) return j({ error: "ข้อมูลไม่ครบ หรือรหัสผ่านสั้นเกินไป" }, 400);
      const { data, error } = await admin.auth.admin.createUser({ email, password: b.password, email_confirm: true });
      if (error) return j({ error: error.message }, 400);
      const { error: e2 } = await admin.from("profiles").insert({ user_id: data.user.id, email, name, role, active: true });
      if (e2) {
        await admin.auth.admin.deleteUser(data.user.id);
        return j({ error: e2.message }, 400);
      }
      return j({ ok: true });
    }

    if (b.action === "set_active") {
      if (b.user_id === u.user.id) return j({ error: "ปิดใช้งานบัญชีตัวเองไม่ได้" }, 400);
      const active = !!b.active;
      const { error } = await admin.from("profiles").update({ active }).eq("user_id", b.user_id);
      if (error) return j({ error: error.message }, 400);
      await admin.auth.admin.updateUserById(b.user_id, { ban_duration: active ? "none" : "876000h" });
      return j({ ok: true });
    }

    if (b.action === "reset_password") {
      if (String(b.password || "").length < 6) return j({ error: "รหัสผ่านสั้นเกินไป" }, 400);
      const { error } = await admin.auth.admin.updateUserById(b.user_id, { password: b.password });
      if (error) return j({ error: error.message }, 400);
      return j({ ok: true });
    }

    return j({ error: "คำสั่งไม่ถูกต้อง" }, 400);
  } catch (e) {
    return j({ error: String((e as Error).message || e) }, 500);
  }
});
