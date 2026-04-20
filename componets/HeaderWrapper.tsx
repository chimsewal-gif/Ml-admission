'use client';

import { usePathname } from "next/navigation";
import Header2 from "@/componets/Header2";

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Define routes where header should be hidden
  const hideHeaderRoutes = [
    "/login",
    "/apply",
    "/how-to-apply",
    "/forgot-password",
    "/reset-password",
    "/register",
    "/"
  ];
  
  const hideHeader = hideHeaderRoutes.includes(pathname);

  if (hideHeader) return null;

  return <Header2 />;
}