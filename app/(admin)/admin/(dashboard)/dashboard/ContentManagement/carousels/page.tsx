"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Plus, Image as ImageIcon } from "lucide-react";
import CarouselsDataTable from "./data-table";

export default function CarouselsPage() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center gap-4 mb-4">
        <Link href="/admin/dashboard/ContentManagement">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2 flex-1">
          <Settings className="h-6 w-6 text-orange-600" />
          Banner Carousels
        </h1>
        <Link href="/admin/dashboard/ContentManagement/banners">
          <Button variant="outline">
            <ImageIcon className="h-4 w-4 mr-2" />
            Manage Banners
          </Button>
        </Link>
        <Link href="/admin/dashboard/ContentManagement/carousels/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Carousel
          </Button>
        </Link>
      </header>

      <main>
        <CarouselsDataTable />
      </main>
    </div>
  );
}
