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
import { MoreHorizontalIcon, CheckCircle, XCircle } from "lucide-react";

interface Customer {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  preferences: Record<string, unknown> | null;
  marketing_consent: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  phone_verified: boolean;
}

export default function DataTable() {
  const [data, setData] = useState<Customer[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/customers?page=${page}&limit=${limit}`,
        );
        const json = await res.json();
        if (res.ok) {
          setData(json.customers || []);
          setTotalCount(json.totalCount || 0);
        }
      } finally {
        setLoading(false);
      }
    };
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

  const getFullName = (customer: Customer) => {
    const firstName = customer.first_name || "";
    const lastName = customer.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "-";
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Total Customers: <span className="font-semibold">{totalCount}</span>
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Phone Verified</TableHead>
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
              {data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {getFullName(customer)}
                  </TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>
                    {customer.phone_verified ? (
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
                                `/admin/dashboard/Customers/${customer.id}`,
                                "_blank",
                              )
                            }
                          >
                            View Details
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
                    No customers found.
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
