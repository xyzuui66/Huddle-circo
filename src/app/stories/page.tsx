"use client";

import MainLayout from "@/components/layout/MainLayout";
import { BookOpen } from "lucide-react";

export default function StoriesPage() {
  return (
    <MainLayout>
      <div className="h-full flex flex-col items-center justify-center">
        <BookOpen size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-400 text-lg">Belum ada cerita</p>
        <p className="text-gray-300 text-sm mt-2">Upload cerita kamu sekarang!</p>
      </div>
    </MainLayout>
  );
}
