// Edge Function: Recibir evento y enviar notificaciones push
// URL: https://TU_PROYECTO.supabase.co/functions/v1/notifications-event
// Secret requerido: FIREBASE_SERVICE_ACCOUNT_JSON (JSON del service account de Firebase)

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "biblia-app-97be8";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");

interface EventPayload {
  type: string;
  postId?: string;
  communityId?: string;
  receiverUserId?: string;
  likerUserId?: string;
  authorId?: string;
  goalId?: string;
  date?: string;
  chatId?: string;
  [key: string]: unknown;
}

async function getTokensForUsers(supabase: ReturnType<typeof createClient>, userIds: string[], excludeUserId?: string) {
  if (userIds.length === 0) return [];
  let query = supabase.from("notification_subscriptions").select("user_id, token").in("user_id", userIds);
  const { data } = await query;
  const rows = (data ?? []).filter((r) => r.user_id !== excludeUserId);
  return rows.map((r) => r.token);
}

async function getTokensForCommunity(supabase: ReturnType<typeof createClient>, communityId: string, excludeUserId?: string) {
  const { data: members } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId);
  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  return getTokensForUsers(supabase, userIds, excludeUserId);
}

async function getGoogleAccessToken(): Promise<string | null> {
  if (!FIREBASE_SERVICE_ACCOUNT) return null;
  try {
    const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    const { private_key, client_email } = sa;
    if (!private_key || !client_email) return null;

    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: client_email,
      sub: client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    };

    const encoder = new TextEncoder();
    const b64 = (d: unknown) => btoa(JSON.stringify(d)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const toSign = `${b64(header)}.${b64(payload)}`;
    const keyData = pemToBinary(private_key);
    const key = await crypto.subtle.importKey("pkcs8", keyData, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(toSign));
    const jwt = `${toSign}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const json = await res.json();
    return json.access_token ?? null;
  } catch (e) {
    console.error("Error getting Google token:", e);
    return null;
  }
}

function pemToBinary(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function sendPushToTokens(tokens: string[], title: string, body: string) {
  if (tokens.length === 0) return;
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    console.log(`[Push] Sin credenciales Firebase. "${title}" -> ${tokens.length} tokens (no enviados)`);
    return;
  }
  const url = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
  for (const token of tokens) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            webpush: { fcm_options: { link: "/" } },
          },
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`FCM error for token:`, err);
      }
    } catch (e) {
      console.error("FCM send error:", e);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const body = (await req.json()) as EventPayload;
    const { type } = body;

    if (!type) {
      return new Response(JSON.stringify({ error: "type es requerido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let tokens: string[] = [];
    let title = "";
    let bodyText = "";

    switch (type) {
      case "new_post":
      case "new_church_post": {
        const communityId = body.communityId as string | undefined;
        const authorId = body.authorId as string | undefined;
        if (communityId) {
          tokens = await getTokensForCommunity(supabase, communityId, authorId);
          title = "Nueva publicación";
          bodyText = "Alguien publicó en tu comunidad";
        } else {
          const { data } = await supabase.from("notification_subscriptions").select("user_id, token");
          tokens = (data ?? []).filter((r) => r.user_id !== authorId).map((r) => r.token);
          title = "Nueva publicación";
          bodyText = "Hay una nueva publicación en el feed global";
        }
        break;
      }
      case "new_like":
      case "new_comment": {
        const receiverUserId = body.receiverUserId as string | undefined;
        const likerUserId = body.likerUserId as string | undefined;
        if (receiverUserId && receiverUserId !== likerUserId) {
          tokens = await getTokensForUsers(supabase, [receiverUserId]);
          title = type === "new_like" ? "Nuevo like" : "Nuevo comentario";
          bodyText = type === "new_like" ? "A alguien le gustó tu publicación" : "Alguien comentó tu publicación";
        }
        break;
      }
      case "new_direct_message": {
        const receiverUserId = body.receiverUserId as string | undefined;
        if (receiverUserId) {
          tokens = await getTokensForUsers(supabase, [receiverUserId]);
          title = "Nuevo mensaje";
          bodyText = "Tienes un nuevo mensaje directo";
        }
        break;
      }
      default:
        console.log("Evento ignorado:", type);
    }

    if (tokens.length > 0 && (title || bodyText)) {
      await sendPushToTokens(tokens, title, bodyText);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
