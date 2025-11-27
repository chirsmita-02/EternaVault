/**
 * Script to check a blockchain transaction and see what hash was stored
 * Usage: node check_transaction.js <transaction_hash>
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
  console.log('Usage: node check_transaction.js <transaction_hash>');
  console.log('Example: node check_transaction.js 0x1234...');
  process.exit(1);
}

async function checkTransaction() {
  console.log('\n=== CHECKING BLOCKCHAIN TRANSACTION ===\n');
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Contract Address: ${REGISTRY_ADDRESS}`);
  console.log(`RPC URL: ${RPC_URL}\n`);
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Get transaction receipt
    console.log('📡 Fetching transaction receipt...');
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      console.error('❌ Transaction not found!');
      console.log('Possible reasons:');
      console.log('  1. Transaction hash is incorrect');
      console.log('  2. Transaction is on a different network');
      console.log('  3. Transaction is still pending');
      return;
    }
    
    console.log('✅ Transaction found!');
    console.log(`   Block Number: ${receipt.blockNumber}`);
    console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed/Reverted'}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   From: ${receipt.from}`);
    console.log(`   To: ${receipt.to}`);
    
    if (receipt.status !== 1) {
      console.log('\n⚠️  Transaction failed or was reverted!');
      console.log('This means the certificate was NOT registered on blockchain.');
      return;
    }
    
    // Check if transaction is to our contract
    if (receipt.to?.toLowerCase() !== REGISTRY_ADDRESS.toLowerCase()) {
      console.log('\n⚠️  WARNING: Transaction is NOT to the configured contract address!');
      console.log(`   Expected: ${REGISTRY_ADDRESS}`);
      console.log(`   Actual:   ${receipt.to}`);
    }
    
    // Decode transaction data to see what was stored
    console.log('\n📋 Decoding transaction data...');
    const abi = [
      "function addCertificate(bytes32 certHash, string ipfsCid)"
    ];
    
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseTransaction({ data: receipt.data });
    
    if (decoded && decoded.name === 'addCertificate') {
      const storedHash = decoded.args[0];
      const storedIpfsCid = decoded.args[1];
      
      console.log('✅ Transaction decoded successfully!');
      console.log(`   Stored Hash: ${storedHash}`);
      console.log(`   Stored IPFS CID: ${storedIpfsCid}`);
      
      // Now verify this hash on blockchain
      console.log('\n🔍 Verifying stored hash on blockchain...');
      const contract = new ethers.Contract(REGISTRY_ADDRESS, [
        "function verifyCertificate(bytes32 certHash) view returns (bool,string,address,uint256)"
      ], provider);
      
      const verifyResult = await contract.verifyCertificate(storedHash);
      console.log(`   Exists: ${verifyResult[0] ? '✅ YES' : '❌ NO'}`);
      
      if (verifyResult[0]) {
        console.log(`   IPFS CID: ${verifyResult[1]}`);
        console.log(`   Registrar: ${verifyResult[2]}`);
        console.log(`   Timestamp: ${new Date(Number(verifyResult[3]) * 1000).toLocaleString()}`);
      }
      
      // Compare with what we're trying to verify
      console.log('\n📊 Hash Comparison:');
      console.log(`   Hash stored in transaction: ${storedHash}`);
      console.log(`   Hash length: ${storedHash.length} chars`);
      console.log(`   Format: ${storedHash.startsWith('0x') && storedHash.length === 66 ? '✅ Valid' : '❌ Invalid'}`);
      
    } else {
      console.log('⚠️  Could not decode transaction data');
      console.log('   This might not be an addCertificate transaction');
    }
    
    // Check logs for events
    console.log('\n📜 Transaction Logs:');
    if (receipt.logs && receipt.logs.length > 0) {
      console.log(`   Found ${receipt.logs.length} log(s)`);
      receipt.logs.forEach((log, i) => {
        console.log(`   Log ${i + 1}: ${log.address} (${log.topics.length} topics)`);
      });
    } else {
      console.log('   No logs found');
    }
    
    // Network info
    const network = await provider.getNetwork();
    console.log('\n🌐 Network Information:');
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Network Name: ${network.name}`);
    console.log(`   Expected: Polygon Amoy (Chain ID 80002)`);
    console.log(`   Match: ${network.chainId === 80002n ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('\n❌ Error checking transaction:', error.message);
    if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
      console.log('\nPossible issues:');
      console.log('  1. RPC URL is incorrect or not accessible');
      console.log('  2. Network is down');
      console.log('  3. Wrong network (transaction on different chain)');
    }
  }
  
  console.log('\n=== CHECK COMPLETE ===\n');
}

checkTransaction().catch(console.error);

