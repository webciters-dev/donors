import bcrypt from 'bcryptjs';

const password = 'RoG*741#SuP';
const email = 'test+60@webciters.com';

// Generate bcrypt hash
const hash = await bcrypt.hash(password, 10);

// Generate a simple ID (Prisma CUID style)
const id = 'superadmin_' + Date.now();

// Generate SQL INSERT statement
const sql = `INSERT INTO users (id, email, name, "passwordHash", role, "createdAt", "updatedAt") 
VALUES ('${id}', '${email}', 'Super Administrator', '${hash}', 'SUPER_ADMIN', NOW(), NOW());`;

console.log('SQL to run on VPS:');
console.log(sql);
console.log('\nPassword hash:', hash);
