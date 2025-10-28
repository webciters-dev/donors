import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', roles: ['STUDENT', 'DONOR', 'ADMIN', 'SUB_ADMIN'] },
    { path: '/marketplace', label: 'Marketplace', roles: ['DONOR', 'ADMIN', 'SUB_ADMIN'] },
    { path: '/apply', label: 'Apply', roles: ['STUDENT'] },
  ];

  const visibleLinks = navLinks.filter(link => 
    !link.roles || link.roles.includes(user?.role)
  );

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              AWAKE Connect
            </Link>
            
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-6">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {user?.name}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {user?.role}
                </span>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <div className="space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;