import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  GraduationCap, 
  Heart, 
  Shield, 
  Users, 
  DollarSign, 
  BookOpen,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import heroImage from "@/assets/hero-students.jpg";

export const Landing = () => {
  const stats = [
    { label: "Students Funded", value: "1,247", icon: GraduationCap },
    { label: "Active Donors", value: "856", icon: Heart },
    { label: "Total Disbursed", value: "$2.1M", icon: DollarSign },
    { label: "Universities", value: "45", icon: BookOpen },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Students Apply",
      description: "Students submit applications with their academic records and financial needs.",
      icon: GraduationCap,
    },
    {
      step: "2",
      title: "Donors Browse",
      description: "Donors explore student profiles and choose who to support based on their criteria.",
      icon: Heart,
    },
    {
      step: "3",
      title: "Funds Transfer",
      description: "Secure payments are processed and funds are disbursed directly to universities.",
      icon: DollarSign,
    },
  ];

  const features = [
    "100% Transparent Fund Usage",
    "Direct University Disbursement",
    "Real-time Progress Tracking",
    "Verified Student Profiles",
    "Secure Payment Processing",
    "Tax-deductible Donations",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Empowering Education Through
                  <span className="text-secondary"> Compassionate</span> Giving
                </h1>
                <p className="text-xl opacity-90 leading-relaxed">
                  Connect with deserving students across Pakistan and help them achieve their educational dreams. 
                  Every donation creates a ripple of positive change.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/marketplace">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    <Users className="mr-2 h-5 w-5" />
                    Explore Students
                  </Button>
                </Link>
                <Link to="/auth/register?role=student">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    I'm a Student
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-secondary rounded-2xl blur-3xl opacity-30" />
              <img
                src={heroImage}
                alt="Students studying together"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A simple, transparent process that connects generous hearts with deserving minds
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {step.step}
                      </div>
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Why Choose AWAKE Connect?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Built on trust, transparency, and the unwavering belief that education can change lives.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                    <span className="text-foreground font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/auth/register?role=donor">
                <Button variant="hero" size="lg" className="group">
                  Become a Donor Today
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <Card className="p-8 bg-gradient-card border-none shadow-xl">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Shield className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-2xl font-bold text-foreground">Trust & Security</h3>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>Every student profile is verified by our dedicated team.</p>
                  <p>Funds are disbursed directly to educational institutions.</p>
                  <p>Real-time tracking ensures complete transparency.</p>
                  <p>Secure payment processing with industry-standard encryption.</p>
                </div>
                <Link to="/admin">
                  <Button variant="outline" className="w-full">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Portal
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Make a Difference?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of donors and students who are building a brighter future together.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace">
              <Button variant="secondary" size="lg">
                Start Exploring Students
              </Button>
            </Link>
            <Link to="/student/apply">
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                Submit Application
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};