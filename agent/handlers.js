// agent/handlers.js
// PressChain Agent — Message & Action Handlers

const { publishReport } = require("../api/publish");
const { processPayment } = require("../api/payment");
const {
  WELCOME_MESSAGE,
  ASK_TITLE,
  ASK_MONETIZATION,
  ASK_CURRENCY,
  SUCCESS_MESSAGE,
} = require("./prompts");

// ── Session state per reporter ────────────────────────────────────────────
const sessions = {};

function getSession(reporterId) {
  if (!sessions[reporterId]) {
    sessions[reporterId] = {
      step: "welcome",
      content: null,
      title: null,
      monetization: null,
      currency: null,
    };
  }
  return sessions[reporterId];
}

// ── Main message handler ──────────────────────────────────────────────────

async function handleMessage(reporterId, text) {
  const session = getSession(reporterId);

  switch (session.step) {

    case "welcome":
      session.step = "await_content";
      return WELCOME_MESSAGE;

    case "await_content":
      session.content = text;
      session.step = "await_title";
      return ASK_TITLE;

    case "await_title":
      session.title = text;
      session.step = "await_monetization";
      return ASK_MONETIZATION;

    case "await_monetization":
      session.monetization = parseMonetization(text);
      session.step = "await_currency";
      return ASK_CURRENCY;

    case "await_currency":
      session.currency = text.toLowerCase().includes("rupiah") ? "fiat" : "crypto";
      session.step = "processing";
      return await processReport(reporterId, session);

    default:
      session.step = "welcome";
      return WELCOME_MESSAGE;
  }
}

// ── Process & publish report ──────────────────────────────────────────────

async function processReport(reporterId, session) {
  try {
    const result = await publishReport({
      reporterId,
      content: session.content,
      title: session.title,
      monetization: session.monetization,
    });

    const paymentInfo = session.currency === "fiat"
      ? "Rupiah via QRIS (simulasi aktif)"
      : "Crypto (USDC/ETH) ke wallet";

    sessions[reporterId] = null;

    const link = `https://presschain.xyz/r/${result.reportId || "demo-" + Date.now()}`;
    return SUCCESS_MESSAGE(session.title, link) +
      `\n\n💳 Pembayaran akan dikirim via: ${paymentInfo}`;

  } catch (err) {
    console.error("processReport error:", err.message);
    return "Maaf, ada kendala saat memproses laporanmu. Silakan coba lagi.";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function parseMonetization(input) {
  const n = parseInt(input);
  const map = {
    1: ["read"],
    2: ["tip"],
    3: ["license"],
    4: ["read", "tip", "license"],
  };
  return map[n] || ["read", "tip", "license"];
}

module.exports = { handleMessage };
