import type { Metadata } from "next";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
export const metadata: Metadata = { title: "Dashboard", description: "Your local Fitimart wallet, imported items, concepts, and activity." };
export default function DashboardPage() { return <div className="container"><DashboardStats /></div>; }
