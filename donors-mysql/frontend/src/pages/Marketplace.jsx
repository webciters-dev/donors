import React, { useState, useEffect } from 'react';
import { studentAPI } from '../api/endpoints';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Header from '../components/layout/Header';

const Marketplace = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    field: '',
    university: '',
    minGPA: '',
    maxGPA: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchStudents();
  }, [filters, pagination.page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        sponsored: false, // Only show unsponsored students
        studentPhase: 'APPLICATION' // Only students in application phase
      };

      const data = await studentAPI.getAll(params);
      setStudents(data.students);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSponsor = (studentId) => {
    // TODO: Implement sponsorship flow
    console.log('Sponsor student:', studentId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Student Marketplace</h1>
          <p className="text-gray-600">Find and support deserving students</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find students by criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Search students..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
              <Input
                placeholder="Field of study"
                name="field"
                value={filters.field}
                onChange={handleFilterChange}
              />
              <Input
                placeholder="University"
                name="university"
                value={filters.university}
                onChange={handleFilterChange}
              />
              <Input
                placeholder="Min GPA"
                name="minGPA"
                type="number"
                step="0.1"
                min="0"
                max="4"
                value={filters.minGPA}
                onChange={handleFilterChange}
              />
              <Input
                placeholder="Max GPA"
                name="maxGPA"
                type="number"
                step="0.1"
                min="0"
                max="4"
                value={filters.maxGPA}
                onChange={handleFilterChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Students Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 text-lg">No students found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setFilters({
                    search: '',
                    field: '',
                    university: '',
                    minGPA: '',
                    maxGPA: ''
                  });
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{student.name}</CardTitle>
                  <CardDescription>
                    {student.university} • {student.field}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GPA:</span>
                      <span className="font-medium">{student.gpa}/4.0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Program:</span>
                      <span className="font-medium">{student.program}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Graduation:</span>
                      <span className="font-medium">{student.gradYear}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{student.city}, {student.country}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Funding Need:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(student.needUSD)}
                      </span>
                    </div>
                    
                    {student.personalIntroduction && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {student.personalIntroduction}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // TODO: View student details
                          console.log('View details:', student.id);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSponsor(student.id)}
                      >
                        Sponsor
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketplace;