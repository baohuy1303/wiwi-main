import { useState } from "react";
import { ethers } from "ethers";

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<string[] | string>;
      on: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const USDC_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 value) returns (bool)"
]

function Wallet() {

    const [walletAddress, setWalletAddress] = useState("");
    const [walletETHBalance, setWalletETHBalance] = useState("");
    const [walletUSDCBalance, setWalletUSDCBalance] = useState("");
    const [error, setError] = useState("");
    const [targetWallet, setTargetWallet] = useState("");
    const [success, setSuccess] = useState("");

const connectWallet = async () => {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        const balance = await window.ethereum.request({ method: "eth_getBalance", params: [accounts[0], "latest"] });
        setWalletETHBalance(ethers.formatEther(balance as string));

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
        const usdcBalance = await usdc.balanceOf(accounts[0]);
        setWalletUSDCBalance(ethers.formatUnits(usdcBalance, 6));
    }else{
        setError("Please install MetaMask");
    }
}

const handleChainChanged = () => {
    window.location.reload();
}

const sendUSDC = async () => {
    try{
        if (!window.ethereum) {
            setError("Please install MetaMask");
            return;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

        const amount = ethers.parseUnits("1", 6);

        const tx = await usdc.transfer(targetWallet, amount);
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("Transaction mined");
        setSuccess("Transaction sent successfully");
    }
    catch(error){
        console.error("Error sending USDC:", error);
        setError("Error sending USDC");
    }
}

window.ethereum?.on("accountsChanged", connectWallet);
window.ethereum?.on("chainChanged", handleChainChanged);


    return (
        <div>
            <h1>Wallet</h1>

            <button className="bg-blue-500 text-white p-2 rounded-md"  onClick={connectWallet}>Connect Wallet</button>

            <p>Wallet Address: {walletAddress}</p>
            <p>Wallet ETH Balance: {walletETHBalance}</p>
            <p>Wallet USDC Balance: {walletUSDCBalance}</p>
            <p className="text-red-500">{error}</p>
            <p className="text-green-500">{success}</p>

            <input type="text" placeholder="Target Wallet" value={targetWallet} onChange={(e) => setTargetWallet(e.target.value)} />

            <button className="bg-blue-500 text-white p-2 rounded-md"  onClick={sendUSDC}>Send USDC</button>
        </div>
    )
}

export default Wallet;