// import { Button } from "@/components/ui/button";
import { CopyPlus } from "lucide-react";
import DataTable from "./data-table";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href={"/admin/dashboard/Products/new"}
          className="bg-blue-700 cursor-pointer hover:bg-blue-800 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
        >
          <CopyPlus className="w-4 h-4 font-semibold" /> Add Product
        </Link>
      </header>
      <main className="mt-2">
        {/* Product list will go here */}
        <DataTable />
      </main>
    </div>
  );
}
