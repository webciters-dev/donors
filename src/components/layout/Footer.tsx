import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gradient-primary text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold">AWAKE Connect</span>
                <span className="text-sm opacity-80">Akhuwat USA</span>
              </div>
            </div>
            <p className="text-sm opacity-90">
              Connecting donors with students to build a brighter future through education.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/marketplace" className="opacity-90 hover:opacity-100 transition-opacity">
                  Explore Students
                </Link>
              </li>
              <li>
                <Link to="/auth/register?role=student" className="opacity-90 hover:opacity-100 transition-opacity">
                  I'm a Student
                </Link>
              </li>
              <li>
                <Link to="/auth/register?role=donor" className="opacity-90 hover:opacity-100 transition-opacity">
                  Become a Donor
                </Link>
              </li>
              <li>
                <Link to="/admin" className="opacity-90 hover:opacity-100 transition-opacity">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="opacity-90 hover:opacity-100 transition-opacity">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="opacity-90 hover:opacity-100 transition-opacity">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="opacity-90 hover:opacity-100 transition-opacity">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="opacity-90 hover:opacity-100 transition-opacity">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 opacity-80" />
                <span className="opacity-90">info@akhuwatusa.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 opacity-80" />
                <span className="opacity-90">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 opacity-80" />
                <span className="opacity-90">United States</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-sm opacity-80">
            © 2024 Akhuwat USA. All rights reserved. | Empowering education through compassionate giving.
          </p>
        </div>
      </div>
    </footer>
  );
};