import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AWAKE Connect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Empowering Students</span>
              <span className="block text-blue-600">Through Education</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Connect donors with deserving Pakistani students seeking educational funding. 
              Together, we build a brighter future through education.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link to="/register">
                  <Button size="lg" className="w-full">
                    Start Your Journey
                  </Button>
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Button variant="outline" size="lg" className="w-full">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              How AWAKE Connect Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A simple three-step process to connect students with opportunities
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Students Apply</CardTitle>
                <CardDescription className="text-center">
                  Students submit detailed applications with their academic goals and financial needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Donors Browse</CardTitle>
                <CardDescription className="text-center">
                  Donors explore verified student profiles and choose who to support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Education Funded</CardTitle>
                <CardDescription className="text-center">
                  Secure payments enable students to pursue their educational dreams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Our Impact</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">500+</div>
              <div className="text-lg text-gray-600">Students Helped</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">200+</div>
              <div className="text-lg text-gray-600">Active Donors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">$100K+</div>
              <div className="text-lg text-gray-600">Funds Raised</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to Make a Difference?
          </h2>
          <p className="mt-4 text-lg text-blue-200">
            Join our community of students and donors creating positive change through education.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
                Join AWAKE Connect Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 AWAKE Connect. Empowering education, one student at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;