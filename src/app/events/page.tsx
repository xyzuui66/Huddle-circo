"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useEventSystem } from "@/hooks/useEventSystem";
import { useAuth } from "@/contexts/auth-context";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Filter,
  Clock,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const CATEGORIES = [
  { id: "gaming", label: "Gaming", color: "from-purple-400 to-purple-600" },
  { id: "edit", label: "Editing", color: "from-blue-400 to-blue-600" },
  { id: "streaming", label: "Streaming", color: "from-red-400 to-red-600" },
  { id: "collab", label: "Kolaborasi", color: "from-green-400 to-green-600" },
  { id: "other", label: "Lainnya", color: "from-gray-400 to-gray-600" },
];

export default function EventsPage() {
  const { user, profile } = useAuth();
  const { events, loading, fetchEvents, joinEvent, leaveEvent, isUserJoined } =
    useEventSystem();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents(selectedCategory || undefined);
  }, [selectedCategory, fetchEvents]);

  const handleJoinEvent = async (eventId: string) => {
    const success = await joinEvent(eventId);
    if (success) {
      setJoined((prev) => new Set([...prev, eventId]));
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    const success = await leaveEvent(eventId);
    if (success) {
      setJoined((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "upcoming":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "ended":
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "live":
        return "🔴 LIVE";
      case "upcoming":
        return "📅 Akan Datang";
      case "ended":
        return "✓ Selesai";
      default:
        return status;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Event & Gathering
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Temukan event gaming, editing, dan streaming dari komunitas kita
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2 py-3 px-6">
            <Plus size={20} />
            Buat Event
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <p className="font-semibold text-gray-900 dark:text-white">
              Kategori
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === null
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Semua
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === cat.id
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Memuat event...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Tidak ada event ditemukan</p>
            <button className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              Buat Event Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                onClick={() =>
                  setExpandedEvent(
                    expandedEvent === event.id ? null : event.id
                  )
                }
              >
                {/* Event Image/Color */}
                <div
                  className={`h-40 bg-gradient-to-br ${
                    CATEGORIES.find((c) => c.id === event.category)?.color ||
                    "from-gray-400 to-gray-600"
                  } relative overflow-hidden group-hover:scale-105 transition-transform`}
                >
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      className="w-full h-full object-cover"
                      alt={event.title}
                    />
                  )}

                  {/* Status Badge */}
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {getStatusLabel(event.status)}
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>
                        {new Date(event.start_date).toLocaleDateString("id-ID")}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>
                        {event.max_attendees
                          ? `0/${event.max_attendees} peserta`
                          : "Peserta terbuka"}
                      </span>
                    </div>
                  </div>

                  {/* Description (if expanded) */}
                  {expandedEvent === event.id && event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {joined.has(event.id) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveEvent(event.id);
                        }}
                        className="btn-ghost flex-1 text-sm text-red-600 dark:text-red-400"
                      >
                        Keluar
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinEvent(event.id);
                        }}
                        className="btn-primary flex-1 text-sm"
                      >
                        Join Event
                      </button>
                    )}
                    <button className="btn-ghost p-2 text-sm">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
