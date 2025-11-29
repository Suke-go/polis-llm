"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function DashboardLink() {
  return (
    <Link href="/">
      <Button variant="ghost" size="sm" className="text-text-sub hover:text-primary">
        Move to Dashboard
      </Button>
    </Link>
  );
}

