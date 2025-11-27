// Test using the exact same MongoDB connection method as the backend
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function backendMongoTest() {
    console.log('=== BACKEND MONGODB CONNECTION TEST ===\n');
    
    try {
        // Use the exact same connection string as the backend
        console.log('1. Connecting to MongoDB with backend URI...');
        console.log('MONGO_URI:', process.env.MONGO_URI);
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Connected to MongoDB successfully!\n');
        
        // Use the exact same user schema as the backend
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
        
        // Count total users
        const userCount = await User.countDocuments();
        console.log(`📊 Total users in database: ${userCount}`);
        
        // Get all users with the same filter as the backend
        const filter = { status: { $ne: 'removed' } };
        console.log('Filter used by backend:', filter);
        
        const allUsers = await User.find(filter).limit(20);
        console.log(`📋 Found ${allUsers.length} users with backend filter:`);
        
        // Show users by role
        const roleCounts = {};
        allUsers.forEach(user => {
            const role = user.role || 'unknown';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
            console.log(`   ${Object.keys(roleCounts).length}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
        });
        
        console.log('\n📊 Users by role:', roleCounts);
        
        // Test role-specific filtering like the backend does
        console.log('\n--- Role-specific filtering ---');
        const roles = ['admin', 'registrar', 'insurer', 'claimant'];
        for (const role of roles) {
            const roleFilter = { status: { $ne: 'removed' }, role: role };
            const roleUsers = await User.find(roleFilter);
            console.log(`   ${role}: ${roleUsers.length} users`);
        }
        
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
backendMongoTest();