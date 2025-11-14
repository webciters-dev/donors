// src/components/layout/Header.jsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";

export const Nav = ({ active, setActive }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    ...(role === "ADMIN" || role === "SUPER_ADMIN" ? adminTabs : []),
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
          {/* Left: Brand */}
          <div className="flex items-center">
            <div
              className="text-xl font-bold text-green-600 cursor-pointer hover:text-green-700 transition-colors duration-200"
              onClick={() => setActive("home")}
            >
              AWAKE Connect
            </div>
          </div>

          {/* Desktop Navigation */}
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

          {/* Right: Auth Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Desktop User Info */}
                <div className="hidden sm:flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 truncate max-w-[120px]" title={user.email}>
                    {user.email}
                  </span>
                  {role && <Badge variant="secondary">{role === 'SUB_ADMIN' ? 'Case Worker' : role === 'SUPER_ADMIN' ? 'Super Admin' : role}</Badge>}
                </div>

                {/* Desktop Logout */}
                <Button variant="outline" className="hidden sm:inline-flex" onClick={handleLogout}>
                  Logout
                </Button>

                {/* Mobile Menu Button (for authenticated users) */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            ) : (
              <>
                {/* Desktop Auth Buttons */}
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/donor-signup")}
                >
                  Become a Donor
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 hidden sm:inline-flex" 
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>

                {/* Mobile Auth Menu */}
                <div className="sm:hidden flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Navigation Items */}
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={active === tab.key ? "default" : "ghost"}
                  onClick={() => {
                    setActive(tab.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start ${active === tab.key ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  {tab.label}
                </Button>
              ))}

              {/* Mobile User Section */}
              {user && (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-3 px-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{user.email}</span>
                      {role && <Badge variant="secondary" className="text-xs">{role === 'SUB_ADMIN' ? 'Case Worker' : role === 'SUPER_ADMIN' ? 'Super Admin' : role}</Badge>}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      Logout
                    </Button>
                  </div>
                </>
              )}

              {/* Mobile Public Actions */}
              {!user && (
                <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate("/donor-signup");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    Become a Donor
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
