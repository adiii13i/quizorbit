"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
               style={{ borderColor: "#595BC1" }}></div>
          <p style={{ color: "#475569" }} className="text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}