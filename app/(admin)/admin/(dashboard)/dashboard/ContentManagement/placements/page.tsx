"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Layout, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Placement {
  id: string;
  name: string;
  description: string | null;
  max_items: number;
  created_at: string;
}

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editPlacement, setEditPlacement] = useState<Placement | null>(null);
  const [deletePlacement, setDeletePlacement] = useState<Placement | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    max_items: 1,
  });

  const fetchPlacements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content/placements");
      const result = await res.json();
      if (result.success) {
        setPlacements(result.data);
      }
    } catch (error) {
      console.error("Error fetching placements:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlacements();
  }, []);

  const openCreateDialog = () => {
    setForm({ name: "", description: "", max_items: 1 });
    setEditPlacement(null);
    setShowDialog(true);
  };

  const openEditDialog = (placement: Placement) => {
    setForm({
      name: placement.name,
      description: placement.description || "",
      max_items: placement.max_items,
    });
    setEditPlacement(placement);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditPlacement(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Note: For simplicity, we're only supporting create.
      // To support edit, you'd need a PUT/PATCH endpoint for placements
      const res = await fetch("/api/content/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (result.success) {
        fetchPlacements();
        closeDialog();
      } else {
        alert(result.error || "Failed to save placement");
      }
    } catch (error) {
      console.error("Error saving placement:", error);
      alert("Failed to save placement");
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletePlacement) return;

    setSubmitting(true);
    try {
      // Note: You'd need to add a DELETE endpoint for placements
      // For now, just close the dialog
      alert("Delete functionality requires API endpoint implementation");
      setDeletePlacement(null);
    } catch (error) {
      console.error("Error deleting placement:", error);
    }
    setSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/ContentManagement">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="h-6 w-6 text-purple-600" />
            Content Placements
          </h1>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" /> Add Placement
        </Button>
      </header>

      <main className="mt-4">
        <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Total Placements:{" "}
            <span className="font-semibold">{placements.length}</span>
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Max Items</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {placements.map((placement) => (
                    <TableRow key={placement.id}>
                      <TableCell className="font-medium">
                        {placement.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {placement.description || (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{placement.max_items}</TableCell>
                      <TableCell>{formatDate(placement.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => openEditDialog(placement)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="text-red-600"
                            onClick={() => setDeletePlacement(placement)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {placements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        No placements found. The default placements should be
                        created by running the SQL migration.
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editPlacement ? "Edit Placement" : "Create Placement"}
            </DialogTitle>
            <DialogDescription>
              {editPlacement
                ? "Update the placement details"
                : "Add a new content placement location"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., homepage_hero"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase with underscores
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe where this placement appears"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_items">Max Items</Label>
              <Input
                id="max_items"
                type="number"
                min="1"
                value={form.max_items}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_items: parseInt(e.target.value) || 1,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of items that can be shown in this placement
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editPlacement ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletePlacement}
        onOpenChange={() => setDeletePlacement(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Placement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the placement &quot;
              {deletePlacement?.name}&quot;? Banners and ads using this
              placement will have their placement set to null.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletePlacement(null)}
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
    </div>
  );
}
