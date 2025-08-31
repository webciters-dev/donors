import { Button } from "@/components/ui/button";

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
          <span className="text-lg font-semibold text-slate-900">AWAKE Connect</span>
        </button>
        
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-3 py-2 rounded-2xl text-sm font-medium transition-colors ${
                active === tab.key
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Login
          </Button>
          <Button size="sm">
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};