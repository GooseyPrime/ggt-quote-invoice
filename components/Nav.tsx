"use client";

import Link from "next/link";

export function Nav() {
  return (
    <nav className="qinv-nav" aria-label="App">
      <Link href="/" className="qinv-nav__link">
        Quotes
      </Link>
      <Link href="/settings" className="qinv-nav__link">
        Settings
      </Link>
    </nav>
  );
}
