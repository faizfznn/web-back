import { supabase } from "./supabase";

export async function getDatePlans() {
  if (!supabase) {
    return { data: [], error: new Error("Supabase belum dikonfigurasi.") };
  }

  const { data: plans, error: planError } = await supabase
    .from("date_plans")
    .select("*, date_stops(*)")
    .order("date", { ascending: false });

  if (planError) return { data: [], error: planError };

  // Sort stops inside each plan by order_index / time_start
  const formatted = (plans || []).map((plan) => ({
    ...plan,
    date_stops: (plan.date_stops || []).sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    ),
  }));

  return { data: formatted, error: null };
}

export async function getDatePlan(id) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
  }

  const { data: plan, error } = await supabase
    .from("date_plans")
    .select("*, date_stops(*)")
    .eq("id", id)
    .single();

  if (error) return { data: null, error };

  if (plan && plan.date_stops) {
    plan.date_stops.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }

  return { data: plan, error: null };
}

export async function saveDatePlan(plan) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
  }

  const payload = {
    title: plan.title.trim(),
    description: plan.description?.trim() || null,
    date: plan.date || new Date().toISOString().split("T")[0],
    location: plan.location?.trim() || "Malang",
    category: plan.category || "Casual",
    status: plan.status || "upcoming",
    cover_image: plan.cover_image?.trim() || null,
  };

  if (plan.id) {
    return supabase
      .from("date_plans")
      .update(payload)
      .eq("id", plan.id)
      .select()
      .single();
  }

  return supabase.from("date_plans").insert(payload).select().single();
}

export async function deleteDatePlan(id) {
  if (!supabase) {
    return { error: new Error("Supabase belum dikonfigurasi.") };
  }

  return supabase.from("date_plans").delete().eq("id", id);
}

export async function saveDateStop(stop) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
  }

  const payload = {
    date_plan_id: stop.date_plan_id,
    title: stop.title.trim(),
    activity_type: stop.activity_type?.trim() || "Custom activity",
    time_start: stop.time_start?.trim() || null,
    time_end: stop.time_end?.trim() || null,
    actual_started_at: stop.actual_started_at?.trim() || null,
    actual_finished_at: stop.actual_finished_at?.trim() || null,
    status: stop.status || "upcoming",
    transport_note: stop.transport_note?.trim() || null,
    maps_url: stop.maps_url?.trim() || null,
    order_index: Number(stop.order_index) || 0,
    rating: stop.rating ? Number(stop.rating) : null,
    would_go_again: stop.would_go_again || null,
    what_did_we_order: stop.what_did_we_order?.trim() || null,
    favorite_moment: stop.favorite_moment?.trim() || null,
    memory_note: stop.memory_note?.trim() || null,
    photos: stop.photos || [],
  };

  if (stop.id) {
    return supabase
      .from("date_stops")
      .update(payload)
      .eq("id", stop.id)
      .select()
      .single();
  }

  return supabase.from("date_stops").insert(payload).select().single();
}

export async function deleteDateStop(id) {
  if (!supabase) {
    return { error: new Error("Supabase belum dikonfigurasi.") };
  }

  return supabase.from("date_stops").delete().eq("id", id);
}

export async function updateStopStatus(stopId, status, actualTimes = {}) {
  if (!supabase) {
    return { error: new Error("Supabase belum dikonfigurasi.") };
  }

  const payload = { status, ...actualTimes };
  return supabase.from("date_stops").update(payload).eq("id", stopId);
}

export async function saveStopReview(stopId, review) {
  if (!supabase) {
    return { error: new Error("Supabase belum dikonfigurasi.") };
  }

  const payload = {
    rating: review.rating ? Number(review.rating) : null,
    would_go_again: review.would_go_again || null,
    what_did_we_order: review.what_did_we_order?.trim() || null,
    favorite_moment: review.favorite_moment?.trim() || null,
    memory_note: review.memory_note?.trim() || null,
    photos: review.photos || [],
  };

  return supabase.from("date_stops").update(payload).eq("id", stopId);
}

export async function getWheelIdeas() {
  if (!supabase) {
    return {
      data: [
        { id: 1, place_name: "Photobooth Self Studio", category: "Activity" },
        { id: 2, place_name: "Nonton Bioskop XXI", category: "Entertainment" },
        { id: 3, place_name: "Kuliner Malam & Street Food", category: "Culinary" },
        { id: 4, place_name: "Nongkrong di Cafe Aesthetic", category: "Cafe" },
        { id: 5, place_name: "Jalan Santai & Ice Cream Date", category: "Relax" },
        { id: 6, place_name: "Museum / Art Gallery", category: "Sightseeing" },
      ],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("date_wheel_ideas")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      data: [
        { id: 1, place_name: "Photobooth Self Studio", category: "Activity" },
        { id: 2, place_name: "Nonton Bioskop XXI", category: "Entertainment" },
        { id: 3, place_name: "Kuliner Malam & Street Food", category: "Culinary" },
        { id: 4, place_name: "Nongkrong di Cafe Aesthetic", category: "Cafe" },
        { id: 5, place_name: "Jalan Santai & Ice Cream Date", category: "Relax" },
        { id: 6, place_name: "Museum / Art Gallery", category: "Sightseeing" },
      ],
      error: null,
    };
  }

  return { data, error: null };
}

export async function saveWheelIdea(idea) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase belum dikonfigurasi.") };
  }

  return supabase
    .from("date_wheel_ideas")
    .insert({
      place_name: idea.place_name.trim(),
      category: idea.category?.trim() || "Cafe/Food",
    })
    .select()
    .single();
}

export async function deleteWheelIdea(id) {
  if (!supabase) {
    return { error: new Error("Supabase belum dikonfigurasi.") };
  }

  return supabase.from("date_wheel_ideas").delete().eq("id", id);
}
