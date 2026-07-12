"use client";

import {
  Bot,
  ChartNoAxesCombined,
  ClipboardList,
  Contact,
  Home,
  Inbox,
  LogOut,
  Menu as MenuIcon,
  MessageSquareText,
  QrCode,
  ShieldCheck,
  Tags,
  Users,
  Utensils,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/admin/AuthProvider";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/reservations", label: "Reservations", icon: Contact },
  { href: "/menu", label: "Menu", icon: Utensils },
  { href: "/promotions", label: "Promotions", icon: Tags },
  { href: "/messages", label: "Messages", icon: Inbox },
  { href: "/campaigns", label: "Campaigns", icon: MessageSquareText },
  { href: "/qr", label: "QR Tools", icon: QrCode },
  { href: "/chatbot", label: "Chatbot", icon: Bot },
  { href: "/users", label: "Admin Users", icon: Users },
  { href: "/reviews", label: "Review Queue", icon: ShieldCheck },
  { href: "/exports", label: "Exports", icon: ChartNoAxesCombined },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
        <div className="brand-row">
          <div className="brand-mark">LW</div>
          <div>
            <strong>Luban Workshop</strong>
            <span>Admin Operations</span>
          </div>
          <button className="icon-button mobile-only" type="button" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="nav-list" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link className={active ? "nav-link nav-link-active" : "nav-link"} href={item.href} key={item.href} onClick={() => setOpen(false)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      {open ? <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} type="button" /> : null}
      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-only" type="button" onClick={() => setOpen(true)} aria-label="Open menu">
            <MenuIcon size={20} />
          </button>
          <div className="topbar-status">
            <span className="live-dot" />
            Firebase secured
          </div>
          <div className="account-chip">
            <span>{user?.email}</span>
            <button className="icon-button" type="button" onClick={() => logout()} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="content">
          <div className="page-fade" key={pathname}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
