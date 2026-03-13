"use client"

import * as React from "react"
import {
  BookOpen,
  Command,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Receipt,
  HandCoins,
  User,
  Loader2,
  Repeat,
  ShoppingBag,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { businessApi } from "@/lib/api"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
import { useSession } from "@/lib/auth-client"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "POS",
      url: "/dashboard/pos",
      icon: ShoppingCart,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: Package,
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: BookOpen,
    },
    {
      title: "Sales",
      url: "/dashboard/sales",
      icon: ShoppingCart,
    },
    {
      title: "Suppliers",
      url: "/dashboard/suppliers",
      icon: Users,
    },
    {
      title: "Purchases",
      url: "/dashboard/purchases",
      icon: ShoppingBag,
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: Users,
    },
    {
      title: "Analysis",
      url: "/dashboard/analysis",
      icon: LineChart,
    },
    {
      title: "Expenses",
      url: "/dashboard/expenses",
      icon: Receipt,
    },
    {
      title: "Recurring Expenses",
      url: "/dashboard/recurring-expenses",
      icon: Repeat,
    },
    {
      title: "Loans",
      url: "/dashboard/loans",
      icon: HandCoins,
    },
    {
      title: "Staff",
      url: "/dashboard/staff",
      icon: Users,
    },
  ],
  projects: [
    {
      name: "Profile",
      url: "/dashboard/profile",
      icon: User,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const data = await businessApi.getAllMyBusinesses();
        const mappedBusinesses = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          logo: Command,
          plan: `${b.type || "Shop"} • ${b.role === "OWNER" ? "Owner" : "Staff"}`,
        }));
        setBusinesses(mappedBusinesses);
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchBusinesses();
    } else if (session === null) {
      // Stop loading if there's definitively no session
      setLoading(false);
    }
  }, [session]);

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@najax.com",
    avatar: "/avatars/user.jpg",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {loading ? (
          <div className="flex items-center gap-2 p-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold text-sm">Loading...</span>
              <span className="text-xs text-muted-foreground">Fetching businesses</span>
            </div>
          </div>
        ) : (
          <TeamSwitcher teams={businesses} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

