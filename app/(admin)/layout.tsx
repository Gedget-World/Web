export const metadata = {
  title: "Admin - Gadgets Kabila",
  description: "Admin Dashboard",
  // Keep admin pages out of search results even if a crawler ignores robots.txt.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
