/**
 * Simple test script for Registrar and Insurer flow
 * Run with: node test_flow_simple.js
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_BASE_URL = 'http://localhost:4000/api';

// Colors
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

function log(msg, color = reset) {
  console.log(`${color}${msg}${reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, cyan);
  console.log('='.repeat(60));
}

// Create minimal test PDF
function createTestPDF() {
  const pdf = `%PDF-1.4
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
  const filePath = path.join(__dirname, 'test_cert.pdf');
  fs.writeFileSync(filePath, pdf);
  return filePath;
}

async function testRegistrar() {
  section('TEST 1: REGISTRAR - Upload Certificate');
  
  try {
    const filePath = createTestPDF();
    log('✓ Created test certificate', green);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('fullName', 'Test Person');
    form.append('wallet', '0x1234567890123456789012345678901234567890');
    
    log('📤 Uploading to IPFS...', yellow);
    const res = await axios.post(`${API_BASE_URL}/registrar/upload`, form, {
      headers: form.getHeaders(),
      timeout: 30000
    });
    
    log('✅ Upload successful!', green);
    log(`   Hash: ${res.data.hash}`, yellow);
    log(`   CID: ${res.data.cid}`, yellow);
    
    fs.unlinkSync(filePath);
    return { success: true, hash: res.data.hash, cid: res.data.cid };
  } catch (err) {
    log('❌ Upload failed!', red);
    if (err.response) {
      log(`   ${err.response.data.error || err.response.data}`, red);
    } else {
      log(`   ${err.message}`, red);
    }
    return { success: false };
  }
}

async function testInsurer(hash) {
  section('TEST 2: INSURER - Verify Certificate');
  
  try {
    const filePath = createTestPDF();
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('claimantName', 'Test Claimant');
    form.append('deceasedName', 'Test Person');
    
    log('🔍 Verifying against blockchain...', yellow);
    log(`   Hash: ${hash}`, yellow);
    
    const res = await axios.post(`${API_BASE_URL}/insurer/verify`, form, {
      headers: form.getHeaders(),
      timeout: 20000
    });
    
    log('✅ Verification completed!', green);
    log(`   Verified: ${res.data.verified ? 'YES ✅' : 'NO ❌'}`, res.data.verified ? green : red);
    log(`   Source: ${res.data.verificationSource || 'blockchain'}`, yellow);
    log(`   Blockchain: ${res.data.onchainData.exists ? 'Found ✅' : 'Not Found ❌'}`, 
        res.data.onchainData.exists ? green : red);
    
    if (res.data.onchainData.exists) {
      log(`   IPFS CID: ${res.data.onchainData.ipfsCid}`, yellow);
      log(`   Registrar: ${res.data.onchainData.registrar}`, yellow);
    }
    
    fs.unlinkSync(filePath);
    return { success: true, verified: res.data.verified };
  } catch (err) {
    log('❌ Verification failed!', red);
    if (err.response) {
      log(`   ${err.response.data.error || err.response.data}`, red);
    } else {
      log(`   ${err.message}`, red);
    }
    return { success: false };
  }
}

async function main() {
  section('🚀 VERIFICATION FLOW TEST');
  log(`API: ${API_BASE_URL}`, yellow);
  log('Make sure backend is running!', yellow);
  
  const upload = await testRegistrar();
  if (!upload.success) {
    log('\n❌ Cannot continue - upload failed', red);
    process.exit(1);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  const verify = await testInsurer(upload.hash);
  
  section('📊 SUMMARY');
  log(`Registrar: ${upload.success ? '✅ PASS' : '❌ FAIL'}`, upload.success ? green : red);
  log(`Insurer: ${verify.success ? '✅ PASS' : '❌ FAIL'}`, verify.success ? green : red);
  
  if (verify.success && !verify.verified) {
    log('\n⚠️  Certificate not on blockchain yet', yellow);
    log('   Complete blockchain registration via frontend to verify', yellow);
  }
  
  log('\n✅ Test complete!', green);
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, red);
  process.exit(1);
});

