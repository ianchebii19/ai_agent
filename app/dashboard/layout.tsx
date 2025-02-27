"use client";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { NavigationProvider } from "@/lib/NavigationProvider";
import { Authenticated } from "convex/react";


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NavigationProvider>
        <div className="flex">
            <Authenticated>
                <Sidebar />
            </Authenticated>
            <main className="flex-1">
                <Header/>
            {children}
            </main>
        </div>
    </NavigationProvider >
    
  );
}
