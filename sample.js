const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://root:root@airbnb.fzehhma.mongodb.net/')
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  });