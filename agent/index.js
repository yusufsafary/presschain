// agent/index.js
// PressChain Agent — Entry Point
// Citizen journalism monetization via WhatsApp/Telegram + Base Network
// Synthesis Hackathon 2026 — Agents that Pay

require("dotenv").config();
const { handleMessage } = require("./handlers");

async function simulateConversation() {
  console.log("🗞️  PressChain Agent started...\n");

  const messages = [
    { from: "reporter_001", text: "Halo, saya mau kirim laporan banjir di Kampung Melayu" },
    { from: "reporter_001", text: "photo:banjir_kampung_melayu.jpg" },
    { from: "reporter_001", text: "Judul: Banjir Parah di Kampung Melayu, 200 Rumah Terendam" },
    { from: "reporter_001", text: "4" },
    { from: "reporter_001", text: "Rupiah" },
  ];

  for (const msg of messages) {
    console.log(`👤 Reporter: ${msg.text}`);
    const response = await handleMessage(msg.from, msg.text);
    console.log(`🤖 PressChain: ${response}\n`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

simulateConversation().catch(console.error);
