import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { DataTable } from "./data-table";

export default function AffiliatesPage() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Affiliates</h1>
          <p className="text-sm text-gray-500">
            Review applications and manage the referral program.
          </p>
        </div>
        <Link href="/admin/dashboard/Affiliates/Payouts">
          <Button variant="outline">
            <Wallet className="h-4 w-4 mr-2" />
            Payouts
          </Button>
        </Link>
      </header>
      <DataTable />
    </div>
  );
}
