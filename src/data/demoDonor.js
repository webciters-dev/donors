// src/data/demoDonor.js
// Static mock data for donor demo pages (no API calls)

export const demoStudents = [
  {
    id: "s1",
    name: "Ayesha Khan",
    university: "Lahore University of Management Sciences (LUMS)",
    program: "BS Computer Science",
    city: "Lahore",
  village: "Gulberg",
    province: "Punjab",
    gender: "Female",
    currentInstitution: "Kinnaird College for Women",
    targetUniversity: "LUMS",
    targetProgram: "BSCS",
    gpaTrend: [2.9, 3.1, 3.3, 3.4, 3.5],
    need: 600000,
    currency: "PKR",
    fundedUSD: 0,
    photo: "/public/placeholder.svg",
    contactEmail: "ayesha.khan@example.com",
    contactPhone: "+92 300 0000001",
    address: "House 12, Gulberg II, Lahore",
    job: { company: "TechSoft Pvt Ltd", title: "Software Engineer", salary: 200000, currency: "PKR", startDate: "2026-03-01" },
    bio: "First-generation university student passionate about building impactful software for education.",
    achievements: ["Dean's list (Spring 2025)", "Women in Tech scholarship finalist"],
    financialBreakdown: { tuition: 450000, hostel: 100000, books: 50000 },
  },
  {
    id: "s2",
    name: "Muhammad Ali",
    university: "Harvard University",
    program: "MS Electrical Engineering",
    city: "Karachi",
  village: "PECHS",
    province: "Sindh",
    gender: "Male",
    currentInstitution: "Govt. Degree College",
    targetUniversity: "Harvard",
    targetProgram: "Electrical Engineering (MS)",
    gpaTrend: [3.0, 3.0, 3.2, 3.35, 3.42],
    need: 25000,
    currency: "USD",
    fundedUSD: 0,
    photo: "/public/placeholder.svg",
    contactEmail: "m.ali@example.com",
    contactPhone: "+92 300 0000002",
    address: "Flat 5B, PECHS, Karachi",
    job: { company: "K-Electric", title: "Junior Engineer", salary: 1200, currency: "USD", startDate: "2026-05-15" },
    bio: "Robotics and power systems enthusiast aiming to contribute to Pakistan's energy sector.",
    achievements: ["Top 5 in National Robotics Challenge", "IEEE Student Chapter lead"],
    financialBreakdown: { tuition: 20000, hostel: 3000, books: 2000 },
  },
  {
    id: "s3",
    name: "Fatima Noor",
    university: "London School of Economics",
    program: "MSc Economics",
    city: "Islamabad",
  village: "Saidpur",
    province: "Islamabad Capital Territory",
    gender: "Female",
    currentInstitution: "Islamabad Model College",
    targetUniversity: "LSE",
    targetProgram: "Economics (MSc)",
    gpaTrend: [3.2, 3.25, 3.4, 3.6, 3.65],
    need: 18000,
    currency: "GBP",
    fundedUSD: 0,
    photo: "/public/placeholder.svg",
    contactEmail: "fatima.noor@example.com",
    contactPhone: "+92 300 0000003",
    address: "Street 22, F-8/3, Islamabad",
    job: { company: "State Bank of Pakistan", title: "Analyst", salary: 1800, currency: "GBP", startDate: "2026-08-01" },
    bio: "Aspiring development economist focused on financial inclusion and social impact.",
    achievements: ["Gold medal in undergraduate thesis", "President – Economics Society"],
    financialBreakdown: { tuition: 15000, hostel: 2000, books: 1000 },
  },
];

export function getStudentById(id) {
  return demoStudents.find((s) => s.id === id);
}

const CURRENCY_META = {
  USD: { symbol: "$", locale: undefined },
  PKR: { symbol: "₨", locale: "en-PK" },
  GBP: { symbol: "£", locale: "en-GB" },
};

export function fmtAmount(n, currency = "USD") {
  const meta = CURRENCY_META[currency] || CURRENCY_META.USD;
  return `${meta.symbol} ${Number(n || 0).toLocaleString(meta.locale, { maximumFractionDigits: 0 })}`;
}
