import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "./data-table";

export default function CouponsPage() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Link href="/admin/dashboard/Coupons/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Coupon
          </Button>
        </Link>
      </header>
      <DataTable />
    </div>
  );
}
