// api/publish.js
// PressChain — Publish report to IPFS + timestamp on Base
// Synthesis Hackathon 2026

const { ethers } = require("ethers");
require("dotenv").config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET;
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function publishReport(address reporter, string calldata ipfsCID, uint256 readPrice, uint256 licensePrice) external returns (uint256)",
  "event ReportPublished(uint256 indexed reportId, address indexed reporter, string ipfsCID, uint256 timestamp)",
];

async function uploadToIPFS(content, title) {
  const metadata = {
    title,
    content,
    source: "PressChain",
    publishedAt: new Date().toISOString(),
    network: "Base Mainnet",
  };

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: title },
    }),
  });

  if (!response.ok) throw new Error("IPFS upload failed");

  const data = await response.json();
  console.log(`✅ Uploaded to IPFS: ${data.IpfsHash}`);
  return data.IpfsHash;
}

async function timestampOnChain(ipfsCID, monetization) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  const readPrice = monetization.includes("read")
    ? ethers.parseEther("0.001")
    : 0n;
  const licensePrice = monetization.includes("license")
    ? ethers.parseEther("0.05")
    : 0n;

  const tx = await contract.publishReport(
    wallet.address,
    ipfsCID,
    readPrice,
    licensePrice
  );

  const receipt = await tx.wait();
  console.log(`✅ Timestamped on Base: ${tx.hash}`);
  console.log(`🔗 https://basescan.org/tx/${tx.hash}`);

  const event = receipt.logs[0];
  const reportId = event?.topics[1] ? parseInt(event.topics[1], 16) : 0;

  return { txHash: tx.hash, reportId };
}

async function publishReport({ reporterId, content, title, monetization }) {
  console.log(`\n📰 Publishing report: "${title}"`);

  const ipfsCID = await uploadToIPFS(content, title);
  const { txHash, reportId } = await timestampOnChain(ipfsCID, monetization);

  return {
    reportId,
    ipfsCID,
    txHash,
    title,
    publishedAt: new Date().toISOString(),
  };
}

module.exports = { publishReport };
