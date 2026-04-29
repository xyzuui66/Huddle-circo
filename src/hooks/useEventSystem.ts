"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";

export interface Event {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  category: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_attendees?: number;
  status: "upcoming" | "live" | "ended" | "cancelled";
  visibility: "public" | "friends" | "private";
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: "joined" | "interested" | "cancelled";
  joined_at: string;
}

export function useEventSystem() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all events
  const fetchEvents = useCallback(async (category?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("events")
        .select("*")
        .eq("visibility", "public")
        .order("start_date", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Gagal memuat event!");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's events
  const fetchMyEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", user.id)
        .order("start_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching my events:", error);
      toast.error("Gagal memuat event!");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create event
  const createEvent = useCallback(
    async (eventData: Omit<Event, "id" | "created_at" | "updated_at">) => {
      if (!user) {
        toast.error("Harus login dulu!");
        return false;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("events")
          .insert({
            creator_id: user.id,
            ...eventData,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success("Event berhasil dibuat!");
        await fetchMyEvents();
        return true;
      } catch (error) {
        console.error("Error creating event:", error);
        toast.error("Gagal buat event!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, fetchMyEvents]
  );

  // Update event
  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<Event>) => {
      if (!user) return false;

      setLoading(true);

      try {
        const { error } = await supabase
          .from("events")
          .update(updates)
          .eq("id", eventId)
          .eq("creator_id", user.id);

        if (error) throw error;

        toast.success("Event berhasil diupdate!");
        await fetchMyEvents();
        return true;
      } catch (error) {
        console.error("Error updating event:", error);
        toast.error("Gagal update event!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, fetchMyEvents]
  );

  // Delete event
  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!user) return false;

      setLoading(true);

      try {
        const { error } = await supabase
          .from("events")
          .delete()
          .eq("id", eventId)
          .eq("creator_id", user.id);

        if (error) throw error;

        toast.success("Event berhasil dihapus!");
        await fetchMyEvents();
        return true;
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Gagal hapus event!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, fetchMyEvents]
  );

  // Join event
  const joinEvent = useCallback(async (eventId: string) => {
    if (!user) {
      toast.error("Harus login dulu!");
      return false;
    }

    try {
      const { error } = await supabase.from("event_attendees").insert({
        event_id: eventId,
        user_id: user.id,
        status: "joined",
      });

      if (error) throw error;

      toast.success("Berhasil join event!");
      return true;
    } catch (error) {
      console.error("Error joining event:", error);
      toast.error("Gagal join event!");
      return false;
    }
  }, [user]);

  // Leave event
  const leaveEvent = useCallback(async (eventId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Berhasil keluar dari event!");
      return true;
    } catch (error) {
      console.error("Error leaving event:", error);
      toast.error("Gagal keluar dari event!");
      return false;
    }
  }, [user]);

  // Get event attendees count
  const getAttendeeCount = useCallback(async (eventId: string) => {
    try {
      const { count } = await supabase
        .from("event_attendees")
        .select("*", { count: "exact" })
        .eq("event_id", eventId)
        .eq("status", "joined");

      return count || 0;
    } catch (error) {
      console.error("Error getting attendee count:", error);
      return 0;
    }
  }, []);

  // Check if user joined event
  const isUserJoined = useCallback(
    async (eventId: string) => {
      if (!user) return false;

      try {
        const { data } = await supabase
          .from("event_attendees")
          .select("id")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .single();

        return !!data;
      } catch (error) {
        return false;
      }
    },
    [user]
  );

  return {
    events,
    loading,
    fetchEvents,
    fetchMyEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    getAttendeeCount,
    isUserJoined,
  };
}
