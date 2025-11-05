import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="flex flex-col p-1 space-y-2">
      <Link
        href="/admin/dashboard"
        className="p-2 hover:bg-gray-500 hover:text-white"
      >
        Dashboard
      </Link>
      <Link
        href="/admin/users"
        className="p-2 hover:bg-gray-500 hover:text-white"
      >
        Users
      </Link>
      <Link
        href="/admin/settings"
        className="p-2 hover:bg-gray-500 hover:text-white"
      >
        Settings
      </Link>
    </div>
  );
}
