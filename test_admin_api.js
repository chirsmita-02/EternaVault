const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testAdminAPI() {
    console.log('Testing Admin API endpoints...');
    
    // List of possible admin credentials to test
    const adminCredentials = [
        { email: 'admin@gmail.com', password: 'admin@gmail.com' },
        { email: 'admin2@gmail.com', password: 'admin2@gmail.com' },
        { email: 'heera@gmail.com', password: 'heera@gmail.com' }
    ];
    
    for (const credentials of adminCredentials) {
        try {
            console.log(`\n1. Testing login with ${credentials.email}...`);
            let loginResponse;
            try {
                loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
                    email: credentials.email,
                    password: credentials.password
                });
                console.log('✅ Login successful!');
                console.log('Token received:', loginResponse.data.token ? 'YES' : 'NO');
                console.log('User role:', loginResponse.data.user?.role);
                
                const token = loginResponse.data.token;
                
                // Now test the admin users endpoint
                console.log('\n2. Testing admin users endpoint...');
                try {
                    const usersResponse = await axios.get('http://localhost:4000/api/admin/users', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    console.log('✅ Admin users endpoint successful!');
                    console.log('Users found:', usersResponse.data.users?.length || 0);
                    
                    if (usersResponse.data.users && usersResponse.data.users.length > 0) {
                        console.log('Sample users:');
                        usersResponse.data.users.slice(0, 3).forEach((user, index) => {
                            console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
                        });
                    }
                    return; // Exit if we found working credentials
                } catch (usersError) {
                    console.log('❌ Admin users endpoint failed:', usersError.response?.data || usersError.message);
                    console.log('Status code:', usersError.response?.status);
                }
                
            } catch (loginError) {
                console.log('❌ Login failed:', loginError.response?.data || loginError.message);
            }
        } catch (error) {
            console.error('❌ Unexpected error during API test:', error.message);
        }
    }
    
    console.log('\n3. Testing admin users endpoint without auth (should fail)...');
    try {
        await axios.get('http://localhost:4000/api/admin/users');
        console.log('❌ Unexpected: Request succeeded without authentication');
    } catch (noAuthError) {
        console.log('✅ Correctly rejected request without authentication');
        console.log('Status code:', noAuthError.response?.status);
        console.log('Error message:', noAuthError.response?.data?.error || noAuthError.response?.data);
    }
}

// Run the test
testAdminAPI();