import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the emailService to extract template HTML
const emailServicePath = path.join(__dirname, 'src/lib/emailService.js');
const emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');

// Extract HTML templates - more robust extraction
function extractTemplate(content, functionName) {
  // Find the function and extract the html template between backticks
  const functionStart = content.indexOf(`async function ${functionName}`);
  if (functionStart === -1) return null;
  
  // Find the html: part after the function start
  const htmlStart = content.indexOf('html: `', functionStart);
  if (htmlStart === -1) return null;
  
  // Find the closing backtick
  let htmlEnd = htmlStart + 7;
  let depth = 0;
  while (htmlEnd < content.length) {
    if (content[htmlEnd] === '\\' && content[htmlEnd + 1] === '`') {
      htmlEnd += 2;
      continue;
    }
    if (content[htmlEnd] === '`') {
      break;
    }
    htmlEnd++;
  }
  
  return content.substring(htmlStart + 7, htmlEnd);
}

function saveEmailPreview(name, recipient, subject, html) {
  const outputPath = path.join(__dirname, `${name}-preview.html`);
  const wrappedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f0f0f0;
    }
    .preview-info {
      background: #fff;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #059669;
    }
    .preview-info h2 {
      margin: 0 0 10px 0;
      color: #059669;
    }
    .preview-info p {
      margin: 5px 0;
      color: #666;
    }
    .email-preview {
      background: #fff;
      padding: 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .email-content {
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="preview-info">
    <h2>📧 ${name}</h2>
    <p><strong>To:</strong> ${recipient}</p>
    <p><strong>Subject:</strong> ${subject}</p>
  </div>
  
  <div class="email-preview">
    <div class="email-content">
      ${html}
    </div>
  </div>
  
  <div class="preview-info" style="margin-top: 20px; border-left: 4px solid #3b82f6;">
    <p><strong>✅ Preview Generated</strong></p>
    <p>This HTML file shows how the email will appear to recipients. Links and images will work normally.</p>
    <p><small>Generated on: ${new Date().toLocaleString()}</small></p>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(outputPath, wrappedHtml);
  return outputPath;
}

console.log('Generating email template previews...\n');

// Extract student email template and subject
const studentFunctionStart = emailServiceContent.indexOf('async function sendStudentWelcomeEmail');
const studentSubjectMatch = emailServiceContent.substring(studentFunctionStart, studentFunctionStart + 2000).match(/subject:\s*['"`]([^'"`]+)/);
const studentSubject = studentSubjectMatch ? studentSubjectMatch[1] : 'Welcome to AWAKE';

// Extract donor email template and subject
const donorFunctionStart = emailServiceContent.indexOf('async function sendDonorWelcomeEmail');
const donorSubjectMatch = emailServiceContent.substring(donorFunctionStart, donorFunctionStart + 2000).match(/subject:\s*['"`]([^'"`]+)/);
const donorSubject = donorSubjectMatch ? donorSubjectMatch[1] : 'Welcome to AWAKE';

// Test student email
console.log('=== STUDENT WELCOME EMAIL ===');
const studentHtml = extractTemplate(emailServiceContent, 'sendStudentWelcomeEmail');
if (studentHtml) {
  const studentPreview = studentHtml
    .replace(/\$\{loginUrl\}/g, 'https://aircrew.nl')
    .replace(/\$\{name\.split\(' '\)\[0\]\}/g, 'Ahmed')
    .replace(/\${email}/g, 'test+student@webciters.com');
  
  const previewFile = saveEmailPreview('student-welcome', 'test+student@webciters.com', studentSubject, studentPreview);
  console.log('✅ Student email template extracted');
  console.log('   📧 To: test+student@webciters.com');
  console.log('   📝 Subject: ' + studentSubject);
  console.log('   📄 Preview saved to:', path.basename(previewFile));
  console.log();
} else {
  console.log('❌ Could not extract student email template');
}

// Test donor email
console.log('=== DONOR WELCOME EMAIL ===');
const donorHtml = extractTemplate(emailServiceContent, 'sendDonorWelcomeEmail');
if (donorHtml) {
  const donorPreview = donorHtml
    .replace(/\$\{loginUrl\}/g, 'https://aircrew.nl')
    .replace(/\$\{name\.split\(' '\)\[0\]\}/g, 'John')
    .replace(/\${name}/g, 'John Smith')
    .replace(/\${email}/g, 'test+donor@webciters.com');
  
  const previewFile = saveEmailPreview('donor-welcome', 'test+donor@webciters.com', donorSubject, donorPreview);
  console.log('✅ Donor email template extracted');
  console.log('   📧 To: test+donor@webciters.com');
  console.log('   📝 Subject: ' + donorSubject);
  console.log('   📄 Preview saved to:', path.basename(previewFile));
  console.log();
} else {
  console.log('❌ Could not extract donor email template');
}

console.log('✅ Email template previews generated!');
console.log('\n📂 Files created in: C:\\projects\\donor\\server\\');
console.log('   - student-welcome-preview.html');
console.log('   - donor-welcome-preview.html');
console.log('\n🌐 Open these files in your browser to preview the templates.');
console.log('\n✨ NEXT STEPS:');
console.log('1. Open both HTML files in a web browser');
console.log('2. Verify template appearance, colors, and styling');
console.log('3. Confirm all links point to https://aircrew.nl');
console.log('4. Check that AWAKE/Akhuwat branding is visible');
console.log('5. Once approved, we will push to production\n');
