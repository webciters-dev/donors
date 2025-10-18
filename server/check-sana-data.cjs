const dotenv = require('dotenv');
dotenv.config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkSponsorshipData() {
  try {
    // Check Sana Amin's application data
    const result = await pool.query(`
      SELECT 
        a.id,
        a.status,
        a.sponsored,
        s.name as student_name,
        COUNT(sp.id) as sponsorship_count
      FROM applications a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN sponsorships sp ON sp.student_id = s.id
      WHERE s.name ILIKE '%sana%' AND s.name ILIKE '%amin%'
      GROUP BY a.id, a.status, a.sponsored, s.name;
    `);
    
    console.log('Sana Amin application data:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Also check the actual sponsorship record
    const sponsorshipResult = await pool.query(`
      SELECT 
        sp.*,
        s.name as student_name,
        d.name as donor_name
      FROM sponsorships sp
      LEFT JOIN students s ON sp.student_id = s.id
      LEFT JOIN donors d ON sp.donor_id = d.id
      WHERE s.name ILIKE '%sana%' AND s.name ILIKE '%amin%';
    `);
    
    console.log('\nSana Amin sponsorship records:');
    console.log(JSON.stringify(sponsorshipResult.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkSponsorshipData();