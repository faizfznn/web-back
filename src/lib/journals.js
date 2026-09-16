import { supabase } from "./supabase";

export async function getPublicJournals() {
  if (!supabase) {
    return { data: [], error: new Error("Supabase belum dikonfigurasi.") };
  }

  return supabase
    .from("journals")
    .select("id, title, content, image_url, published_at, created_at")
    .eq("is_public", true)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function getPublicJournal(id) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
  }

  return supabase
    .from("journals")
    .select("id, title, content, image_url, published_at, created_at")
    .eq("id", id)
    .eq("is_public", true)
    .single();
}

export async function getAdminJournals() {
  if (!supabase) {
    return { data: [], error: new Error("Supabase belum dikonfigurasi.") };
  }

  return supabase
    .from("journals")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function saveJournal(journal) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
  }

  const payload = {
    title: journal.title.trim(),
    content: journal.content.trim(),
    image_url: journal.image_url.trim() || null,
    is_public: journal.is_public,
    published_at: journal.is_public
      ? journal.published_at || new Date().toISOString()
      : null,
  };

  if (journal.id) {
    return supabase
      .from("journals")
      .update(payload)
      .eq("id", journal.id)
      .select()
      .single();
  }

  return supabase.from("journals").insert(payload).select().single();
}

export async function deleteJournal(id) {
  if (!supabase) {
    return { error: new Error("Supabase belum dikonfigurasi.") };
  }

  return supabase.from("journals").delete().eq("id", id);
}
