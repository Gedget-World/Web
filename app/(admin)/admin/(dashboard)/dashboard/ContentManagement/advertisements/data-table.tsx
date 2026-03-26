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
  Megaphone,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Advertisement {
  id: string;
  name: string;
  ad_type: string;
  desktop_content_url: string;
  tablet_content_url: string | null;
  mobile_content_url: string | null;
  click_url: string | null;
  is_active: boolean;
  priority: number;
  campaign_name: string | null;
  max_impressions: number | null;
  max_clicks: number | null;
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
  const [data, setData] = useState<Advertisement[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteAd, setDeleteAd] = useState<Advertisement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/content/advertisements?page=${page}&limit=${limit}`,
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setTotalCount(result.totalCount);
      }
    } catch (error) {
      console.error("Error fetching advertisements:", error);
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

  const toggleActive = async (ad: Advertisement) => {
    try {
      const res = await fetch(`/api/content/advertisements/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !ad.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error("Error toggling ad status:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteAd) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/content/advertisements?id=${deleteAd.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        setDeleteAd(null);
        fetchData();
      } else {
        alert(result.error || "Error deleting advertisement.");
      }
    } catch (error) {
      alert("Error deleting advertisement. Please try again.");
    }
    setSubmitting(false);
  };

  const isScheduled = (ad: Advertisement) => {
    const now = new Date();
    const start = ad.start_date ? new Date(ad.start_date) : null;
    const end = ad.end_date ? new Date(ad.end_date) : null;

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
            Total Advertisements:{" "}
            <span className="font-semibold">{totalCount}</span>
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((ad) => {
                  const scheduleStatus = isScheduled(ad);
                  return (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="w-20 h-12 relative rounded overflow-hidden bg-gray-100">
                          {ad.ad_type === "image" && ad.desktop_content_url ? (
                            <img
                              src={ad.desktop_content_url}
                              alt={ad.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Megaphone className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{ad.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ad.ad_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {ad.content_placements ? (
                          <Badge variant="secondary">
                            {ad.content_placements.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ad.campaign_name ? (
                          <span className="text-sm">{ad.campaign_name}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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
                        <div className="text-xs">
                          {ad.max_impressions && (
                            <div>Imp: {ad.max_impressions}</div>
                          )}
                          {ad.max_clicks && <div>Clicks: {ad.max_clicks}</div>}
                          {!ad.max_impressions && !ad.max_clicks && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={ad.is_active}
                          onCheckedChange={() => toggleActive(ad)}
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
                                    `/admin/dashboard/ContentManagement/advertisements/${ad.id}`,
                                  )
                                }
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                onClick={() => setDeleteAd(ad)}
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
                    <TableCell colSpan={9} className="text-center py-6">
                      No advertisements found. Create your first ad!
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
      <Dialog open={!!deleteAd} onOpenChange={() => setDeleteAd(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Advertisement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the advertisement &quot;
              {deleteAd?.name}&quot;? This will also delete all analytics data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAd(null)}
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
