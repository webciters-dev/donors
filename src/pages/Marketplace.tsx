import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter,
  GraduationCap,
  MapPin,
  Calendar,
  Heart,
  TrendingUp
} from "lucide-react";

// Mock data for students
const mockStudents = [
  {
    id: "1",
    firstName: "Ayesha",
    lastName: "Khan",
    program: "BS Computer Science",
    university: "University of Punjab",
    city: "Lahore",
    province: "Punjab",
    field: "Computer Science",
    gpa: 3.8,
    gradYear: 2025,
    gender: "F",
    needUSD: 5000,
    fundedUSD: 3200,
    status: "active"
  },
  {
    id: "2",
    firstName: "Muhammad",
    lastName: "Ali",
    program: "MBBS",
    university: "Dow University",
    city: "Karachi",
    province: "Sindh",
    field: "Medicine",
    gpa: 3.9,
    gradYear: 2026,
    gender: "M",
    needUSD: 8000,
    fundedUSD: 2400,
    status: "active"
  },
  {
    id: "3",
    firstName: "Fatima",
    lastName: "Ahmed",
    program: "BBA Finance",
    university: "LUMS",
    city: "Lahore",
    province: "Punjab",
    field: "Business",
    gpa: 3.7,
    gradYear: 2024,
    gender: "F",
    needUSD: 4500,
    fundedUSD: 4500,
    status: "funded"
  },
  {
    id: "4",
    firstName: "Hassan",
    lastName: "Sheikh",
    program: "BE Electrical",
    university: "NUST",
    city: "Islamabad",
    province: "ICT",
    field: "Engineering",
    gpa: 3.6,
    gradYear: 2025,
    gender: "M",
    needUSD: 6000,
    fundedUSD: 1800,
    status: "active"
  },
];

export const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = !selectedProgram || student.program.includes(selectedProgram);
    const matchesGender = !selectedGender || student.gender === selectedGender;
    const matchesProvince = !selectedProvince || student.province === selectedProvince;
    const matchesCity = !selectedCity || student.city === selectedCity;

    return matchesSearch && matchesProgram && matchesGender && matchesProvince && matchesCity;
  });

  const handleFundStudent = (studentId: string) => {
    // In a real app, this would open a payment modal
    alert(`Funding student ${studentId} - This would open Stripe checkout`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-primary text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">Student Marketplace</h1>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Discover talented students from across Pakistan and help them achieve their educational dreams
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, university, or program..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                  />
                </div>
                <Button 
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        {showFilters && (
          <section className="bg-muted/30 py-6 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger>
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Programs</SelectItem>
                    <SelectItem value="BS">Bachelor's</SelectItem>
                    <SelectItem value="MBBS">MBBS</SelectItem>
                    <SelectItem value="BBA">BBA</SelectItem>
                    <SelectItem value="BE">Engineering</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genders</SelectItem>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Provinces</SelectItem>
                    <SelectItem value="Punjab">Punjab</SelectItem>
                    <SelectItem value="Sindh">Sindh</SelectItem>
                    <SelectItem value="KPK">KPK</SelectItem>
                    <SelectItem value="Balochistan">Balochistan</SelectItem>
                    <SelectItem value="ICT">ICT</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Cities</SelectItem>
                    <SelectItem value="Lahore">Lahore</SelectItem>
                    <SelectItem value="Karachi">Karachi</SelectItem>
                    <SelectItem value="Islamabad">Islamabad</SelectItem>
                    <SelectItem value="Peshawar">Peshawar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        )}

        {/* Students Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {filteredStudents.length} Students Found
                </h2>
                <p className="text-muted-foreground">
                  Connect with deserving students and make a difference
                </p>
              </div>
              
              {/* Recommended Section - would be AI-powered */}
              <div className="hidden md:block">
                <Badge variant="info" className="px-4 py-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Recommended for you
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => {
                const progressPercentage = (student.fundedUSD / student.needUSD) * 100;
                const isFullyFunded = progressPercentage >= 100;
                
                return (
                  <Card key={student.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">
                            {student.firstName} {student.lastName}
                          </CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            {student.program}
                          </div>
                        </div>
                        <Badge variant={isFullyFunded ? "approved" : "pending"}>
                          {isFullyFunded ? "Funded" : "Active"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          {student.university}, {student.city}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          GPA: {student.gpa} • Grad: {student.gradYear}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Funding Progress</span>
                          <span className="text-muted-foreground">
                            ${student.fundedUSD.toLocaleString()} / ${student.needUSD.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="text-xs text-muted-foreground text-right">
                          {progressPercentage.toFixed(0)}% funded
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant={isFullyFunded ? "success" : "secondary"}
                          className="flex-1"
                          onClick={() => handleFundStudent(student.id)}
                          disabled={isFullyFunded}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          {isFullyFunded ? "Fully Funded" : "Fund Now"}
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No students found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};