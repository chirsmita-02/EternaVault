# How to Fix Blockchain Verification Issue

## Problem
The blockchain verification is not working because your registrar wallet address doesn't have the required `GovernmentRegistrar` role to register certificates on the blockchain.

## Solution

### Step 1: Get Your Registrar Wallet Address
1. Open MetaMask
2. Make sure you're on the correct account that you use for the registrar dashboard
3. Copy the wallet address (starts with 0x)

### Step 2: Update the Assignment Script
1. Open the file `assign-role-to-registrar.js`
2. Replace `YOUR_REGISTRAR_WALLET_ADDRESS_HERE` with your actual wallet address
3. Save the file

For example, change:
```javascript
const REGISTRAR_WALLET_ADDRESS = 'YOUR_REGISTRAR_WALLET_ADDRESS_HERE';
```

To:
```javascript
const REGISTRAR_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
```

### Step 3: Run the Assignment Script
Open a terminal/command prompt and run:
```bash
cd d:\cursor
node assign-role-to-registrar.js
```

### Step 4: Verify the Assignment
You should see output like:
```
Assigning GovernmentRegistrar role to: 0x1234567890123456789012345678901234567890
Current role: 0
Assigning GovernmentRegistrar role...
Transaction sent: 0x...
✅ Transaction confirmed in block: 123456
🎉 Successfully assigned GovernmentRegistrar role!
```

### Step 5: Test the Fix
1. Go to your registrar dashboard
2. Upload a new certificate
3. You should now see a successful blockchain registration with a transaction hash
4. Go to the insurance dashboard and verify the same certificate
5. It should now show as "Verified"

## Troubleshooting

If you get an error:
- "Please update REGISTRAR_WALLET_ADDRESS" - Make sure you updated the address in the script
- "DEPLOYER_PRIVATE_KEY not found" - Check that your backend/.env file contains this key
- "Error: wallet mismatch" - Make sure you're using the correct network (Polygon Amoy)

## Important Notes
- This only needs to be done once per registrar wallet
- The owner of the smart contract (derived from DEPLOYER_PRIVATE_KEY) is the only one who can assign roles
- After this fix, all future certificate registrations should work properly