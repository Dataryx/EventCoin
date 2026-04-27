require('dotenv').config({ path: './.env' });
import Web3 from "web3";

let web3;
const rpcUrl =
  process.env.INFURA_ENDPOINT ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  // We are in the browser and metamask is running.
  window.ethereum.request({ method: "eth_requestAccounts" });
  web3 = new Web3(window.ethereum);
} else {
  // We are on the server *OR* the user is not running metamask

  const provider = new Web3.providers.HttpProvider(rpcUrl);
  web3 = new Web3(provider);
}

export default web3;
