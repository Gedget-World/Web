import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] w-full">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-10 text-primary" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
