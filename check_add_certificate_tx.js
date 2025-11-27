/**
 * Check Add Certificate transactions to see what hash was stored
 * Usage: node check_add_certificate_tx.js <transaction_hash>
 */

const { ethers } = require('ethers');
require('dotenv').config({ path: './backend/.env' });

const RPC_URL = process.env.RPC_URL;
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;

if (!RPC_URL || !REGISTRY_ADDRESS) {
  console.error('❌ Missing RPC_URL or REGISTRY_ADDRESS in backend/.env');
  process.exit(1);
}

const txHash = process.argv[2];

if (!txHash) {
  console.log('Usage: node check_add_certificate_tx.js <transaction_hash>');
  console.log('\nExample transaction hashes from your screenshot:');
  console.log('  0x0915e97708... (Add Certificate)');
  console.log('  0xb69c7a83e0... (Add Certificate)');
  console.log('  0xa0de233d86... (Add Certificate)');
  process.exit(1);
}

async function checkTransaction() {
  console.log('\n=== CHECKING ADD CERTIFICATE TRANSACTION ===\n');
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Configured Contract: ${REGISTRY_ADDRESS}`);
  console.log(`RPC URL: ${RPC_URL}\n`);
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Get transaction receipt
    console.log('📡 Fetching transaction...');
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      console.error('❌ Transaction not found!');
      console.log('Check:');
      console.log('  1. Transaction hash is correct');
      console.log('  2. You are on the correct network (Polygon Amoy)');
      return;
    }
    
    console.log('✅ Transaction found!');
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
    console.log(`   To: ${receipt.to}`);
    
    // Check contract address match
    const contractMatch = receipt.to?.toLowerCase() === REGISTRY_ADDRESS.toLowerCase();
    console.log(`   Contract Match: ${contractMatch ? '✅ YES' : '❌ NO'}`);
    if (!contractMatch) {
      console.log(`   ⚠️  WARNING: Transaction is to different contract!`);
      console.log(`   Expected: ${REGISTRY_ADDRESS}`);
      console.log(`   Actual:   ${receipt.to}`);
    }
    
    if (receipt.status !== 1) {
      console.log('\n❌ Transaction failed - certificate was NOT registered!');
      return;
    }
    
    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    console.log(`   From: ${tx.from}`);
    
    // Decode transaction data
    console.log('\n📋 Decoding transaction data...');
    const abi = [
      "function addCertificate(bytes32 certHash, string ipfsCid)"
    ];
    
    const iface = new ethers.Interface(abi);
    let decoded;
    
    try {
      decoded = iface.parseTransaction({ data: tx.data });
    } catch (e) {
      console.log('❌ Could not decode as addCertificate transaction');
      console.log('   This might be a different transaction type');
      return;
    }
    
    if (decoded && decoded.name === 'addCertificate') {
      const storedHash = decoded.args[0];
      const storedIpfsCid = decoded.args[1];
      
      console.log('✅ Transaction decoded successfully!');
      console.log(`\n📦 Stored Data:`);
      console.log(`   Hash: ${storedHash}`);
      console.log(`   Hash (without 0x): ${storedHash.substring(2)}`);
      console.log(`   Hash Length: ${storedHash.length} chars`);
      console.log(`   IPFS CID: ${storedIpfsCid}`);
      
      // Verify this hash exists on blockchain
      console.log('\n🔍 Verifying stored hash on blockchain...');
      const contract = new ethers.Contract(REGISTRY_ADDRESS, [
        "function verifyCertificate(bytes32 certHash) view returns (bool,string,address,uint256)"
      ], provider);
      
      try {
        const verifyResult = await contract.verifyCertificate(storedHash);
        const exists = verifyResult[0];
        const ipfsCid = verifyResult[1];
        const registrar = verifyResult[2];
        const timestamp = Number(verifyResult[3]);
        
        console.log(`   Exists: ${exists ? '✅ YES' : '❌ NO'}`);
        
        if (exists) {
          console.log(`   ✅ Certificate FOUND on blockchain!`);
          console.log(`   IPFS CID: ${ipfsCid}`);
          console.log(`   Registrar: ${registrar}`);
          console.log(`   Timestamp: ${new Date(timestamp * 1000).toLocaleString()}`);
          console.log(`   Block Timestamp: ${timestamp}`);
          
          // Compare IPFS CIDs
          console.log(`\n📊 Data Comparison:`);
          console.log(`   Stored IPFS CID: ${storedIpfsCid}`);
          console.log(`   Retrieved IPFS CID: ${ipfsCid}`);
          console.log(`   Match: ${storedIpfsCid === ipfsCid ? '✅ YES' : '❌ NO'}`);
        } else {
          console.log(`   ❌ Certificate NOT found on blockchain!`);
          console.log(`   This is strange - transaction succeeded but hash not found.`);
        }
      } catch (verifyError) {
        console.log(`   ❌ Error verifying: ${verifyError.message}`);
      }
      
      // Network check
      const network = await provider.getNetwork();
      console.log(`\n🌐 Network:`);
      console.log(`   Chain ID: ${network.chainId}`);
      console.log(`   Name: ${network.name}`);
      console.log(`   Expected: Polygon Amoy (80002)`);
      console.log(`   Match: ${network.chainId === 80002n ? '✅ YES' : '❌ NO'}`);
      
      console.log(`\n💡 To verify a certificate, use this hash:`);
      console.log(`   ${storedHash.substring(2)}`);
      console.log(`   (without 0x prefix - backend will add it)`);
      
    } else {
      console.log('❌ Not an addCertificate transaction');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'NETWORK_ERROR') {
      console.log('   Check your RPC_URL in backend/.env');
    }
  }
  
  console.log('\n=== CHECK COMPLETE ===\n');
}

checkTransaction().catch(console.error);

