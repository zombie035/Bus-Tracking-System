// Test script to verify admin notification broadcasting to students
const io = require('socket.io-client');

console.log('🧪 Testing notification broadcast system...');

// Connect to the server
const socket = io('http://localhost:5000', {
  withCredentials: true
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Register as a student to receive notifications
  socket.emit('register-notifications', 'STU001');
});

socket.on('notification-ready', (data) => {
  console.log('🔔 Notification registration confirmed:', data);
});

socket.on('new-notification', (notification) => {
  console.log('📨 Received notification:', notification);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Test creating a notification as admin would
setTimeout(() => {
  console.log('📨 Simulating admin notification creation...');
  
  // This would normally be done via admin panel, but we'll simulate it
  fetch('http://localhost:5000/api/admin/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    'Cookie': 'connect.sid=test-session' // Simulate admin session
    },
    body: JSON.stringify({
      recipientType: 'all',
      title: 'Test Notification',
      message: 'This is a test notification from admin to students',
      notificationType: 'info'
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('📨 Admin notification created:', data);
  })
  .catch(error => {
    console.error('❌ Error creating test notification:', error);
  });
}, 2000);

// Keep the test running
process.on('SIGINT', () => {
  console.log('🛑 Closing test connection...');
  socket.disconnect();
  process.exit(0);
});
