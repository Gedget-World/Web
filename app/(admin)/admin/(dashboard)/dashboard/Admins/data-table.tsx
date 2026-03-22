"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  MoreHorizontalIcon,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Pencil,
  Eye,
} from "lucide-react";

interface Admin {
  id: string;
  email: string;
  name: string | null;
  is_verified: boolean | null;
  role_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  roles: {
    id: string;
    name: string;
  } | null;
}

export default function DataTable() {
  const [data, setData] = useState<Admin[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 10;
  const supabase = createClient();

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("admins")
        .select("id", { count: "exact", head: true });
      setTotalCount(count || 0);
    };
    fetchCount();
  }, [supabase]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("admins")
        .select(
          `
          id,
          email,
          name,
          is_verified,
          role_id,
          created_at,
          updated_at,
          roles (
            id,
            name
          )
        `,
        )
        .order("created_at", { ascending: false })
        .range(page * limit, page * limit + limit - 1);

      if (!error && data) {
        setData(data as unknown as Admin[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase, page]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Total Admins: <span className="font-semibold">{totalCount}</span>
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            <>
              {data.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      {admin.name || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    {admin.roles?.name ? (
                      <Badge variant="secondary">{admin.roles.name}</Badge>
                    ) : (
                      <span className="text-gray-400">No Role</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.is_verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(admin.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          aria-label="Open menu"
                          size="icon-sm"
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-40" align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              window.open(
                                `/admin/dashboard/Admins/${admin.id}`,
                                "_blank",
                              )
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              window.open(
                                `/admin/dashboard/Admins/new?id=${admin.id}`,
                                "_blank",
                              )
                            }
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {page + 1} of {totalPages || 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
