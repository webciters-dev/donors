import { Button } from "@/components/ui/button";

export const Nav = ({ active, setActive }) => {
  const tabs = [
    { key: "home", label: "Landing" },
    { key: "marketplace", label: "Marketplace" },
    { key: "donor", label: "Donor" },
    { key: "apply", label: "Apply" },
    { key: "admin", label: "Admin" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="text-xl font-bold text-emerald-600">
              AWAKE Connect
            </div>
            <nav className="hidden md:flex space-x-4">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={active === tab.key ? "default" : "ghost"}
                  onClick={() => setActive(tab.key)}
                  className="rounded-2xl"
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="text-sm text-slate-600">
            Akhuwat USA
          </div>
        </div>
      </div>
    </header>
  );
};