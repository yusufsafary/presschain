// api/payment.js
// PressChain Payment Handler
// Handles x402 crypto payments + mock fiat simulation
// Synthesis Hackathon 2026 — Agents that Pay

const { ethers } = require("ethers");
require("dotenv").config();

// ── Config ────────────────────────────────────────────────────────────────

const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function payToRead(uint256 reportId) external payable",
  "function tipReporter(uint256 reportId) external payable",
  "function purchaseLicense(uint256 reportId) external payable",
  "function getReport(uint256 reportId) external view returns (tuple(address reporter, string ipfsCID, uint256 publishedAt, uint256 readPrice, uint256 licensePrice, uint256 totalEarned, uint256 tipCount, bool active))",
  "event ReportRead(uint256 indexed reportId, address indexed reader, uint256 amount)",
  "event TipSent(uint256 indexed reportId, address indexed tipper, address indexed reporter, uint256 amount)",
  "event LicensePurchased(uint256 indexed reportId, address indexed buyer, address indexed reporter, uint256 amount)"
];

// Mock fiat exchange rate (IDR per ETH) — updated manually for demo
const MOCK_ETH_TO_IDR = 50_000_000; // 1 ETH ≈ Rp 50.000.000

// ── Provider & Contract ───────────────────────────────────────────────────

function getContract() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}

// ── Crypto Payments (Real — via x402 on Base) ─────────────────────────────

/**
 * Pay to read a report
 * @param {number} reportId
 * @param {string} readPriceEth - e.g. "0.001"
 */
async function payToRead(reportId, readPriceEth) {
  try {
    const contract = getContract();
    const value = ethers.parseEther(readPriceEth);

    console.log(`💳 Paying to read report #${reportId}...`);
    const tx = await contract.payToRead(reportId, { value });
    await tx.wait();

    console.log(`✅ Payment successful! Tx: ${tx.hash}`);
    console.log(`🔗 https://basescan.org/tx/${tx.hash}`);

    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ payToRead failed:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send a tip to a reporter
 * @param {number} reportId
 * @param {string} tipAmountEth - e.g. "0.005"
 */
async function tipReporter(reportId, tipAmountEth) {
  try {
    const contract = getContract();
    const value = ethers.parseEther(tipAmountEth);

    console.log(`💝 Sending tip to reporter for report #${reportId}...`);
    const tx = await contract.tipReporter(reportId, { value });
    await tx.wait();

    console.log(`✅ Tip sent! Tx: ${tx.hash}`);
    console.log(`🔗 https://basescan.org/tx/${tx.hash}`);

    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ tipReporter failed:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Purchase media license for a report
 * @param {number} reportId
 * @param {string} licensePriceEth - e.g. "0.05"
 */
async function purchaseLicense(reportId, licensePriceEth) {
  try {
    const contract = getContract();
    const value = ethers.parseEther(licensePriceEth);

    console.log(`📰 Purchasing media license for report #${reportId}...`);
    const tx = await contract.purchaseLicense(reportId, { value });
    await tx.wait();

    console.log(`✅ License purchased! Tx: ${tx.hash}`);
    console.log(`🔗 https://basescan.org/tx/${tx.hash}`);

    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ purchaseLicense failed:", err.message);
    return { success: false, error: err.message };
  }
}

// ── Mock Fiat Simulation ──────────────────────────────────────────────────
// NOTE: This is a demo simulation only.
// Production fiat integration will use a licensed payment gateway (e.g. Midtrans).

/**
 * Simulate fiat payment — converts ETH amount to IDR and mocks QRIS generation
 * @param {number} reportId
 * @param {string} paymentType - "read" | "tip" | "license"
 * @param {string} amountEth
 */
async function mockFiatPayment(reportId, paymentType, amountEth) {
  const amountIDR = parseFloat(amountEth) * MOCK_ETH_TO_IDR;
  const formattedIDR = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amountIDR);

  // Simulate processing delay
  await new Promise((r) => setTimeout(r, 1500));

  const mockQRIS = `00020101021226590014ID.CO.PRESSCHAIN.WWW011893600912345678901502152026031600000000030303UMI51440014ID.CO.QRIS.WWW0215ID10220${reportId}0303UMI5204999953033605802ID5910PressChain6015Jakarta Selatan61051234062190515PRESS${reportId}${Date.now()}6304ABCD`;

  console.log(`\n💵 [MOCK FIAT] Simulating ${paymentType} payment`);
  console.log(`   Report ID : #${reportId}`);
  console.log(`   Amount    : ${amountEth} ETH ≈ ${formattedIDR}`);
  console.log(`   Method    : QRIS (simulated)`);
  console.log(`   Status    : ✅ PAID (mock)`);
  console.log(`   QRIS Code : ${mockQRIS.slice(0, 40)}...`);

  return {
    success: true,
    mock: true,
    reportId,
    paymentType,
    amountEth,
    amountIDR,
    formattedIDR,
    qrisCode: mockQRIS,
    paidAt: new Date().toISOString(),
    note: "This is a simulated fiat payment for demo purposes.",
  };
}

/**
 * Main payment router — decides crypto vs fiat based on reporter preference
 * @param {number} reportId
 * @param {string} paymentType - "read" | "tip" | "license"
 * @param {string} amountEth
 * @param {string} currency - "crypto" | "fiat"
 */
async function processPayment(reportId, paymentType, amountEth, currency = "crypto") {
  console.log(`\n🔄 Processing ${currency} payment for report #${reportId}...`);

  if (currency === "fiat") {
    return await mockFiatPayment(reportId, paymentType, amountEth);
  }

  // Real crypto payment via x402 on Base
  switch (paymentType) {
    case "read":    return await payToRead(reportId, amountEth);
    case "tip":     return await tipReporter(reportId, amountEth);
    case "license": return await purchaseLicense(reportId, amountEth);
    default:
      return { success: false, error: `Unknown payment type: ${paymentType}` };
  }
}

module.exports = {
  processPayment,
  payToRead,
  tipReporter,
  purchaseLicense,
  mockFiatPayment,
};
