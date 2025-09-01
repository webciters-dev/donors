// Mock data for AWAKE Connect - matches the whole-student sponsorship model

export const mockData = {
  students: [
    {
      id: 1,
      name: "Ayesha Khan",
      program: "Computer Science",
      university: "NUST",
      gpa: 3.7,
      gradYear: 2026,
      needUsd: 2400,
      gender: "F",
      province: "Islamabad",
      city: "Islamabad",
      sponsored: true
    },
    {
      id: 2,
      name: "Bilal Ahmed",
      program: "Mechanical Engineering",
      university: "UET Lahore",
      gpa: 3.5,
      gradYear: 2025,
      needUsd: 1800,
      gender: "M",
      province: "Punjab",
      city: "Lahore",
      sponsored: true
    },
    {
      id: 3,
      name: "Hira Fatima",
      program: "Medicine (MBBS)",
      university: "DUHS",
      gpa: 3.9,
      gradYear: 2027,
      needUsd: 5000,
      gender: "F",
      province: "Sindh",
      city: "Karachi",
      sponsored: false
    },
    {
      id: 4,
      name: "Usman Tariq",
      program: "Electrical Engineering",
      university: "FAST",
      gpa: 3.2,
      gradYear: 2026,
      needUsd: 3200,
      gender: "M",
      province: "KPK",
      city: "Peshawar",
      sponsored: false
    },
    {
      id: 5,
      name: "Fatima Sheikh",
      program: "Business Administration",
      university: "IBA Karachi",
      gpa: 3.8,
      gradYear: 2025,
      needUsd: 2800,
      gender: "F",
      province: "Sindh",
      city: "Karachi",
      sponsored: false
    }
  ],

  donors: [
    { id: 1, name: "Ahmed Ali", email: "ahmed@example.com" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com" },
    { id: 3, name: "Muhammad Hassan", email: "hassan@example.com" }
  ],

  sponsorships: [
    {
      id: 1,
      donorId: 1,
      studentId: 1,
      amountUsd: 2400,
      status: "PAID",
      createdAt: "2024-01-15",
      student: { name: "Ayesha Khan", university: "NUST", program: "Computer Science" }
    },
    {
      id: 2,
      donorId: 2,
      studentId: 2,
      amountUsd: 1800,
      status: "PAID",
      createdAt: "2024-02-10",
      student: { name: "Bilal Ahmed", university: "UET Lahore", program: "Mechanical Engineering" }
    }
  ],

  applications: [
    {
      id: 1,
      studentId: 3,
      student: { name: "Hira Fatima", program: "Medicine (MBBS)", university: "DUHS" },
      term: "Fall 2024",
      status: "PENDING",
      submittedAt: "2024-03-01",
      needUsd: 5000,
      documents: ["transcript.pdf", "id_card.jpg", "admission_letter.pdf"]
    },
    {
      id: 2,
      studentId: 4,
      student: { name: "Usman Tariq", program: "Electrical Engineering", university: "FAST" },
      term: "Spring 2024",
      status: "PROCESSING",
      submittedAt: "2024-02-15",
      needUsd: 3200,
      documents: ["transcript.pdf", "id_card.jpg", "video_intro.mp4"]
    }
  ],

  receipts: [
    {
      id: 1,
      date: "2024-01-15",
      studentName: "Ayesha Khan",
      amount: 2400,
      taxYear: 2024,
      receiptNumber: "RC-2024-001"
    },
    {
      id: 2,
      date: "2024-02-10",
      studentName: "Bilal Ahmed",
      amount: 1800,
      taxYear: 2024,
      receiptNumber: "RC-2024-002"
    }
  ],

  kpis: {
    totalDonors: 125,
    studentsSponsored: 89,
    activeRepayers: 67,
    onTimeRepaymentPct: 94.2,
    totalDisbursed: 285000,
    averageSponsorship: 2500
  }
};