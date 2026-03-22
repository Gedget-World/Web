import Link from "next/link";
import { Button } from "@/components/ui/button";
import DataTable from "./data-table";

export default function AdminsPage() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admins</h1>
        <div>
          <Link href="/admin/dashboard/Admins/new">
            <Button>Create Admin</Button>
          </Link>
        </div>
      </header>
      <main className="mt-2">
        <DataTable />
      </main>
    </div>
  );
}
