import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Test middleware debug
function debugAuth(req, res, next) {
  console.log('🔍 Auth Debug:');
  console.log('- Headers:', req.headers.authorization);
  console.log('- JWT_SECRET:', JWT_SECRET?.substring(0, 10) + '...');
  
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      console.log('❌ Missing Bearer token');
      return res.status(401).json({ error: "Missing token" });
    }

    console.log('🎟️ Token received:', token.substring(0, 50) + '...');
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token payload:', payload);
    
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    
    console.log('👤 User set:', req.user);
    return next();
  } catch (err) {
    console.log('❌ JWT Error:', err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

function debugRoles(...allowed) {
  return (req, res, next) => {
    console.log('🔑 Role Check:');
    console.log('- Required roles:', allowed);
    console.log('- User role:', req.user?.role);
    
    const role = req.user?.role;
    if (!role) {
      console.log('❌ Role missing');
      return res.status(403).json({ message: "Forbidden: role missing" });
    }
    if (allowed.length === 0 || allowed.includes(role)) {
      console.log('✅ Role check passed');
      return next();
    }
    console.log('❌ Role check failed');
    return res.status(403).json({
      message: `Forbidden: requires role ${allowed.join(", ")}`,
    });
  };
}

const app = express();

// Test endpoint
app.get('/api/test-auth', debugAuth, debugRoles("DONOR", "ADMIN"), (req, res) => {
  res.json({ success: true, user: req.user });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Debug server running on port ${PORT}`);
  
  // Generate a test token
  const samplePayload = {
    sub: 'cmguhnqtr000823npehltvk8n',
    email: 'test+21@webciters.com',
    role: 'DONOR'
  };
  
  const token = jwt.sign(samplePayload, JWT_SECRET, { expiresIn: '7d' });
  console.log('🎟️ Test with this token:', token);
  console.log('🌐 Test URL: http://localhost:3002/api/test-auth');
  console.log('📋 Test command: curl -H "Authorization: Bearer ' + token + '" http://localhost:3002/api/test-auth');
});