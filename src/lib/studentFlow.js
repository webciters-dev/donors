/**
 * Utility to determine which step a student should be redirected to based on their completion status
 */

import { API } from './api';

export const determineStudentStep = (user) => {
  // If user is not a student, return null
  if (!user || user.role !== 'STUDENT') {
    return null;
  }

  // If student is in ACTIVE phase, they go to active dashboard
  if (user.studentPhase === 'ACTIVE') {
    return '/student/active';
  }

  // For APPLICATION phase students, we need to check their progress
  // This will require an API call to get their current data
  return 'CHECK_PROGRESS'; // Signal that we need to check progress
};

/**
 * Check student's actual progress and return the appropriate step
 */
export const checkStudentProgress = async (user, token) => {
  console.log('🔍 Checking student progress for:', user?.email);
  
  if (!user?.studentId || !token) {
    console.log('❌ Missing studentId or token, redirecting to step 1');
    return '/apply'; // Default to step 1
  }

  try {
    // Get student details to check completion
    console.log('📡 Fetching student details...');
    const res = await fetch(`${API.baseURL}/api/students/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.warn('⚠️ Failed to fetch student details, defaulting to step 1');
      return '/apply';
    }

    const student = await res.json();
    console.log('📚 Student data:', {
      university: student.university || 'NOT SET',
      program: student.program || 'NOT SET',
      gpa: student.gpa || 'NOT SET',
      field: student.field || 'NOT SET',
      degreeLevel: student.degreeLevel || 'NOT SET'
    });
    
    // Check if they have education details (Step 2 completion)
    const hasEducationDetails = student.university && 
                                student.program && 
                                student.gpa && 
                                student.field &&
                                student.degreeLevel;
    
    console.log('📖 Education details complete:', hasEducationDetails);

    // Check if they have an application with financial details (Step 3 completion)
    console.log('📡 Fetching applications...');
    const appsRes = await fetch(`${API.baseURL}/api/applications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    let hasReachedStep3 = false;
    let hasCompleteApplication = false;
    
    if (appsRes.ok) {
      const appData = await appsRes.json();
      const applications = Array.isArray(appData?.applications) ? appData.applications : [];
      const userApp = applications.find(app => app.studentId === user.studentId);
      
      console.log('📄 Application found:', userApp ? `Status=${userApp.status}, Amount=${userApp.amount}, UniversityFee=${userApp.universityFee}, TotalExpense=${userApp.totalExpense}` : 'None');
      
      if (userApp) {
        // User has reached Step 3 if ANY application exists (even empty)
        hasReachedStep3 = true;
        
        // Consider application complete if it has meaningful financial details
        hasCompleteApplication = userApp.universityFee > 0 && 
                                userApp.totalExpense > 0 && 
                                userApp.amount > 1000; // More than just a placeholder
      }
    }
    
    console.log('📋 Has reached Step 3 (application exists):', hasReachedStep3);
    console.log('📋 Application complete (has financial details):', hasCompleteApplication);

    // Determine the appropriate step/page
    let redirectPath;
    if (hasCompleteApplication) {
      // Step 3 completed with meaningful data - go to application status page
      redirectPath = '/my-application';
    } else if (hasReachedStep3) {
      // Step 3 reached but not completed - return to Step 3 to continue
      redirectPath = '/apply?step=3';
    } else if (hasEducationDetails) {
      // Step 2 completed, need Step 3 - financial details
      redirectPath = '/apply?step=3';
    } else {
      // Step 1 completed, need Step 2 - education details
      redirectPath = '/apply?step=2';
    }
    
    console.log('🎯 Redirecting to:', redirectPath);
    return redirectPath;

  } catch (error) {
    console.error('❌ Error checking student progress:', error);
    return '/apply'; // Default to step 1 on error
  }
};