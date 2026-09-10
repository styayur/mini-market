import type { Metadata } from "next";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
export const metadata: Metadata = { title: "Dashboard", description: "Your local marketplace library, concepts, and watchlist." };
export default function DashboardPage() { return <div className="container"><DashboardStats /></div>; }
