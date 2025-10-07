# Blockchain Verification Fix Guide

## Problem Analysis

Based on your description, the issue is that while certificates are being uploaded to IPFS and their metadata is stored in MongoDB, they are not being properly registered on the blockchain. This causes the insurance verification to fail because the blockchain verification function cannot find the certificate hash.

The symptoms you described:
- Only 2 transactions visible in Polygonscan
- 118 requests in Alchemy (indicating frontend attempts)
- Verification shows "no match" when checking certificates

## Root Cause

The root cause is that the registrar's wallet address has not been granted the `GovernmentRegistrar` role in the smart contract. The [addCertificate](file:///D:/cursor/contracts/contracts/DeathCertificateRegistry.sol#L44-L56) function in the smart contract requires the caller to have the `GovernmentRegistrar` role:

```solidity
modifier onlyRegistrar() {
    require(roles[msg.sender] == Role.GovernmentRegistrar, "Not registrar");
    _;
}
```

## Solution Steps

### 1. Assign GovernmentRegistrar Role

The contract owner needs to assign the `GovernmentRegistrar` role to the registrar's wallet address.

Run the role assignment script:
```bash
cd d:\cursor
node scripts/assign-registrar-role.js <registrar-wallet-address>
```

Replace `<registrar-wallet-address>` with the actual wallet address used by the registrar.

You'll need to set the `DEPLOYER_PRIVATE_KEY` environment variable to the contract owner's private key.

### 2. Verify Role Assignment

Check if the role has been assigned correctly:
```bash
node scripts/check-roles.js <registrar-wallet-address>
```

### 3. Test Blockchain Verification

After assigning the role, test the blockchain verification:
```bash
node scripts/test-blockchain-verification.js <certificate-file-path>
```

### 4. Re-register Certificates

Once the role is assigned, re-upload certificates through the registrar dashboard. The blockchain registration should now succeed.

## Debugging Scripts

Several scripts have been created to help debug and fix the issue:

1. `scripts/assign-registrar-role.js` - Assigns GovernmentRegistrar role to a wallet
2. `scripts/check-roles.js` - Checks what role is assigned to a wallet
3. `scripts/test-blockchain-verification.js` - Tests blockchain verification for a certificate
4. `scripts/debug-registrar-registration.js` - Debugs the registrar registration process

## Verification Process

After fixing the role assignment:

1. Upload a new certificate through the registrar dashboard
2. Check that the blockchain registration succeeds (look for transaction hash)
3. Verify the transaction on Polygonscan
4. Test verification through the insurance dashboard

## Common Issues and Solutions

### Issue: Transaction fails with "Not registrar" error
**Solution**: Assign the GovernmentRegistrar role to the registrar's wallet address

### Issue: Transaction succeeds but certificate not found during verification
**Solution**: Verify that the exact same file is being used for verification as was uploaded

### Issue: Role assignment transaction fails
**Solution**: Ensure the DEPLOYER_PRIVATE_KEY belongs to the contract owner

## Environment Variables Required

Make sure these environment variables are set:
- `REGISTRY_ADDRESS` - Smart contract address
- `RPC_URL` - Polygon RPC endpoint
- `DEPLOYER_PRIVATE_KEY` - Contract owner's private key (for role assignment)

## Additional Notes

1. The smart contract is working correctly - the issue is with role management
2. Once fixed, all future certificate registrations should work properly
3. Existing certificates that failed to register will need to be re-uploaded
4. The verification process in the insurer dashboard should then work correctly