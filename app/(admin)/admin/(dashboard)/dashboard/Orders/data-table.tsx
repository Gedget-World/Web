"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
import Image from "next/image";
import { MoreHorizontalIcon } from "lucide-react";

export default function DataTable() {
  const [data, setData] = useState<any[]>([]);
  // const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("orders")
        .select("*")
        .range(page * limit, page * limit + limit - 1);
      const { data, error } = await query;
      console.log("Fetched data:", data);
      if (!error && data) setData(data);
    };
    fetchData();
  }, [supabase, page]);

  return (
    <div className="space-y-1 border border-gray-300 p-4 rounded-lg">
      {/* <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => {
          setPage(0);
          setSearch(e.target.value);
        }}
        className="max-w-sm"
      /> */}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Tracking Number</TableHead>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="flex flex-row align-middle items-center">
                {/* <div className="mr-2 mt-1 rounded-sm overflow-hidden">
                  <Image src={row.image_url} width={20} height={20} />
                </div> */}
                <div className="mt-1">{row.customer_name}</div>
              </TableCell>
              <TableCell>{row.tracking_number}</TableCell>
              <TableCell>{row.invoice_number}</TableCell>
              <TableCell>&#8377;{row.total}</TableCell>
              <TableCell>{row.status}</TableCell>
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
                      <DropdownMenuItem className="cursor-pointer">
                        View Order
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-6">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
