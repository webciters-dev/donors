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
    { key: "home", label: "Home" },
  ];

  const studentTabs = (() => {
    if (user?.studentPhase === 'ACTIVE') {
      // Active students see clean dashboard and communication
      return [
        { key: "activestudent", label: "Dashboard" },
        { key: "studentprofile", label: "Profile" },
      ];
    } else {
      // Application phase students see application interface
      return [
        { key: "myapplication", label: "Application Status" },
        { key: "studentprofile", label: "Profile" },
      ];
    }
  })();

  const donorTabs = [
    { key: "marketplace", label: "Find Students" },
    { key: "donor", label: "Dashboard" }
  ];
  
  const adminTabs = [{ key: "admin", label: "Administration" }];

  // For unauthenticated users - show public browse and apply
  const unauthedTabs = [
    { key: "browse", label: "Find Students" },
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Tabs */}
          <div className="flex items-center space-x-8">
            <div
              className="text-xl font-bold text-green-600 cursor-pointer hover:text-green-700 transition-colors duration-200"
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
                  className={active === tab.key ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Right: Auth-aware controls */}
          <div className="flex items-center gap-3 text-sm text-gray-700">
            {user ? (
              <>
                {/* Admin navigation links */}
                {role === "ADMIN" && (
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/admin/payments")}
                    >
                      Payments
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/admin/disbursements")}
                    >
                      Disbursements
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/admin/donors")}
                    >
                      Donors
                    </Button>
                    <Button
                      variant={active === "admin" ? "default" : "outline"}
                      className={active === "admin" ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={() => navigate("/admin/applications")}
                    >
                      Applications
                    </Button>
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-2">
                  <span
                    className="text-gray-600 truncate max-w-[180px]"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                  {role && <Badge variant="secondary">{role === 'SUB_ADMIN' ? 'Sub Admin' : role}</Badge>}
                </div>

                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                {/* Donor signup CTA for logged-out visitors */}
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/donor-signup")}
                >
                  Become a Donor
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate("/login")}>
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
