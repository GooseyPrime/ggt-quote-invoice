"use client";

import Link from "next/link";
import { appPath } from "@/lib/config";

export function Nav() {
  return (
    <nav className="qinv-nav" aria-label="App">
      <Link href={appPath("/")} className="qinv-nav__link">
        Quotes
      </Link>
      <Link href={appPath("/settings")} className="qinv-nav__link">
        Settings
      </Link>
    </nav>
  );
}
