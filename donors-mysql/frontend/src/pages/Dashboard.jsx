import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Header from '../components/layout/Header';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Welcome Card */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Welcome to AWAKE Connect!</CardTitle>
                <CardDescription>
                  {user?.role === 'STUDENT' 
                    ? 'Manage your applications and connect with potential donors.'
                    : user?.role === 'DONOR'
                    ? 'Browse student profiles and make a difference through education.'
                    : 'Manage the platform and oversee all activities.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Role: {user?.role}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Role-specific cards */}
            {user?.role === 'STUDENT' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>My Applications</CardTitle>
                    <CardDescription>
                      View and manage your funding applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/apply">
                      <Button className="w-full">Create Application</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                      Complete your profile to attract donors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      Upload required documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Manage Documents
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {user?.role === 'DONOR' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Student Marketplace</CardTitle>
                    <CardDescription>
                      Browse and support deserving students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/marketplace">
                      <Button className="w-full">Browse Students</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My Sponsorships</CardTitle>
                    <CardDescription>
                      Track your current sponsorships
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Sponsorships
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Impact Report</CardTitle>
                    <CardDescription>
                      See the impact of your contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Impact
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Applications</CardTitle>
                    <CardDescription>
                      Review and approve student applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Review Applications</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Manage Users</CardTitle>
                    <CardDescription>
                      Oversee students and donors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Manage Users
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                      View platform statistics and reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>
                  Current platform statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Active Donors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">$0</div>
                    <div className="text-sm text-gray-600">Total Funded</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;