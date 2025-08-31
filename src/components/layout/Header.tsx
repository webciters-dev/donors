import { Button } from "@/components/ui/button";
import { Bell, UserRound } from "lucide-react";

const classNames = (...c: (string | boolean | undefined)[]) => c.filter(Boolean).join(" ");

const SecondaryButton = ({ children, className = "", ...props }: any) => (
  <button
    className={classNames(
      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium border shadow-sm",
      "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

interface NavProps {
  active: string;
  setActive: (tab: string) => void;
}

export const Nav = ({ active, setActive }: NavProps) => {
  const tabs = [
    { key: "home", label: "Home" },
    { key: "marketplace", label: "Marketplace" },
    { key: "donor", label: "Donor Dashboard" },
    { key: "apply", label: "Application" },
    { key: "admin", label: "Admin Hub" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => setActive("home")} 
          className="flex items-center gap-3 focus:outline-none" 
          aria-label="Go to Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold">
            A
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold leading-tight text-slate-900">AWAKE Connect</div>
            <div className="text-xs text-slate-500">Donors × Students × Impact</div>
          </div>
        </button>
        
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={classNames(
                "rounded-2xl px-3 py-2 text-sm",
                active === tab.key ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="flex items-center gap-2">
          <SecondaryButton aria-label="Notifications"><Bell className="h-4 w-4"/></SecondaryButton>
          <SecondaryButton aria-label="Account"><UserRound className="h-4 w-4"/></SecondaryButton>
        </div>
      </div>
    </header>
  );
};