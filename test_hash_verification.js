/**
 * Test script to verify hash format matching
 * This will help debug why verification is failing even though certificate is on blockchain
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const crypto = require('crypto');

const API_BASE_URL = 'http://localhost:4000/api';

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function testHashFormat() {
  console.log('\n=== HASH FORMAT VERIFICATION TEST ===\n');
  
  // Create test file
  const testPDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 100 700 Td(Test Certificate)Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer<</Size 5/Root 1 0 R>>startxref 300
%%EOF`;
  
  fs.writeFileSync('test_hash.pdf', testPDF);
  const fileBuffer = fs.readFileSync('test_hash.pdf');
  
  // Step 1: Compute hash (same as backend)
  const computedHash = sha256Hex(fileBuffer);
  console.log('1. Computed Hash (SHA-256):');
  console.log(`   ${computedHash}`);
  console.log(`   Length: ${computedHash.length} chars`);
  console.log(`   Format: ${/^[0-9a-f]{64}$/.test(computedHash) ? '✅ Valid lowercase hex' : '❌ Invalid'}`);
  
  // Step 2: Format for blockchain (registrar format)
  const registrarFormat = '0x' + computedHash;
  console.log('\n2. Registrar Format (for addCertificate):');
  console.log(`   ${registrarFormat}`);
  console.log(`   Length: ${registrarFormat.length} chars (should be 66)`);
  console.log(`   Format: ${registrarFormat.startsWith('0x') && registrarFormat.length === 66 ? '✅ Valid' : '❌ Invalid'}`);
  
  // Step 3: Format for verification (insurer format)
  const insurerFormat = '0x' + computedHash;
  console.log('\n3. Insurer Format (for verifyCertificate):');
  console.log(`   ${insurerFormat}`);
  console.log(`   Length: ${insurerFormat.length} chars (should be 66)`);
  console.log(`   Format: ${insurerFormat.startsWith('0x') && insurerFormat.length === 66 ? '✅ Valid' : '❌ Invalid'}`);
  
  // Step 4: Compare
  console.log('\n4. Format Comparison:');
  console.log(`   Registrar: ${registrarFormat}`);
  console.log(`   Insurer:   ${insurerFormat}`);
  console.log(`   Match: ${registrarFormat === insurerFormat ? '✅ YES - Formats match!' : '❌ NO - Formats differ!'}`);
  
  // Step 5: Test with actual API
  console.log('\n5. Testing with Backend API:');
  
  try {
    // Upload as registrar
    const uploadForm = new FormData();
    uploadForm.append('file', fs.createReadStream('test_hash.pdf'));
    uploadForm.append('fullName', 'Hash Test Person');
    uploadForm.append('wallet', '0x1234567890123456789012345678901234567890');
    
    console.log('   📤 Uploading to IPFS...');
    const uploadRes = await axios.post(`${API_BASE_URL}/registrar/upload`, uploadForm, {
      headers: uploadForm.getHeaders(),
      timeout: 30000
    });
    
    const backendHash = uploadRes.data.hash;
    console.log(`   ✅ Backend returned hash: ${backendHash}`);
    console.log(`   Backend hash length: ${backendHash.length} chars`);
    console.log(`   Backend hash format: ${/^[0-9a-f]{64}$/.test(backendHash) ? '✅ Valid lowercase hex' : '❌ Invalid'}`);
    console.log(`   Matches computed: ${backendHash === computedHash ? '✅ YES' : '❌ NO'}`);
    
    // Verify as insurer
    const verifyForm = new FormData();
    verifyForm.append('file', fs.createReadStream('test_hash.pdf'));
    verifyForm.append('claimantName', 'Test Claimant');
    verifyForm.append('deceasedName', 'Hash Test Person');
    
    console.log('\n   🔍 Verifying...');
    const verifyRes = await axios.post(`${API_BASE_URL}/insurer/verify`, verifyForm, {
      headers: verifyForm.getHeaders(),
      timeout: 20000
    });
    
    const verifyHash = verifyRes.data.localHash;
    console.log(`   ✅ Verification hash: ${verifyHash}`);
    console.log(`   Verification hash length: ${verifyHash.length} chars`);
    console.log(`   Verification hash format: ${/^[0-9a-f]{64}$/.test(verifyHash) ? '✅ Valid lowercase hex' : '❌ Invalid'}`);
    console.log(`   Matches computed: ${verifyHash === computedHash ? '✅ YES' : '❌ NO'}`);
    console.log(`   Matches backend: ${verifyHash === backendHash ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n   📊 Verification Result:');
    console.log(`   Verified: ${verifyRes.data.verified ? '✅ YES' : '❌ NO'}`);
    console.log(`   Blockchain exists: ${verifyRes.data.onchainData.exists ? '✅ YES' : '❌ NO'}`);
    
    if (!verifyRes.data.verified && !verifyRes.data.onchainData.exists) {
      console.log('\n   ⚠️  ISSUE DETECTED:');
      console.log('   Certificate not found on blockchain even though hash formats match.');
      console.log('   Possible causes:');
      console.log('   1. Certificate was not actually registered on blockchain');
      console.log('   2. Different network (contract on different chain)');
      console.log('   3. Wrong contract address');
      console.log('   4. Transaction failed or was reverted');
      console.log('\n   To check:');
      console.log(`   - Verify transaction on Polygonscan`);
      console.log(`   - Check if contract address matches: ${process.env.REGISTRY_ADDRESS || 'Check .env'}`);
      console.log(`   - Check if network is Polygon Amoy (chainId 80002)`);
    }
    
  } catch (err) {
    console.error('   ❌ API Error:', err.response?.data || err.message);
  }
  
  // Cleanup
  fs.unlinkSync('test_hash.pdf');
  
  console.log('\n=== TEST COMPLETE ===\n');
}

testHashFormat().catch(console.error);

