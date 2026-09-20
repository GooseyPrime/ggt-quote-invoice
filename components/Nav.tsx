"use client";

import Link from "next/link";
import { toolPath } from "@/lib/config";

export function Nav() {
  return (
    <nav className="qinv-nav" aria-label="App">
      <Link href={toolPath("/")} className="qinv-nav__link">
        Quotes
      </Link>
      <Link href={toolPath("/settings")} className="qinv-nav__link">
        Settings
      </Link>
    </nav>
  );
}
