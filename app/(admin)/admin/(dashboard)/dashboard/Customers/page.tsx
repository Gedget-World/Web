import DataTable from "./data-table";

export default function CustomersPage() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
      </header>
      <main className="mt-2">
        <DataTable />
      </main>
    </div>
  );
}
