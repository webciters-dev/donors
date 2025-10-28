import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { applicationAPI } from '../api/endpoints';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Header from '../components/layout/Header';

const ApplicationForm = () => {
  const [formData, setFormData] = useState({
    term: '',
    needUSD: '',
    tuitionFee: '',
    hostelFee: '',
    otherExpenses: '',
    familyIncome: '',
    familyContribution: '',
    purpose: '',
    livingExpenses: '',
    scholarshipAmount: '',
    universityFee: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert string numbers to integers
      const applicationData = {
        ...formData,
        needUSD: parseInt(formData.needUSD) || 0,
        tuitionFee: parseInt(formData.tuitionFee) || 0,
        hostelFee: parseInt(formData.hostelFee) || 0,
        otherExpenses: parseInt(formData.otherExpenses) || 0,
        familyIncome: parseInt(formData.familyIncome) || 0,
        familyContribution: parseInt(formData.familyContribution) || 0,
        livingExpenses: parseInt(formData.livingExpenses) || 0,
        scholarshipAmount: parseInt(formData.scholarshipAmount) || 0,
        universityFee: parseInt(formData.universityFee) || 0
      };

      await applicationAPI.create(applicationData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Application creation error:', err);
      setError(err.response?.data?.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'STUDENT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Only students can access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Submit Funding Application</CardTitle>
            <CardDescription>
              Provide detailed information about your funding requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Term *
                  </label>
                  <Input
                    id="term"
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    placeholder="e.g., Spring 2024, Fall 2024"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="needUSD" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Funding Need (USD) *
                  </label>
                  <Input
                    id="needUSD"
                    name="needUSD"
                    type="number"
                    value={formData.needUSD}
                    onChange={handleChange}
                    placeholder="5000"
                    required
                  />
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Expense Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="tuitionFee" className="block text-sm font-medium text-gray-700 mb-2">
                      Tuition Fee (USD)
                    </label>
                    <Input
                      id="tuitionFee"
                      name="tuitionFee"
                      type="number"
                      value={formData.tuitionFee}
                      onChange={handleChange}
                      placeholder="3000"
                    />
                  </div>

                  <div>
                    <label htmlFor="universityFee" className="block text-sm font-medium text-gray-700 mb-2">
                      University Fees (USD)
                    </label>
                    <Input
                      id="universityFee"
                      name="universityFee"
                      type="number"
                      value={formData.universityFee}
                      onChange={handleChange}
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label htmlFor="hostelFee" className="block text-sm font-medium text-gray-700 mb-2">
                      Hostel/Accommodation (USD)
                    </label>
                    <Input
                      id="hostelFee"
                      name="hostelFee"
                      type="number"
                      value={formData.hostelFee}
                      onChange={handleChange}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label htmlFor="livingExpenses" className="block text-sm font-medium text-gray-700 mb-2">
                      Living Expenses (USD)
                    </label>
                    <Input
                      id="livingExpenses"
                      name="livingExpenses"
                      type="number"
                      value={formData.livingExpenses}
                      onChange={handleChange}
                      placeholder="800"
                    />
                  </div>

                  <div>
                    <label htmlFor="otherExpenses" className="block text-sm font-medium text-gray-700 mb-2">
                      Other Expenses (USD)
                    </label>
                    <Input
                      id="otherExpenses"
                      name="otherExpenses"
                      type="number"
                      value={formData.otherExpenses}
                      onChange={handleChange}
                      placeholder="200"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="familyIncome" className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Family Income (USD)
                    </label>
                    <Input
                      id="familyIncome"
                      name="familyIncome"
                      type="number"
                      value={formData.familyIncome}
                      onChange={handleChange}
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label htmlFor="familyContribution" className="block text-sm font-medium text-gray-700 mb-2">
                      Family Contribution (USD)
                    </label>
                    <Input
                      id="familyContribution"
                      name="familyContribution"
                      type="number"
                      value={formData.familyContribution}
                      onChange={handleChange}
                      placeholder="200"
                    />
                  </div>

                  <div>
                    <label htmlFor="scholarshipAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Existing Scholarships (USD)
                    </label>
                    <Input
                      id="scholarshipAmount"
                      name="scholarshipAmount"
                      type="number"
                      value={formData.scholarshipAmount}
                      onChange={handleChange}
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose of Funding
                </label>
                <textarea
                  id="purpose"
                  name="purpose"
                  rows="4"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="Explain how this funding will help you achieve your educational goals..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;