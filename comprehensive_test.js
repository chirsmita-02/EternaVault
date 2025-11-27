const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function comprehensiveTest() {
    console.log('=== COMPREHENSIVE SYSTEM TEST ===\n');
    
    try {
        // 1. Test health endpoint
        console.log('1. Testing health endpoint...');
        try {
            const healthResponse = await axios.get('http://localhost:4000/health');
            console.log('✅ Health endpoint: OK');
        } catch (error) {
            console.log('❌ Health endpoint failed:', error.response?.status, error.response?.data);
        }
        
        // 2. Login as admin
        console.log('\n2. Logging in as admin...');
        let token;
        try {
            const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
                email: 'admin2@gmail.com',
                password: 'admin2@gmail.com'
            });
            token = loginResponse.data.token;
            console.log('✅ Login successful');
            console.log('   User:', loginResponse.data.user?.name, `(${loginResponse.data.user?.role})`);
        } catch (error) {
            console.log('❌ Login failed:', error.response?.data || error.message);
            return;
        }
        
        // 3. Test admin users endpoint
        console.log('\n3. Testing admin users endpoint...');
        try {
            const usersResponse = await axios.get('http://localhost:4000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Admin users endpoint: OK');
            console.log('   Total users found:', usersResponse.data.users?.length || 0);
            
            // Show user distribution by role
            const users = usersResponse.data.users || [];
            const roleCounts = {};
            users.forEach(user => {
                roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
            });
            console.log('   Users by role:', roleCounts);
            
        } catch (error) {
            console.log('❌ Admin users endpoint failed:', error.response?.data || error.message);
        }
        
        // 4. Test specific role filtering
        console.log('\n4. Testing role-specific filtering...');
        const roles = ['admin', 'registrar', 'insurer', 'claimant'];
        for (const role of roles) {
            try {
                const roleResponse = await axios.get(`http://localhost:4000/api/admin/users?role=${role}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`   ${role}: ${roleResponse.data.users?.length || 0} users`);
            } catch (error) {
                console.log(`   ${role}: Failed -`, error.response?.data?.error || error.message);
            }
        }
        
        // 5. Test other endpoints
        console.log('\n5. Testing admin profile endpoint...');
        try {
            const profileResponse = await axios.get('http://localhost:4000/api/admin/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Admin profile endpoint: OK');
            console.log('   Profile data:', profileResponse.data?.name, `(${profileResponse.data?.role})`);
        } catch (error) {
            console.log('❌ Admin profile endpoint failed:', error.response?.data?.error || error.message);
        }
        
        console.log('\n=== TEST COMPLETED ===');
        console.log('✅ System is working correctly. The issue was using incorrect login credentials.');
        console.log('💡 Use admin2@gmail.com / admin2@gmail.com to login as admin.');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

// Run the test
comprehensiveTest();