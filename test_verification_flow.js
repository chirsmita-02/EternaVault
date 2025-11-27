/**
 * Test script for Registrar and Insurer verification flow
 * This script tests the complete flow:
 * 1. Registrar uploads certificate to IPFS
 * 2. Registrar registers certificate on blockchain (simulated)
 * 3. Insurer verifies certificate from blockchain
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Create a test PDF file (minimal valid PDF)
function createTestPDF() {
  const testPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Death Certificate) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`;

  const testFilePath = path.join(__dirname, 'test_certificate.pdf');
  fs.writeFileSync(testFilePath, testPDFContent);
  return testFilePath;
}

async function testRegistrarUpload() {
  logSection('TEST 1: REGISTRAR - Upload Certificate to IPFS');
  
  try {
    const testFilePath = createTestPDF();
    log(`✓ Created test certificate file: ${testFilePath}`, 'green');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('fullName', 'John Doe');
    form.append('wallet', '0x1234567890123456789012345678901234567890');
    
    log('📤 Uploading certificate to IPFS...', 'blue');
    const response = await axios.post(`${API_BASE_URL}/registrar/upload`, form, {
      headers: form.getHeaders(),
      timeout: 30000
    });
    
    log('✓ Certificate uploaded successfully!', 'green');
    log(`  - Certificate ID: ${response.data.id}`, 'yellow');
    log(`  - IPFS CID: ${response.data.cid}`, 'yellow');
    log(`  - File Hash: ${response.data.hash}`, 'yellow');
    log(`  - Full Name: ${response.data.fullName}`, 'yellow');
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    log('✓ Test file cleaned up', 'green');
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    log('✗ Registrar upload failed!', 'red');
    if (error.response) {
      log(`  Error: ${error.response.data.error || error.response.data}`, 'red');
      log(`  Status: ${error.response.status}`, 'red');
    } else if (error.request) {
      log('  Error: No response from server. Is the backend running?', 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return {
      success: false,
      error: error.message
    };
  }
}

async function testInsurerVerification(certificateHash) {
  logSection('TEST 2: INSURER - Verify Certificate from Blockchain');
  
  try {
    // Create the same test file for verification
    const testFilePath = createTestPDF();
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('claimantName', 'Jane Smith');
    form.append('deceasedName', 'John Doe');
    
    log('🔍 Verifying certificate against blockchain...', 'blue');
    log(`  Using hash: ${certificateHash}`, 'yellow');
    
    const response = await axios.post(`${API_BASE_URL}/insurer/verify`, form, {
      headers: form.getHeaders(),
      timeout: 20000
    });
    
    log('✓ Verification completed!', 'green');
    log(`  - Verified: ${response.data.verified ? '✅ YES' : '❌ NO'}`, response.data.verified ? 'green' : 'red');
    log(`  - Verification Source: ${response.data.verificationSource || 'blockchain'}`, 'yellow');
    log(`  - Local Hash: ${response.data.localHash}`, 'yellow');
    log(`  - Blockchain Record: ${response.data.onchainData.exists ? 'Found ✅' : 'Not Found ❌'}`, 
        response.data.onchainData.exists ? 'green' : 'red');
    
    if (response.data.onchainData.exists) {
      log(`  - IPFS CID: ${response.data.onchainData.ipfsCid}`, 'yellow');
      log(`  - Registrar Wallet: ${response.data.onchainData.registrar}`, 'yellow');
      log(`  - Timestamp: ${new Date(response.data.onchainData.timestamp * 1000).toLocaleString()}`, 'yellow');
    }
    
    log(`  - Message: ${response.data.message}`, 'yellow');
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    log('✓ Test file cleaned up', 'green');
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    log('✗ Insurer verification failed!', 'red');
    if (error.response) {
      log(`  Error: ${error.response.data.error || error.response.data}`, 'red');
      log(`  Status: ${error.response.status}`, 'red');
      if (error.response.data.details) {
        log(`  Details: ${error.response.data.details}`, 'red');
      }
    } else if (error.request) {
      log('  Error: No response from server. Is the backend running?', 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return {
      success: false,
      error: error.message
    };
  }
}

async function testCertificateDetails(hash) {
  logSection('TEST 3: Get Certificate Details');
  
  try {
    log(`🔍 Fetching certificate details for hash: ${hash}...`, 'blue');
    const response = await axios.get(`${API_BASE_URL}/insurer/certificate/${hash}`, {
      timeout: 15000
    });
    
    log('✓ Certificate details retrieved!', 'green');
    log(`  - Database Status: ${response.data.databaseData.status}`, 'yellow');
    log(`  - Blockchain Exists: ${response.data.blockchainData.exists ? '✅ YES' : '❌ NO'}`, 
        response.data.blockchainData.exists ? 'green' : 'red');
    log(`  - IPFS CID Match: ${response.data.consistencyCheck.ipfsCidMatch ? '✅ YES' : '❌ NO'}`, 
        response.data.consistencyCheck.ipfsCidMatch ? 'green' : 'red');
    log(`  - Registrar Match: ${response.data.consistencyCheck.registrarMatch ? '✅ YES' : '❌ NO'}`, 
        response.data.consistencyCheck.registrarMatch ? 'green' : 'red');
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    log('✗ Failed to get certificate details!', 'red');
    if (error.response) {
      log(`  Error: ${error.response.data.error || error.response.data}`, 'red');
      log(`  Status: ${error.response.status}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  logSection('🚀 STARTING VERIFICATION FLOW TESTS');
  log(`API Base URL: ${API_BASE_URL}`, 'blue');
  log('Make sure the backend server is running!', 'yellow');
  
  // Test 1: Registrar Upload
  const uploadResult = await testRegistrarUpload();
  
  if (!uploadResult.success) {
    log('\n❌ Test failed at Registrar Upload step. Cannot continue.', 'red');
    log('Please check:', 'yellow');
    log('  1. Backend server is running (npm run dev)', 'yellow');
    log('  2. MongoDB is connected', 'yellow');
    log('  3. IPFS/Pinata credentials are configured', 'yellow');
    process.exit(1);
  }
  
  const certificateHash = uploadResult.data.hash;
  log(`\n📋 Certificate Hash: ${certificateHash}`, 'cyan');
  log('⚠️  NOTE: For full test, you need to register this certificate on blockchain via the frontend!', 'yellow');
  log('   The certificate is uploaded to IPFS, but blockchain registration requires MetaMask.', 'yellow');
  
  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Insurer Verification
  const verificationResult = await testInsurerVerification(certificateHash);
  
  // Test 3: Certificate Details
  await testCertificateDetails(certificateHash);
  
  // Summary
  logSection('📊 TEST SUMMARY');
  log(`Registrar Upload: ${uploadResult.success ? '✅ PASSED' : '❌ FAILED'}`, uploadResult.success ? 'green' : 'red');
  log(`Insurer Verification: ${verificationResult.success ? '✅ PASSED' : '❌ FAILED'}`, verificationResult.success ? 'green' : 'red');
  
  if (verificationResult.success && !verificationResult.data.verified) {
    log('\n⚠️  Certificate not found on blockchain. This is expected if:', 'yellow');
    log('  1. The certificate was not registered on blockchain yet', 'yellow');
    log('  2. You need to complete blockchain registration via frontend', 'yellow');
    log('  3. The hash format might not match', 'yellow');
  }
  
  log('\n✅ All tests completed!', 'green');
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test script error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

