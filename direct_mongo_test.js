const mongoose = require('mongoose');

async function directMongoTest() {
    console.log('=== DIRECT MONGODB TEST ===\n');
    
    try {
        // Connect directly to MongoDB
        console.log('1. Connecting to MongoDB...');
        console.log('MONGO_URI: mongodb+srv://EternaVaultUser:Eterna123@test-pro-db.h51sn.mongodb.net/deathcert?retryWrites=true&w=majority&appName=test-pro-db');
        
        await mongoose.connect('mongodb+srv://EternaVaultUser:Eterna123@test-pro-db.h51sn.mongodb.net/deathcert?retryWrites=true&w=majority&appName=test-pro-db', {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Connected to MongoDB successfully!\n');
        
        // Define a simple user schema to match what might be in the database
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true },
            password: { type: String, required: true },
            role: { type: String, required: true },
            status: { type: String, default: 'active' }
        }, { collection: 'users' });
        
        const User = mongoose.model('User', userSchema);
        
        // Count total users
        const userCount = await User.countDocuments();
        console.log(`📊 Total users in database: ${userCount}`);
        
        // Get all users
        const allUsers = await User.find({}).limit(20);
        console.log(`📋 Found ${allUsers.length} users:`);
        
        // Show users by role
        const roleCounts = {};
        allUsers.forEach(user => {
            const role = user.role || 'unknown';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
            console.log(`   ${Object.keys(roleCounts).reduce((a, b) => roleCounts[a] > roleCounts[b] ? a : b, Object.keys(roleCounts)[0])}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
        });
        
        console.log('\n📊 Users by role:', roleCounts);
        
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
directMongoTest();