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
  Settings,
  Trash2,
  Loader2,
  Pencil,
  Play,
  Pause,
  Image,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Carousel {
  id: string;
  name: string;
  placement_id: string | null;
  auto_play: boolean;
  interval_ms: number;
  show_arrows: boolean;
  show_dots: boolean;
  infinite_loop: boolean;
  pause_on_hover: boolean;
  is_active: boolean;
  banner_count: number;
  created_at: string;
  content_placements: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export default function CarouselsDataTable() {
  const [data, setData] = useState<Carousel[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteCarousel, setDeleteCarousel] = useState<Carousel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/content/carousels?page=${page}&limit=${limit}`,
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setTotalCount(result.totalCount);
      }
    } catch (error) {
      console.error("Error fetching carousels:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleActive = async (carousel: Carousel) => {
    try {
      const res = await fetch(`/api/content/carousels/${carousel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !carousel.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error("Error toggling carousel status:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteCarousel) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/content/carousels?id=${deleteCarousel.id}`,
        {
          method: "DELETE",
        },
      );
      const result = await res.json();

      if (result.success) {
        setDeleteCarousel(null);
        fetchData();
      } else {
        alert(result.error || "Error deleting carousel.");
      }
    } catch (error) {
      alert("Error deleting carousel. Please try again.");
    }
    setSubmitting(false);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total Carousels: <span className="font-semibold">{totalCount}</span>
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Banners</TableHead>
              <TableHead>Settings</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((carousel) => (
                  <TableRow key={carousel.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">{carousel.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {carousel.content_placements ? (
                        <Badge variant="secondary">
                          {carousel.content_placements.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Image className="w-4 h-4 text-gray-400" />
                        <span>{carousel.banner_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {carousel.auto_play ? (
                          <Badge variant="outline" className="text-xs">
                            <Play className="w-3 h-3 mr-1" />
                            {carousel.interval_ms / 1000}s
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Pause className="w-3 h-3 mr-1" />
                            Manual
                          </Badge>
                        )}
                        {carousel.infinite_loop && (
                          <Badge variant="outline" className="text-xs">
                            ∞
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(carousel.created_at)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={carousel.is_active}
                        onCheckedChange={() => toggleActive(carousel)}
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
                                  `/admin/dashboard/ContentManagement/carousels/${carousel.id}`,
                                )
                              }
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => setDeleteCarousel(carousel)}
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
                    <TableCell colSpan={7} className="text-center py-6">
                      <p className="text-gray-500">No carousels found</p>
                      <Button
                        variant="link"
                        onClick={() =>
                          router.push(
                            "/admin/dashboard/ContentManagement/carousels/new",
                          )
                        }
                      >
                        Create your first carousel
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteCarousel}
        onOpenChange={() => setDeleteCarousel(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Carousel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteCarousel?.name}
              &quot;? This will also remove all banner associations. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCarousel(null)}>
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
