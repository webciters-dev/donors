// src/data/demoDonor.js
// Static mock data for donor demo pages (no API calls)

export const demoStudents = [
  {
    id: "s1",
    name: "Ahmad Khan",
    university: "Harvard University",
    program: "AI Bachelors",
    city: "Lahore",
    village: "Model Town",
    province: "Punjab",
    gender: "Male",
    currentInstitution: "Punjab University",
    targetUniversity: "Harvard",
    targetProgram: "AI Bachelors",
    gpaTrend: [3.0, 3.1, 3.3, 3.4, 3.5],
    need: 50000,
    currency: "USD",
    fundedUSD: 0,
    photo: "/public/placeholder.svg",
    contactEmail: "ahmad.khan@example.com",
    contactPhone: "+92 300 0000001",
    address: "House 12, Model Town, Lahore",
    job: { company: "Tech Solutions", title: "AI Engineer", salary: 2500, currency: "USD", startDate: "2027-06-01" },
    bio: "Passionate about artificial intelligence and machine learning applications for social good.",
    achievements: ["Dean's list (Fall 2024)", "AI Research Competition Winner"],
    financialBreakdown: { tuition: 40000, hostel: 8000, books: 2000 },
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

// Dual currency display for PKR amounts - for demo purposes, use a simple conversion
export function fmtAmountDual(amount, currency = "USD") {
  const meta = CURRENCY_META[currency] || CURRENCY_META.USD;
  const num = Number(amount || 0);
  
  // For PKR amounts, show dual currency: PKR 200,000 (≈ $667 USD)
  if (currency === 'PKR' && num > 0) {
    const usdAmount = Math.round(num / 300); // Use 300 as demo rate
    const pkrFormatted = `${meta.symbol} ${num.toLocaleString(meta.locale, { maximumFractionDigits: 0 })}`;
    const usdFormatted = `$${usdAmount.toLocaleString()}`;
    return `${pkrFormatted} (≈ ${usdFormatted} USD)`;
  }
  
  // For all other currencies, show original format only
  return `${meta.symbol} ${num.toLocaleString(meta.locale, { maximumFractionDigits: 0 })}`;
}
