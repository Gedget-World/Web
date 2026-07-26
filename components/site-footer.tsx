import Link from "next/link";
import Image from "next/image";
import BASE_LOGO from "@/content/assets/logo/base-logo.png";
import { BrandName } from "@/components/brand-name";

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-gray-100">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-6 mb-10">
          {/* Brand Column */}
          <div className="col-span-full lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image src={BASE_LOGO} alt="Logo" width={40} height={40} />
              <BrandName size="md" />
            </Link>
            <p className="mt-3 text-sm text-gray-600">
              Your trusted destination for premium gadgets and electronics.
            </p>
          </div>

          <div>
            <div className="mt-3 grid space-y-3 text-sm">
              <Link
                href="/about-us"
                className="text-gray-600 hover:text-gray-800"
              >
                About Us
              </Link>
              <Link
                href="/policies/shipping-and-delivery-policy"
                className="text-gray-600 hover:text-gray-800"
              >
                Shipping Info, Returns & Refunds
              </Link>
              <Link
                href="/contact-us"
                className="text-gray-600 hover:text-gray-800"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div>
            <div className="mt-3 grid space-y-3 text-sm">
              <Link
                href="/policies/terms-and-conditions"
                className="text-gray-600 hover:text-gray-800"
              >
                Terms and Conditions
              </Link>
              <Link
                href="/policies/privacy-policy"
                className="text-gray-600 hover:text-gray-800"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Shop */}
          {/* <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase">
              Shop
            </h4>
            <div className="mt-3 grid space-y-3 text-sm">
              <Link
                href="/products"
                className="text-gray-600 hover:text-gray-800"
              >
                All Products
              </Link>
              <Link
                href="/products?sort=newest"
                className="text-gray-600 hover:text-gray-800"
              >
                New Arrivals
              </Link>
              <Link
                href="/products?featured=true"
                className="text-gray-600 hover:text-gray-800"
              >
                Best Sellers
              </Link>
            </div>
          </div> */}

          {/* Customer Service */}
          {/* <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase">
              Customer Service
            </h4>
            <div className="mt-3 grid space-y-3 text-sm">
              <Link
                href="/contact-us"
                className="text-gray-600 hover:text-gray-800"
              >
                Contact Us
              </Link>
              <Link
                href="/orders"
                className="text-gray-600 hover:text-gray-800"
              >
                Track Order
              </Link>
              <Link
                href="/policies/shipping-and-delivery-policy"
                className="text-gray-600 hover:text-gray-800"
              >
                Shipping Info, Returns & Refunds
              </Link>
            </div>
          </div> */}

          {/* Company */}
          {/* <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase">
              Company
            </h4>
            <div className="mt-3 grid space-y-3 text-sm">
              <Link
                href="/about-us"
                className="text-gray-600 hover:text-gray-800"
              >
                About Us
              </Link>
              <Link href="/help" className="text-gray-600 hover:text-gray-800">
                Help Center
              </Link>
            </div>
          </div> */}

          {/* Legal */}
          {/* <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase">
              Legal
            </h4>
            <div className="mt-3 grid space-y-3 text-sm">
              <Link
                href="/policies/terms-and-conditions"
                className="text-gray-600 hover:text-gray-800"
              >
                Terms of Service
              </Link>
              <Link
                href="/policies/privacy-policy"
                className="text-gray-600 hover:text-gray-800"
              >
                Privacy Policy
              </Link>
            </div>
          </div> */}
        </div>

        {/* Bottom Bar */}
        <div className="pt-5 mt-5 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mr-10 gap-4">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Gadgets Kabila. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/gadgetskabila/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="Instagram"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@GadgetsKabilaOfficial"
                className="text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="YouTube"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a2.997 2.997 0 0 0-2.11-2.12C19.507 3.5 12 3.5 12 3.5s-7.507 0-9.388.566a2.997 2.997 0 0 0-2.11 2.12C0 8.086 0 12 0 12s0 3.914.502 5.814a2.997 2.997 0 0 0 2.11 2.12C4.493 20.5 12 20.5 12 20.5s7.507 0 9.388-.566a2.997 2.997 0 0 0 2.11-2.12C24 15.914 24 12 24 12s0-3.914-.502-5.814zM9.75 15.568V8.432L16.5 12l-6.75 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
