const axios = require('axios');

async function debugUsers() {
    console.log('=== DEBUGGING USER RETRIEVAL ===\n');
    
    try {
        // Try different admin credentials
        const adminCredentials = [
            { email: 'admin@gmail.com', password: 'admin@gmail.com' },
            { email: 'heera@gmail.com', password: 'heera@gmail.com' },
            { email: 'admin2@gmail.com', password: 'admin2@gmail.com' }
        ];
        
        let token = null;
        for (const credentials of adminCredentials) {
            try {
                console.log(`1. Trying to login as ${credentials.email}...`);
                const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
                    email: credentials.email,
                    password: credentials.password
                });
                token = loginResponse.data.token;
                console.log('✅ Admin login successful\n');
                break;
            } catch (error) {
                console.log(`❌ Login failed for ${credentials.email}:`, error.response?.data?.error || error.message);
            }
        }
        
        if (!token) {
            console.log('❌ All login attempts failed');
            return;
        }
        
        // Test the test-db endpoint
        console.log('2. Testing database connection...');
        try {
            const testResponse = await axios.get('http://localhost:4000/api/admin/test-db', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Database test successful');
            console.log('   Total users in DB:', testResponse.data.userCount);
            console.log('   Sample users:', testResponse.data.sampleUsers);
        } catch (error) {
            console.log('❌ Database test failed:', error.response?.data || error.message);
        }
        
        // Test the actual users endpoint
        console.log('\n3. Testing admin users endpoint...');
        try {
            const usersResponse = await axios.get('http://localhost:4000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Users endpoint successful');
            console.log('   Users retrieved:', usersResponse.data.users?.length || 0);
            
            if (usersResponse.data.users && usersResponse.data.users.length > 0) {
                console.log('   First user:', {
                    name: usersResponse.data.users[0].name,
                    email: usersResponse.data.users[0].email,
                    role: usersResponse.data.users[0].role,
                    status: usersResponse.data.users[0].status
                });
                
                // Count users by role
                const roleCounts = {};
                usersResponse.data.users.forEach(user => {
                    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
                });
                console.log('   Users by role:', roleCounts);
            } else {
                console.log('   No users returned');
            }
        } catch (error) {
            console.log('❌ Users endpoint failed:', error.response?.data || error.message);
        }
        
        // Test role-specific filtering
        console.log('\n4. Testing role-specific filtering...');
        const roles = ['admin', 'registrar', 'insurer', 'claimant'];
        for (const role of roles) {
            try {
                const roleResponse = await axios.get(`http://localhost:4000/api/admin/users?role=${role}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`   ${role}: ${roleResponse.data.users?.length || 0} users`);
            } catch (error) {
                console.log(`   ${role}: Error -`, error.response?.data?.error || error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
}

// Run the debug
debugUsers();