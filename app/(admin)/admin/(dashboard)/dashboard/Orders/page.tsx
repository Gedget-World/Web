// import { Button } from "@/components/ui/button";
// import { CopyPlus } from "lucide-react";
import DataTable from "./data-table";

export default async function OrdersPage() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        {/* <Button
          size="sm"
          className="bg-blue-700 cursor-pointer hover:bg-blue-800"
        >
          <CopyPlus /> Add Order
        </Button> */}
      </header>
      <main className="mt-2">
        {/* Order list will go here */}
        <DataTable />
      </main>
    </div>
  );
}
