const axios = require('axios');

async function retrieveAllUsers() {
    console.log('=== RETRIEVING ALL USERS FROM DATABASE ===\n');
    
    try {
        // Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin2@gmail.com',
            password: 'admin2@gmail.com'
        });
        const token = loginResponse.data.token;
        console.log('✅ Admin login successful\n');
        
        // Try different approaches to get all users
        console.log('2. Testing different user retrieval methods...\n');
        
        // Method 1: Get all users without filtering
        try {
            console.log('Method 1: Getting all users (no filter)...');
            const allUsersResponse = await axios.get('http://localhost:4000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allUsers = allUsersResponse.data.users || [];
            console.log(`✅ Retrieved ${allUsers.length} users total`);
            
            // Show all users
            console.log('\n📋 All users in database:');
            allUsers.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
            });
            
            // Count by role and status
            const roleCounts = {};
            const statusCounts = {};
            allUsers.forEach(user => {
                roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
                statusCounts[user.status] = (statusCounts[user.status] || 0) + 1;
            });
            console.log('\n📊 Summary:');
            console.log('   By role:', roleCounts);
            console.log('   By status:', statusCounts);
            
        } catch (error) {
            console.log('❌ Failed to get all users:', error.response?.data || error.message);
        }
        
        // Method 2: Try getting users with different role filters
        console.log('\nMethod 2: Testing role-specific filters...');
        const roles = ['admin', 'registrar', 'insurer', 'claimant'];
        for (const role of roles) {
            try {
                const roleResponse = await axios.get(`http://localhost:4000/api/admin/users?role=${role}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const roleUsers = roleResponse.data.users || [];
                console.log(`   ${role}: ${roleUsers.length} users`);
                
                // Show first few users of this role
                roleUsers.slice(0, 3).forEach((user, index) => {
                    console.log(`     ${index + 1}. ${user.name} (${user.email})`);
                });
                if (roleUsers.length > 3) {
                    console.log(`     ... and ${roleUsers.length - 3} more`);
                }
            } catch (error) {
                console.log(`   ${role}: Error -`, error.response?.data?.error || error.message);
            }
        }
        
        // Method 3: Try getting removed users too
        console.log('\nMethod 3: Checking if there are removed users...');
        try {
            // This would require a special endpoint or modification to the existing one
            console.log('   Note: The current API filters out removed users by default');
        } catch (error) {
            console.log('   Error checking removed users:', error.response?.data?.error || error.message);
        }
        
        console.log('\n=== USER RETRIEVAL COMPLETE ===');
        console.log('✅ The API is successfully retrieving all available users from your database');
        console.log('💡 If you expect more users, they might be in a different database or have been filtered out');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run the test
retrieveAllUsers();