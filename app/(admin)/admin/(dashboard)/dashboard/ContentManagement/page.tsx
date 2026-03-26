import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Image, Megaphone, Layout, Settings } from "lucide-react";

export default function ContentManagementPage() {
  const sections = [
    {
      title: "Banners",
      description:
        "Manage hero banners, promotional banners, and carousel slides with responsive images for desktop, tablet, and mobile.",
      icon: Image,
      href: "/admin/dashboard/ContentManagement/banners",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Advertisements",
      description:
        "Create and manage advertisements with click tracking, impression limits, and campaign grouping.",
      icon: Megaphone,
      href: "/admin/dashboard/ContentManagement/advertisements",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Placements",
      description:
        "Configure content placement locations where banners and ads can be displayed on your site.",
      icon: Layout,
      href: "/admin/dashboard/ContentManagement/placements",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Carousels",
      description:
        "Set up banner carousels/sliders with customizable settings like autoplay, arrows, and dots.",
      icon: Settings,
      href: "/admin/dashboard/ContentManagement/carousels",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="mx-4 my-2">
      <header className="p-2 mb-6">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage banners, advertisements, and other promotional content across
          your website.
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Card
            key={section.title}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${section.bgColor}`}>
                  <section.icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {section.description}
              </CardDescription>
              <Link href={section.href}>
                <Button variant="outline" className="w-full">
                  Manage {section.title}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
