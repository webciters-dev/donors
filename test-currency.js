// Test currency detection logic
import { getCurrencyFromCountry } from './src/lib/currency.js';

const testCases = [
  // USA
  { country: "USA", expected: "USD" },
  { country: "United States", expected: "USD" },
  { country: "America", expected: "USD" },
  
  // Canada  
  { country: "Canada", expected: "CAD" },
  
  // UK
  { country: "UK", expected: "GBP" },
  { country: "United Kingdom", expected: "GBP" },
  { country: "England", expected: "GBP" },
  
  // EU countries (should map to EUR)
  { country: "Germany", expected: "EUR" },
  { country: "France", expected: "EUR" },
  { country: "Italy", expected: "EUR" },
  { country: "Spain", expected: "EUR" },
  { country: "Netherlands", expected: "EUR" },
  { country: "EU", expected: "EUR" },
  { country: "European Union", expected: "EUR" },
  
  // Pakistan
  { country: "Pakistan", expected: "PKR" },
  { country: "Pak", expected: "PKR" },
  
  // Default case
  { country: "Unknown Country", expected: "PKR" },
  { country: "", expected: "PKR" },
  { country: null, expected: "PKR" }
];

console.log("Testing country-based currency detection...\n");

testCases.forEach(({ country, expected }) => {
  const result = getCurrencyFromCountry(country);
  const status = result === expected ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} "${country}" -> ${result} (expected: ${expected})`);
});

console.log("\nCurrency detection test complete!");