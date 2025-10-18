// Test the AdminHub message processing logic
const testMessage1 = {
  id: "cmguhpb8s000c23npsjvnktpc",
  senderRole: "DONOR",
  text: "Hi Sana - I see you have applied at AWAKE Connect to be sponsored.",
  createdAt: "2025-10-17T06:50:47.213Z",
  sender: {
    id: "cmguhnqtr000823npehltvk8n",
    name: null,
    role: "DONOR",
    student: null,
    donor: {
      name: "Athar Shah"
    }
  }
};

const testMessage2 = {
  id: "cmguhqfx6000e23np3w4olooh",
  senderRole: "STUDENT",
  text: "Thank you for considering me sir.  I will help all those who deserve..",
  createdAt: "2025-10-17T06:51:39.930Z",
  sender: {
    id: "cmgtayw3h0002kmh0974die5s",
    name: null,
    role: "STUDENT",
    student: {
      name: "Sana Amin"
    },
    donor: null
  }
};

// Test the logic from AdminHub
function getSenderName(msg) {
  let senderName = 'Unknown';
  if (msg.sender) {
    if (msg.sender.donor?.name) {
      senderName = msg.sender.donor.name;
    } else if (msg.sender.student?.name) {
      senderName = msg.sender.student.name;
    } else if (msg.sender.name) {
      senderName = msg.sender.name;
    }
  }
  return senderName;
}

console.log('=== Testing Sender Name Logic ===');
console.log('Message 1 (DONOR):', getSenderName(testMessage1)); // Should be "Athar Shah"
console.log('Message 2 (STUDENT):', getSenderName(testMessage2)); // Should be "Sana Amin"

console.log('\n=== Expected Output ===');
console.log('✅ Donor message should show: "Athar Shah"');
console.log('✅ Student message should show: "Sana Amin"');