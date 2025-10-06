import { ethers } from 'ethers';

export async function connectMetaMask(): Promise<{ address: string; provider: ethers.BrowserProvider } | null> {
  if (!(window as any).ethereum) return null;
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  return { address: accounts[0], provider };
}


