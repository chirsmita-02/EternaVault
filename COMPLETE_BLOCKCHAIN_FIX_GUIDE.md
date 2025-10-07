# Complete Blockchain Fix Guide

## Problem Summary

The blockchain verification is not working because the registrar's wallet address has not been granted the `GovernmentRegistrar` role in the smart contract. While certificates are being uploaded to IPFS and stored in MongoDB, they are not being registered on the blockchain because the registrar lacks the required permissions.

## Solution Steps

### Step 1: Identify Your Registrar Wallet Address

1. Open your MetaMask wallet that you use for the registrar dashboard
2. Copy the wallet address (it starts with 0x followed by 40 hexadecimal characters)
3. This is the address you need to assign the GovernmentRegistrar role to

### Step 2: Assign GovernmentRegistrar Role

Run the following command, replacing `YOUR_REGISTRAR_WALLET_ADDRESS` with your actual registrar wallet address:

```bash
cd d:\cursor
node scripts/assign-registrar-role.js YOUR_REGISTRAR_WALLET_ADDRESS
```

For example:
```bash
node scripts/assign-registrar-role.js 0x1234567890123456789012345678901234567890
```

This command will:
1. Use the contract owner's private key (from your backend .env file)
2. Connect to the Polygon Amoy network
3. Assign the GovernmentRegistrar role to your registrar wallet
4. Confirm the transaction on the blockchain

### Step 3: Verify Role Assignment

After assigning the role, verify it was successful:

```bash
cd d:\cursor
node scripts/check-roles.js YOUR_REGISTRAR_WALLET_ADDRESS
```

You should see:
```
Role number: 1
Role name: GovernmentRegistrar
```

### Step 4: Test Blockchain Verification

Create a test certificate and verify it can be found on the blockchain:

```bash
cd d:\cursor
echo "Test certificate for blockchain verification" > test-cert.txt
node scripts/test-blockchain-verification.js test-cert.txt
```

Initially, this will show "Certificate not found on blockchain" which is expected.

### Step 5: Re-upload Certificates

1. Go to your registrar dashboard
2. Upload a new certificate
3. Connect your MetaMask wallet when prompted
4. Confirm the blockchain registration transaction

### Step 6: Verify Registration on Polygonscan

1. After successful registration, you should see a transaction hash
2. Visit https://amoy.polygonscan.com/
3. Search for your transaction hash to verify it was recorded on the blockchain

### Step 7: Test Insurance Verification

1. Go to your insurance company dashboard
2. Upload the same certificate you registered
3. The verification should now succeed and show "Verified: File hash matches blockchain record."

## Troubleshooting

### Issue: "Invalid address format"
- Make sure you're using a valid Ethereum wallet address (0x followed by 40 hex characters)

### Issue: "DEPLOYER_PRIVATE_KEY not found"
- Ensure your backend/.env file contains the DEPLOYER_PRIVATE_KEY

### Issue: Transaction fails with "Not registrar" error
- Double-check that the role assignment was successful using the check-roles script

### Issue: Still seeing "no match" in verification
- Make sure you're uploading the exact same file for verification as you registered
- File names don't matter, but the file content must be identical

## Important Notes

1. **Security**: The DEPLOYER_PRIVATE_KEY in your .env file is the owner of the smart contract. Keep this secure and never share it.

2. **Role Management**: Only the contract owner can assign roles. The owner is the address derived from the DEPLOYER_PRIVATE_KEY.

3. **Network**: All operations are performed on the Polygon Amoy testnet.

4. **Gas Fees**: Assigning roles and registering certificates will require a small amount of test MATIC for gas fees.

## Verification Success Indicators

1. Role check shows "GovernmentRegistrar" for your registrar wallet
2. Polygonscan shows successful transactions from your registrar wallet
3. Blockchain verification script finds your certificate after registration
4. Insurance verification dashboard shows "Verified" status

## Next Steps

After completing these steps:
1. All new certificate registrations should work properly
2. Insurance verification should succeed for registered certificates
3. You should see transactions in Polygonscan matching the number of certificates you've registered