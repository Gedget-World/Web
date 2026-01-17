import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PoliciesPage() {
  return (
    <>
      <div className="max-w-4xl mt-10 mb-10 mx-auto px-4">
        <h4 className="text-2xl font-semibold">Policies</h4>
        <div className="flex flex-row mt-8">
          <div className="border rounded-lg px-2 w-full">
            <div className="flex flex-row justify-between items-center p-4">
              <p className=" text-md font-semibold">Terms and conditions</p>
              <Link
                href="/policies/terms"
                className="hover:underline hover:text-blue-700"
              >
                <span className="text-sm">Learn more</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
