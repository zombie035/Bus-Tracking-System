// Test script to verify admin-student notification connection
const io = require('socket.io-client');

console.log('🧪 Testing notification system connection...');

// Connect to server
const socket = io('http://localhost:5000', {
  withCredentials: true
});

let testNotification = null;

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Simulate student session check
  fetch('http://localhost:5000/api/test-check', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    console.log('📋 Session data:', data);
    
    if (data.authenticated) {
      // Emit authenticate-session event like student dashboard would
      socket.emit('authenticate-session', {
        userId: data.session.userId,
        role: data.session.role
      });
    }
  })
  .catch(error => {
    console.error('❌ Error checking session:', error);
  });
});

socket.on('notification-ready', (data) => {
  console.log('🔔 Notification registration confirmed:', data);
});

socket.on('new-notification', (notification) => {
  console.log('📨 Received notification:', notification);
  testNotification = notification;
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Test creating a notification as admin would
setTimeout(() => {
  console.log('📨 Simulating admin notification creation...');
  
  // Create a test notification
  fetch('http://localhost:5000/api/admin/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'connect.sid=test-session' // Simulate admin session
    },
    body: JSON.stringify({
      recipientType: 'all',
      title: 'Test Notification to Students',
      message: 'This is a test notification from admin to all students',
      notificationType: 'info'
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Admin notification created:', data);
    
    // Wait a bit then check if student received it
    setTimeout(() => {
      if (testNotification) {
        console.log('🎉 SUCCESS: Notification system is working!');
        console.log('   Admin created notification and student received it');
      } else {
        console.log('⚠️  WARNING: Student did not receive notification');
      }
    }, 2000);
  })
  .catch(error => {
    console.error('❌ Error creating test notification:', error);
  });
}, 3000);

// Keep test running
process.on('SIGINT', () => {
  console.log('🛑 Closing test connection...');
  socket.disconnect();
  process.exit(0);
});
