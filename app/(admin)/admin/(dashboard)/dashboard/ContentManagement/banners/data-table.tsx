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
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontalIcon,
  Image,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  desktop_image_url: string;
  tablet_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  content_placements: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export default function DataTable() {
  const [data, setData] = useState<Banner[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteBanner, setDeleteBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/content/banners?page=${page}&limit=${limit}`,
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setTotalCount(result.totalCount);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/content/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !banner.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error("Error toggling banner status:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteBanner) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/content/banners?id=${deleteBanner.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        setDeleteBanner(null);
        fetchData();
      } else {
        alert(result.error || "Error deleting banner.");
      }
    } catch (error) {
      alert("Error deleting banner. Please try again.");
    }
    setSubmitting(false);
  };

  const isScheduled = (banner: Banner) => {
    const now = new Date();
    const start = banner.start_date ? new Date(banner.start_date) : null;
    const end = banner.end_date ? new Date(banner.end_date) : null;

    if (start && start > now) return "scheduled";
    if (end && end < now) return "expired";
    if (start || end) return "active";
    return null;
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total Banners: <span className="font-semibold">{totalCount}</span>
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((banner) => {
                  const scheduleStatus = isScheduled(banner);
                  return (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div className="w-20 h-12 relative rounded overflow-hidden bg-gray-100">
                          {banner.desktop_image_url ? (
                            <img
                              src={banner.desktop_image_url}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Image className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{banner.title}</p>
                          {banner.subtitle && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {banner.subtitle}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {banner.content_placements ? (
                          <Badge variant="outline">
                            {banner.content_placements.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {banner.tablet_image_url && (
                            <Badge variant="secondary" className="text-xs">
                              T
                            </Badge>
                          )}
                          {banner.mobile_image_url && (
                            <Badge variant="secondary" className="text-xs">
                              M
                            </Badge>
                          )}
                          {!banner.tablet_image_url &&
                            !banner.mobile_image_url && (
                              <span className="text-xs text-gray-400">
                                Desktop only
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {scheduleStatus === "scheduled" && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Scheduled
                          </Badge>
                        )}
                        {scheduleStatus === "expired" && (
                          <Badge className="bg-red-100 text-red-800">
                            Expired
                          </Badge>
                        )}
                        {scheduleStatus === "active" && (
                          <Badge className="bg-green-100 text-green-800">
                            Running
                          </Badge>
                        )}
                        {!scheduleStatus && (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{banner.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={() => toggleActive(banner)}
                        />
                      </TableCell>
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
                                    `/admin/dashboard/ContentManagement/banners/${banner.id}`,
                                  )
                                }
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                onClick={() => setDeleteBanner(banner)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      No banners found. Create your first banner!
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
      <Dialog open={!!deleteBanner} onOpenChange={() => setDeleteBanner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the banner &quot;
              {deleteBanner?.title}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBanner(null)}
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
