/**
 * Test verification with the specific hash that's on blockchain
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const crypto = require('crypto');

const API_BASE_URL = 'http://localhost:4000/api';

// The hash that's stored on blockchain (from transaction)
const BLOCKCHAIN_HASH = 'd66a74f8d51d3d2638f5d9ad3eb7353285fc1955bcddcd6886489afeb2d6d89d';

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function testVerification() {
  console.log('\n=== TESTING VERIFICATION WITH BLOCKCHAIN HASH ===\n');
  console.log(`Blockchain Hash: ${BLOCKCHAIN_HASH}`);
  console.log(`Hash Length: ${BLOCKCHAIN_HASH.length} chars\n`);
  
  // We need to create a file that has this exact hash
  // But we can't do that easily, so let's test the verification endpoint
  // by checking what hash format it uses
  
  console.log('📋 Hash Format Check:');
  console.log(`   Blockchain stored: 0x${BLOCKCHAIN_HASH}`);
  console.log(`   Length: ${BLOCKCHAIN_HASH.length} chars (should be 64)`);
  console.log(`   Format: ${/^[0-9a-f]{64}$/.test(BLOCKCHAIN_HASH) ? '✅ Valid' : '❌ Invalid'}`);
  
  // Test direct blockchain query
  console.log('\n🔍 Testing direct blockchain query...');
  try {
    const { ethers } = require('ethers');
    require('dotenv').config({ path: './backend/.env' });
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      process.env.REGISTRY_ADDRESS,
      ["function verifyCertificate(bytes32 certHash) view returns (bool,string,address,uint256)"],
      provider
    );
    
    const formattedHash = '0x' + BLOCKCHAIN_HASH;
    console.log(`   Query hash: ${formattedHash}`);
    console.log(`   Hash length: ${formattedHash.length} chars (should be 66)`);
    
    const result = await contract.verifyCertificate(formattedHash);
    console.log(`   ✅ Direct query result: ${result[0] ? 'FOUND' : 'NOT FOUND'}`);
    
    if (result[0]) {
      console.log(`   IPFS CID: ${result[1]}`);
      console.log(`   Registrar: ${result[2]}`);
      console.log(`   Timestamp: ${new Date(Number(result[3]) * 1000).toLocaleString()}`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
  
  console.log('\n💡 IMPORTANT:');
  console.log('   To verify this certificate, you need to upload the EXACT file');
  console.log('   that was registered. The file must hash to:');
  console.log(`   ${BLOCKCHAIN_HASH}`);
  console.log('\n   If you upload a different file (even slightly different),');
  console.log('   it will have a different hash and verification will fail.');
  
  console.log('\n=== TEST COMPLETE ===\n');
}

testVerification().catch(console.error);

