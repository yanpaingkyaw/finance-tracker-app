import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", shortLabel: "Home", icon: "home" },
  { to: "/transactions", label: "Transactions", shortLabel: "Txns", icon: "transactions" },
  { to: "/categories", label: "Categories", shortLabel: "Cat", icon: "categories" },
  { to: "/budgets", label: "Budgets", shortLabel: "Budget", icon: "budgets" },
  { to: "/reports", label: "Reports", shortLabel: "Report", icon: "reports" },
];

function MobileNavIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
  };

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      {name === "home" ? (
        <>
          <path {...common} d="M3 10.8 12 4l9 6.8" />
          <path {...common} d="M6 10v9h12v-9" />
        </>
      ) : null}
      {name === "transactions" ? (
        <>
          <path {...common} d="M7 7h11" />
          <path {...common} d="m15 4 3 3-3 3" />
          <path {...common} d="M17 17H6" />
          <path {...common} d="m9 14-3 3 3 3" />
        </>
      ) : null}
      {name === "categories" ? (
        <>
          <rect {...common} x="4" y="4" width="6" height="6" rx="1.5" />
          <rect {...common} x="14" y="4" width="6" height="6" rx="1.5" />
          <rect {...common} x="4" y="14" width="6" height="6" rx="1.5" />
          <rect {...common} x="14" y="14" width="6" height="6" rx="1.5" />
        </>
      ) : null}
      {name === "budgets" ? (
        <>
          <path {...common} d="M4 13a8 8 0 1 0 8-8v8Z" />
          <path {...common} d="M12 5a8 8 0 0 1 8 8h-8Z" />
        </>
      ) : null}
      {name === "reports" ? (
        <>
          <path {...common} d="M5 19V5" />
          <path {...common} d="M5 19h14" />
          <path {...common} d="M9 15v-4" />
          <path {...common} d="M13 15V8" />
          <path {...common} d="M17 15v-6" />
        </>
      ) : null}
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell min-h-screen">
      <header className="app-header border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500 sm:text-sm">
              Mini Finance Tracker
            </p>
            <h1 className="font-display text-lg font-bold text-brand-900 sm:text-xl">Budget Health Dashboard</h1>
          </div>
          <div className="shrink-0 text-right">
            <p className="hidden text-sm text-brand-600 sm:block">{user?.email}</p>
            <button className="text-sm font-semibold text-brand-600 transition hover:text-brand-800" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl gap-2 overflow-x-auto px-4 pb-4 sm:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? "app-nav-chip-active text-white"
                    : "app-nav-chip bg-brand-50/90 text-brand-700 hover:bg-brand-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:py-6">{children}</main>
      <nav className="mobile-bottom-nav sm:hidden" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "mobile-bottom-nav-item-active" : ""}`}
          >
            <MobileNavIcon name={item.icon} />
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
