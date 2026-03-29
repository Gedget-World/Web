"use client";

import { useState, useEffect, useMemo } from "react";
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
import { MoreHorizontalIcon, Loader2 } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
}

export default function DataTable() {
  const [data, setData] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const query = supabase
        .from("products")
        .select("id, name, slug, price, stock, image_url, is_active")
        .ilike("name", `%${search}%`)
        .range(page * limit, page * limit + limit - 1);
      const { data, error } = await query;
      if (!error && data) {
        setData(data);
        setHasMore(data.length === limit);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase, search, page]);

  return (
    <div className="space-y-1 border border-gray-300 p-4 rounded-lg">
      <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => {
          setPage(0);
          setSearch(e.target.value);
        }}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {/* <TableHead>Description</TableHead> */}
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6">
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="flex flex-row align-middle items-center min-w-0">
                  {row.image_url && (
                    <div className="mr-2 mt-1 aspect-square rounded-sm overflow-hidden">
                      <Image
                        src={row.image_url}
                        alt={row.name}
                        width={20}
                        height={20}
                      />
                    </div>
                  )}
                  <div className="mt-1 min-w-0 max-w-xs">
                    <Link
                      href={`/admin/dashboard/Products/view/${row.id}`}
                      className="hover:text-blue-800 hover:underline truncate block"
                    >
                      {row.name}
                    </Link>
                  </div>
                </TableCell>
                {/* <TableCell>{row.description}</TableCell> */}
                <TableCell>&#8377;{row.price}</TableCell>
                <TableCell
                  className={row.stock < 5 ? "text-red-600 font-semibold" : ""}
                >
                  {row.stock}
                </TableCell>
                <TableCell>
                  {row.is_active ? (
                    <Badge className="rounded-full border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5">
                      <span
                        className="size-1.5 rounded-full bg-green-600 dark:bg-green-400"
                        aria-hidden="true"
                      />
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-600/10 [a&]:hover:bg-red-600/5 focus-visible:ring-red-600/20 dark:focus-visible:ring-red-600/40 text-red-400 rounded-full border-none focus-visible:outline-none">
                      <span
                        className="bg-red-600 size-1.5 rounded-full"
                        aria-hidden="true"
                      />
                      Inactive
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
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link
                            href={`/admin/dashboard/Products/view/${row.id}`}
                          >
                            View Product
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/admin/dashboard/Products/${row.id}`}>
                            Edit Product
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link
                            href={`/products/${row.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Site
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
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
        <Button
          variant="outline"
          disabled={!hasMore}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
