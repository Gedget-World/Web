import { CopyPlus, ArrowUpDown } from "lucide-react";
import DataTable from "./data-table";
import Link from "next/link";

export default function CollectionsPage() {
  return (
    <div>
      <div className="mx-4 my-2">
        <header className="p-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Collections</h1>
          <div className="flex items-center gap-2">
            <Link
              href={"/admin/dashboard/Collections/reorder"}
              className="bg-gray-100 cursor-pointer hover:bg-gray-200 text-gray-700 px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
            >
              <ArrowUpDown className="w-4 h-4" /> Reorder
            </Link>
            <Link
              href={"/admin/dashboard/Collections/new"}
              className="bg-blue-700 cursor-pointer hover:bg-blue-800 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
            >
              <CopyPlus className="w-4 h-4 font-semibold" /> Add Collection
            </Link>
          </div>
        </header>
        <main className="mt-2">
          {/* Collection list will go here */}
          <DataTable />
        </main>
      </div>
    </div>
  );
}
