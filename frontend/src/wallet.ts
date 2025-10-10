import { ethers } from 'ethers';

export async function connectMetaMask(): Promise<{ address: string; provider: ethers.BrowserProvider } | null> {
  if (!(window as any).ethereum) {
    alert('MetaMask is not installed. Please install MetaMask to continue.');
    return null;
  }
  
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  
  try {
    // Request account access and let MetaMask show the account selection dialog
    const accounts = await provider.send('eth_requestAccounts', []);
    
    // Check if we're on the correct network (Polygon Amoy testnet - chainId 80002)
    const network = await provider.getNetwork();
    const requiredChainId = '0x13882'; // 80002 in hex
    
    if (network.chainId.toString() !== '80002') {
      try {
        // Request to switch to Polygon Amoy
        await provider.send('wallet_switchEthereumChain', [{ chainId: requiredChainId }]);
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            // Add Polygon Amoy network
            await provider.send('wallet_addEthereumChain', [{
              chainId: requiredChainId,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://rpc-amoy.polygon.technology/'],
              blockExplorerUrls: ['https://www.oklink.com/amoy']
            }]);
          } catch (addError) {
            console.error('Failed to add Polygon Amoy network:', addError);
            alert('Please manually switch to Polygon Amoy network in MetaMask');
          }
        } else {
          console.error('Failed to switch to Polygon Amoy network:', switchError);
          alert('Please manually switch to Polygon Amoy network in MetaMask');
        }
      }
    }
    
    return { address: accounts[0], provider };
  } catch (error: any) {
    if (error.code === 4001) {
      console.log('User rejected MetaMask connection');
      alert('MetaMask connection rejected. Please connect to continue.');
    } else {
      console.error('MetaMask connection error:', error);
      alert('Failed to connect to MetaMask. Please try again.');
    }
    return null;
  }
}