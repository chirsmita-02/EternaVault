import 'dotenv/config';
import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    console.log("Measuring transaction latency...");
    console.log("Wallet:", wallet.address);

    // Dummy transaction: send 0 MATIC to yourself
    const txData = {
        to: wallet.address,
        value: 0
    };

    const startMs = Date.now();
    const tx = await wallet.sendTransaction(txData);
    console.log("txHash =", tx.hash);

    const receipt = await provider.waitForTransaction(tx.hash);
    const endMs = Date.now();

    const wallClockLatency = (endMs - startMs) / 1000;

    // Block timestamp method
    const block = await provider.getBlock(receipt.blockNumber);
    const startSec = Math.floor(startMs / 1000);
    const blockLatency = block.timestamp - startSec;

    console.log("----- Results -----");
    console.log("Wall-Clock Latency (sec):", wallClockLatency);
    console.log("Block Timestamp Latency (sec):", blockLatency);
    console.log("Block Timestamp:", block.timestamp);
    console.log("Block Number:", receipt.blockNumber);
}

main().catch(console.error);