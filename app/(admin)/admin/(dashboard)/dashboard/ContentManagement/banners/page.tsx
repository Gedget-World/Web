import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import DataTable from "./data-table";

export default function BannersPage() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/ContentManagement">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Banners</h1>
        </div>
        <Link href="/admin/dashboard/ContentManagement/banners/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Banner
          </Button>
        </Link>
      </header>
      <main className="mt-4">
        <DataTable />
      </main>
    </div>
  );
}
