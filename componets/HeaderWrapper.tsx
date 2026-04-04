'use client';

import { usePathname } from "next/navigation";
import Header2 from "@/componets/Header2";

export default function HeaderWrapper() {
  const pathname = usePathname();
  const hideHeader = pathname === "/login" || pathname === "/apply";

  if (hideHeader) return null;

  return <Header2 />;
}
