// Mock data for AWAKE Connect - matches the whole-student sponsorship model
// Only Ahmad Khan remains as per cleanup requirements

export const mockData = {
  students: [
    {
      id: 1,
      name: "Ahmad Khan",
      program: "AI Bachelors", 
      university: "Harvard University",
      gpa: 3.5,
      gradYear: 2027,
      currency: "USD",
      gender: "M",
      province: "Punjab",
      city: "Lahore",
      sponsored: false
    },
    {
      id: 2,
      name: "Ayesha Malik",
      program: "Computer Science", 
      university: "LUMS",
      gpa: 3.8,
      gradYear: 2026,
      currency: "PKR",
      gender: "F",
      province: "Sindh",
      city: "Karachi",
      sponsored: false
    },
    {
      id: 3,
      name: "Hassan Ali",
      program: "Engineering", 
      university: "NUST",
      gpa: 3.6,
      gradYear: 2025,
      currency: "PKR",
      gender: "M",
      province: "Khyber Pakhtunkhwa",
      city: "Peshawar",
      sponsored: false
    },
    {
      id: 4,
      name: "Zara Ahmed",
      program: "Medicine", 
      university: "AKU",
      gpa: 3.9,
      gradYear: 2028,
      currency: "PKR",
      gender: "F",
      province: "Gilgit-Baltistan",
      city: "Gilgit",
      sponsored: false
    }
  ],

  donors: [
    { id: 1, name: "Ahmed Ali", email: "ahmed@example.com" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com" },
    { id: 3, name: "Muhammad Hassan", email: "hassan@example.com" }
  ],

  sponsorships: [
    // No existing sponsorships - clean slate for Ahmad Khan
  ],

  applications: [
    {
      id: 1,
      studentId: 1,
      student: { name: "Ahmad Khan", program: "AI Bachelors", university: "Harvard University" },
      term: "Fall 2025",
      status: "APPROVED",
      submittedAt: "2025-10-02",
      amount: 50000,
      currency: "USD",
      documents: ["transcript.pdf", "id_card.jpg", "admission_letter.pdf"]
    }
  ],

  receipts: [
    // No existing receipts - clean slate
  ],

  kpis: {
    totalDonors: 0,
    studentsSponsored: 0,
    activeRepayers: 0,
    onTimeRepaymentPct: 0,
    totalDisbursed: 0,
    averageSponsorship: 0
  }
};