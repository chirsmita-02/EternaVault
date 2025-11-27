const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

// Function to normalize user data exactly like the frontend does
function normalize(u) {
    console.log('Normalizing user:', u.name, u.email, u.role);
    const role = u.role;
    
    // Get username based on role
    let username;
    if (role === 'registrar') {
        username = u?.registrarInfo?.employeeId || u.username;
    } else if (role === 'insurer') {
        username = u?.insurerInfo?.licenseNumber || u.username;
    } else {
        username = u.username;
    }
    
    const normalized = {
        id: String(u._id || u.id),
        name: u.name || u.fullName || 'User',
        email: u.email,
        role,
        username,
        // Use the user's status or default to active
        status: u.status || 'active',
        raw: u,
    };
    
    console.log('Normalized result:', normalized);
    return normalized;
}

async function testFrontendDataFlow() {
    console.log('=== FRONTEND DATA FLOW TEST ===\n');
    
    try {
        // Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin2@gmail.com',
            password: 'admin2@gmail.com'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');
        
        // Fetch all users exactly like the frontend does
        console.log('2. Fetching all users (like frontend does)...');
        const res = await axios.get('http://localhost:4000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`Received ${res.data?.users?.length || 0} total users from API`);
        console.log('Raw API response:', JSON.stringify(res.data, null, 2));
        
        // Process data exactly like frontend
        const allUsers = (res.data?.users || []).map(normalize);
        console.log(`\nNormalized ${allUsers.length} users`);
        
        // Filter users by role like frontend does
        const registrars = allUsers.filter(u => u.role === 'registrar');
        const insurers = allUsers.filter(u => u.role === 'insurer');
        const claimants = allUsers.filter(u => u.role === 'claimant');
        const admins = allUsers.filter(u => u.role === 'admin');
        
        console.log('\n=== DATA BREAKDOWN ===');
        console.log(`Admins: ${admins.length}`);
        console.log(`Registrars: ${registrars.length}`);
        console.log(`Insurers: ${insurers.length}`);
        console.log(`Claimants: ${claimants.length}`);
        
        console.log('\n=== SAMPLE DATA ===');
        if (admins.length > 0) {
            console.log('Sample admin:', admins[0]);
        }
        if (registrars.length > 0) {
            console.log('Sample registrar:', registrars[0]);
        }
        if (insurers.length > 0) {
            console.log('Sample insurer:', insurers[0]);
        }
        if (claimants.length > 0) {
            console.log('Sample claimant:', claimants[0]);
        }
        
        console.log('\n=== ANALYSIS ===');
        if (allUsers.length === 0) {
            console.log('❌ NO DATA RECEIVED - This explains why the admin page is empty');
        } else if (allUsers.length === 1 && allUsers[0].role === 'admin') {
            console.log('ℹ️  Only admin user found - this is normal if no other users have been created');
            console.log('💡 To see data in admin tables, you need to create registrar, insurer, and claimant users');
        } else {
            console.log('✅ Data flow is working correctly');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run the test
testFrontendDataFlow();