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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { MoreHorizontalIcon, Key, Pencil, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
}

export default function DataTable() {
  const [data, setData] = useState<Permission[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editPermission, setEditPermission] = useState<Permission | null>(null);
  const [deletePermission, setDeletePermission] = useState<Permission | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const limit = 10;
  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("name", { ascending: true })
      .range(page * limit, page * limit + limit - 1);

    if (!error && data) {
      setData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("permissions")
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

  const handleEdit = (permission: Permission) => {
    setEditPermission(permission);
    setEditForm({
      name: permission.name,
      description: permission.description || "",
    });
  };

  const handleEditSubmit = async () => {
    if (!editPermission) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("permissions")
      .update({
        name: editForm.name,
        description: editForm.description || null,
      })
      .eq("id", editPermission.id);

    if (!error) {
      setEditPermission(null);
      fetchData();
    } else {
      alert("Error updating permission. Please try again.");
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletePermission) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("permissions")
      .delete()
      .eq("id", deletePermission.id);

    if (!error) {
      setDeletePermission(null);
      fetchData();
      // Update total count
      setTotalCount((prev) => prev - 1);
    } else {
      alert("Error deleting permission. It may be in use by roles or admins.");
    }
    setSubmitting(false);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total Permissions:{" "}
            <span className="font-semibold">{totalCount}</span>
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-600" />
                        {permission.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {permission.description || (
                        <span className="text-gray-400">No description</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(permission.created_at)}</TableCell>
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
                              onClick={() => handleEdit(permission)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => setDeletePermission(permission)}
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
                    <TableCell colSpan={4} className="text-center py-6">
                      No permissions found.
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

      {/* Edit Dialog */}
      <Dialog
        open={!!editPermission}
        onOpenChange={() => setEditPermission(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update the permission name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., create_product"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what this permission allows"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditPermission(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletePermission}
        onOpenChange={() => setDeletePermission(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the permission &quot;
              {deletePermission?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletePermission(null)}
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
