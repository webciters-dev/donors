// src/components/layout/Header.jsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export const Nav = ({ active, setActive }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role;

  // Build tabs based on role
  const baseTabs = [
    { key: "home", label: "Landing" },
  ];

  const studentTabs = [
    { key: "myapplication", label: "My Application" },
    { key: "studentprofile", label: "My Profile" },
  ];

  const donorTabs = [
    { key: "marketplace", label: "Sponsor a Student" },
    { key: "donor", label: "My Dashboard" }
  ];
  
  const adminTabs = [{ key: "admin", label: "Admin" }];

  // For unauthenticated users - show public browse and apply
  const unauthedTabs = [
    { key: "browse", label: "Find Students to Help" },
    { key: "apply", label: "Apply for Aid" }
  ];

  const tabs = [
    ...baseTabs,
    ...(role === "STUDENT" ? studentTabs : []),
    ...(role === "DONOR" ? donorTabs : []),
    ...(role === "ADMIN" ? adminTabs : []),
    ...(!role ? unauthedTabs : []),
  ];

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Tabs */}
          <div className="flex items-center space-x-8">
            <div
              className="text-xl font-bold text-emerald-600 cursor-pointer"
              onClick={() => setActive("home")}
            >
              AWAKE Connect
            </div>

            <nav className="hidden md:flex space-x-2">
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

          {/* Right: Auth-aware controls */}
          <div className="flex items-center gap-3 text-sm text-slate-700">
            {user ? (
              <>
                {/* Admin shortcut to Applications table */}
                {role === "ADMIN" && (
                  <Button
                    variant={active === "admin" ? "default" : "outline"}
                    className="rounded-2xl hidden sm:inline-flex"
                    onClick={() => navigate("/admin/applications")}
                  >
                    Applications
                  </Button>
                )}

                <div className="hidden sm:flex items-center gap-2">
                  <span
                    className="text-slate-600 truncate max-w-[180px]"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                  {role && <Badge variant="secondary">{role}</Badge>}
                </div>

                <Button variant="outline" className="rounded-2xl" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                {/* Donor signup CTA for logged-out visitors */}
                <Button
                  variant="outline"
                  className="rounded-2xl hidden sm:inline-flex"
                  onClick={() => navigate("/donor-signup")}
                >
                  Donor Sign Up
                </Button>
                <Button className="rounded-2xl" onClick={() => navigate("/login")}>
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
