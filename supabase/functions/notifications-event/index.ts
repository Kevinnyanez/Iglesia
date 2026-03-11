// Edge Function: Recibir evento y enviar notificaciones push
// URL: https://TU_PROYECTO.supabase.co/functions/v1/notifications-event

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface EventPayload {
  type: string;
  postId?: string;
  communityId?: string;
  receiverUserId?: string;
  likerUserId?: string;
  goalId?: string;
  date?: string;
  chatId?: string;
  [key: string]: unknown;
}

async function getTokensForUsers(supabase: ReturnType<typeof createClient>, userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data } = await supabase
    .from("notification_subscriptions")
    .select("token")
    .in("user_id", userIds);
  return (data ?? []).map((r) => r.token);
}

async function getTokensForCommunity(supabase: ReturnType<typeof createClient>, communityId: string) {
  const { data: members } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId);
  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  return getTokensForUsers(supabase, userIds);
}

async function sendPushToTokens(tokens: string[], title: string, body: string) {
  if (tokens.length === 0) return;
  // TODO: Integrar Firebase Admin SDK para enviar push real
  // Por ahora solo logueamos
  console.log(`[Push] "${title}" -> ${tokens.length} tokens`);
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
        if (communityId) {
          tokens = await getTokensForCommunity(supabase, communityId);
          title = "Nueva publicación";
          bodyText = "Alguien publicó en tu comunidad";
        } else {
          const { data } = await supabase.from("notification_subscriptions").select("token");
          tokens = (data ?? []).map((r) => r.token);
          title = "Nueva publicación";
          bodyText = "Hay una nueva publicación en el feed global";
        }
        break;
      }
      case "new_like":
      case "new_comment": {
        const receiverUserId = body.receiverUserId as string | undefined;
        if (receiverUserId) {
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
