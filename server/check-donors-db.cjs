const dotenv = require('dotenv');
dotenv.config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDonorData() {
  try {
    console.log('=== Checking Donor Database Records ===');
    
    // Check all donors
    const allDonors = await pool.query(`
      SELECT 
        id, name, email, organization, country, 
        "totalFunded", "createdAt", "currencyPreference"
      FROM donors 
      ORDER BY "createdAt" DESC;
    `);
    
    console.log('All Donors in Database:');
    console.log(JSON.stringify(allDonors.rows, null, 2));
    
    // Specifically look for Athar Shah
    const atharSearch = await pool.query(`
      SELECT * FROM donors 
      WHERE name ILIKE '%athar%' OR name ILIKE '%shah%' OR email ILIKE '%athar%';
    `);
    
    console.log('\nSearching for Athar Shah:');
    console.log(JSON.stringify(atharSearch.rows, null, 2));
    
    // Check users table for donor accounts
    const donorUsers = await pool.query(`
      SELECT 
        u.id, u.email, u.name, u.role, u."donorId", u."createdAt",
        d.name as donor_name, d.email as donor_email
      FROM users u
      LEFT JOIN donors d ON u."donorId" = d.id
      WHERE u.role = 'DONOR'
      ORDER BY u."createdAt" DESC;
    `);
    
    console.log('\nDonor Users:');
    console.log(JSON.stringify(donorUsers.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Database Error:', error);
    await pool.end();
  }
}

checkDonorData();