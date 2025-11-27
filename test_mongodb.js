const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// User schema matching the backend
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'insurer', 'claimant', 'registrar'], required: true },
    walletAddress: { type: String },
    approved: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'removed'], default: 'active' },
    registrarInfo: {
        departmentName: { type: String },
        employeeId: { type: String },
        phoneNumber: { type: String }
    },
    insurerInfo: {
        companyName: { type: String },
        licenseNumber: { type: String },
        contactPerson: { type: String },
        companyAddress: { type: String }
    },
    claimantInfo: {
        relationshipToDeceased: { type: String },
        phoneNumber: { type: String },
        address: { type: String }
    },
    adminInfo: {
        department: { type: String },
        employeeId: { type: String },
        permissions: [{ type: String }]
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function testMongoDB() {
    console.log('Testing MongoDB connection and data retrieval...');
    
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        console.log('MONGO_URI:', process.env.MONGO_URI);
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Connected to MongoDB successfully!');
        
        // Test 1: Count total users
        const userCount = await User.countDocuments();
        console.log(`📊 Total users in database: ${userCount}`);
        
        // Test 2: Find all users
        const allUsers = await User.find({}).limit(10);
        console.log(`📋 Found ${allUsers.length} users:`);
        allUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
        });
        
        // Test 3: Find admin users specifically
        const adminUsers = await User.find({ role: 'admin', status: { $ne: 'removed' } });
        console.log(`\n👮 Admin users: ${adminUsers.length}`);
        adminUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.status}`);
        });
        
        // Test 4: Check connection state
        console.log(`\n🔌 Mongoose connection state: ${mongoose.connection.readyState}`);
        console.log(`🔗 Connection readyState: ${mongoose.connection.readyState}`);
        
        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during MongoDB test:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code
        });
        
        // Try to close connection if it's open
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
}

// Run the test
testMongoDB();