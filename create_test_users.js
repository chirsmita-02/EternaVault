const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function createTestUsers() {
    console.log('=== CREATING TEST USERS ===\n');
    
    try {
        // Login as admin first
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin2@gmail.com',
            password: 'admin2@gmail.com'
        });
        const token = loginResponse.data.token;
        console.log('✅ Admin login successful\n');
        
        // Create test users of different types with proper required fields
        const testUsers = [
            {
                fullName: 'Test Registrar',
                email: 'registrar@test.com',
                password: 'registrar123',
                role: 'registrar',
                department: 'Vital Records Department',
                username: 'registrar001',
                phone: '123-456-7890'
            },
            {
                company: 'Test Insurance Co',
                email: 'insurer@test.com',
                password: 'insurer123',
                role: 'insurer',
                username: 'INS001',
                orgAddress: '123 Insurance St'
            },
            {
                fullName: 'Test Claimant',
                email: 'claimant@test.com',
                password: 'claimant123',
                role: 'claimant',
                address: '456 Claimant Ave',
                phone: '987-654-3210'
            }
        ];
        
        console.log('2. Creating test users...\n');
        for (const user of testUsers) {
            try {
                // Register the user
                await axios.post('http://localhost:4000/api/auth/register', user);
                console.log(`✅ Created ${user.role}: ${user.fullName || user.company || 'User'} (${user.email})`);
            } catch (error) {
                if (error.response?.data?.error?.includes('already registered')) {
                    console.log(`ℹ️  ${user.role} ${user.email} already exists`);
                } else {
                    console.log(`❌ Failed to create ${user.role}:`, error.response?.data?.error || error.message);
                }
            }
        }
        
        // Verify users were created
        console.log('\n3. Verifying created users...');
        const usersResponse = await axios.get('http://localhost:4000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const users = usersResponse.data.users || [];
        console.log(`✅ Total users in system: ${users.length}`);
        
        const roleCounts = {};
        users.forEach(user => {
            roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
        });
        console.log('📊 Users by role:', roleCounts);
        
        console.log('\n=== TEST COMPLETE ===');
        console.log('💡 Refresh the admin page to see the new users in the tables');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run the test
createTestUsers();