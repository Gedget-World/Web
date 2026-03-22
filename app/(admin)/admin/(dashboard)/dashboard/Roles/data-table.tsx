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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  MoreHorizontalIcon,
  ShieldCheck,
  Trash2,
  Loader2,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  permission_count?: number;
}

export default function DataTable() {
  const [data, setData] = useState<Role[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;
  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);

    // Fetch roles
    const { data: rolesData, error } = await supabase
      .from("roles")
      .select("*")
      .order("name", { ascending: true })
      .range(page * limit, page * limit + limit - 1);

    if (!error && rolesData) {
      // Fetch permission counts for each role
      const rolesWithCounts = await Promise.all(
        rolesData.map(async (role) => {
          const { count } = await supabase
            .from("role_permissions")
            .select("id", { count: "exact", head: true })
            .eq("role_id", role.id);
          return { ...role, permission_count: count || 0 };
        }),
      );
      setData(rolesWithCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("roles")
        .select("id", { count: "exact", head: true });
      setTotalCount(count || 0);
    };
    fetchCount();
  }, [supabase]);

  useEffect(() => {
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

  const handleDelete = async () => {
    if (!deleteRole) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", deleteRole.id);

    if (!error) {
      setDeleteRole(null);
      fetchData();
      setTotalCount((prev) => prev - 1);
    } else {
      alert("Error deleting role. It may be assigned to admins.");
    }
    setSubmitting(false);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total Roles: <span className="font-semibold">{totalCount}</span>
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {role.description || (
                        <span className="text-gray-400">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {role.permission_count} permissions
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(role.created_at)}</TableCell>
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
                                router.push(
                                  `/admin/dashboard/Roles/new?id=${role.id}`,
                                )
                              }
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View / Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => setDeleteRole(role)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No roles found.
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role &quot;{deleteRole?.name}
              &quot;? This will also remove all associated permissions. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRole(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
