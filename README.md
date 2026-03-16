# 📰 PressChain

> AI Agent for citizen journalists — report via WhatsApp or Telegram, get paid instantly via x402 Protocol on Base Network.

**Synthesis Hackathon 2026** | Theme: **Agents that Pay**

---

## 🌟 What is PressChain?

PressChain is an AI agent that empowers citizen journalists anywhere in the world to publish, protect, and monetize their reports — starting with Indonesia, where millions of grassroots reporters have no access to fair payment systems.

**The entire experience happens inside WhatsApp or Telegram.** A reporter sends a text or photo. PressChain stores it permanently on IPFS, timestamps it on Base blockchain as immutable proof-of-publish, and activates three monetization streams immediately — all powered by x402 Protocol.

No platform accounts. No bank transfers. No middlemen taking cuts.

---

## 🔥 The Problem

There are an estimated **1 billion smartphone users** in the Global South who witness newsworthy events every day — disasters, corruption, local elections, community stories. Most never get paid for their reporting.

Traditional media platforms take 70–90% of revenue. Payment rails exclude the unbanked. And in authoritarian contexts, reports get deleted.

**PressChain fixes all three:** fair pay, instant settlement, permanent storage.

---

## ✅ How It Works

```
Reporter sends text/photo via WhatsApp or Telegram
                    ↓
PressChain Agent processes the report
                    ↓
Stores content on IPFS via Pinata (permanent, censorship-resistant)
                    ↓
Timestamps proof-of-publish on Base blockchain
                    ↓
Publishes to public feed with 3 monetization options:
   ├── Pay-per-read  → readers pay micropayment via x402
   ├── Tip           → readers donate directly to reporter
   └── Media license → outlets buy publishing rights
                    ↓
Reporter receives payment instantly, no middleman
             ├── Crypto (ETH/USDC) → direct to wallet
             └── Fiat (Rupiah/QRIS) → via payment bridge*
```

> *Fiat bridge is simulated in current demo. Production integration via local payment gateway (e.g. Midtrans) is on the roadmap.

---

## 🏗️ Architecture

```
presschain/
├── agent/
│   ├── index.js        # Agent entry point & conversation loop
│   ├── prompts.js      # System prompts & agent personality
│   └── handlers.js     # Action handlers (publish, pay, tip)
├── contracts/
│   └── PressChain.sol  # Payment routing contract on Base
├── api/
│   ├── publish.js      # IPFS upload + blockchain timestamp
│   ├── payment.js      # x402 micropayment integration
│   └── feed.js         # Public report feed
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Agent Platform | A0x (PressChain Agent) |
| Blockchain | Base Mainnet |
| Payment Protocol | x402 |
| Storage | IPFS via Pinata |
| Smart Contract | Solidity |
| Interface | WhatsApp / Telegram Bot |
| Runtime | Node.js |

---

## 💬 Example Conversation

```
[WhatsApp]

Reporter: "Ada banjir besar di Kampung Melayu, 
           ratusan rumah terendam"

PressChain: "Terima kasih laporannya! Kirimkan 
             foto atau video sebagai bukti."

Reporter: [sends photo]

PressChain: "Sedang memproses...
             ✅ Laporan tersimpan di IPFS (permanent)
             ✅ Timestamp tercatat di Base blockchain
             ✅ Laporan live di feed publik!
             
             🔗 Link laporan: presschain.xyz/r/0x...
             📊 Pilih model monetisasi:
             1️⃣  Pay-per-read (Rp 500/pembaca)
             2️⃣  Tip (pembaca donasi bebas)
             3️⃣  Jual ke media (harga negosiasi)
             4️⃣  Kombinasi semuanya"

Reporter: "4 saja"

PressChain: "Siap! Begitu ada pembayaran masuk,
             dana langsung dikirim ke akunmu.
             Mau terima dalam crypto atau Rupiah?"
```

---

## 🔗 On-Chain Activity

Every published report creates an immutable on-chain record:
- **Proof-of-publish** timestamp
- **Payment routing** via x402
- **Reporter reputation** score (accumulated from tips & purchases)

View all PressChain transactions: 👉 [basescan.org](https://basescan.org)

---

## 🤝 Why Base + x402?

- **Base** provides low-cost, fast transactions — micropayments of $0.01 are viable
- **x402** enables agent-native payments: transparent, verifiable, no middleman
- **IPFS via Pinata** ensures reports survive censorship and platform shutdowns

---

## 📋 Roadmap

- [x] Smart contract deployment (PressChain.sol)
- [x] IPFS publish integration
- [x] Agent conversation flow
- [x] x402 payment integration (pay-per-read, tip, media license)
- [ ] Public report feed (presschain.xyz)
- [ ] Reporter reputation system on-chain
- [ ] Multi-language support
- [ ] Media outlet dashboard for bulk licensing

---

## 💬 Conversation Log

> Building journal — semua diskusi antara founder dan PressChain Agent selama hackathon.

<details>
<summary>📖 Lihat conversation log lengkap</summary>

**2026-03-10**
> **Human:** Saya ingin membantu jurnalis warga mendapatkan bayaran yang adil dari laporan mereka tanpa perantara.
>
> **PressChain:** Ide yang powerful. Ada miliaran orang yang menyaksikan peristiwa penting setiap hari tapi tidak pernah dibayar untuk laporannya. Mari bangun sistem yang benar-benar zero-friction — reporter cukup kirim pesan WhatsApp, sisanya agent yang handle: simpan ke IPFS, timestamp ke blockchain, aktifkan monetisasi via x402.

---

**2026-03-13**
> **Human:** Building dimulai. Saya pilih tiga model monetisasi: pay-per-read, tip, dan media license. Semua dihandle agent via x402.
>
> **PressChain:** Kombinasi tiga model ini adalah differentiator utama. Pay-per-read cocok untuk berita breaking, tip untuk laporan investigatif yang bernilai tinggi, dan media license membuka pasar B2B ke redaksi. x402 memungkinkan semua ini terjadi on-chain tanpa payment processor tradisional.

---

**2026-03-14**
> **Human:** IPFS upload sudah jalan. Setiap laporan dapat CID unik yang tersimpan permanen.
>
> **PressChain:** IPFS + Base timestamp adalah kombinasi anti-sensor yang kuat. Tidak ada platform yang bisa menghapus laporan ini. Tambahkan metadata lengkap: judul, lokasi, timestamp, dan reporter address agar laporan mudah diverifikasi.

---

**2026-03-16**
> **Human:** Konsep diperkuat dengan framing global — Indonesia sebagai pasar utama tapi masalahnya relevan untuk 1 miliar pengguna smartphone di Global South.
>
> **PressChain:** Framing yang tepat untuk juri Synthesis. Masalah monetisasi jurnalisme warga adalah masalah global. Indonesia adalah proof-of-concept yang sempurna karena penetrasi WhatsApp-nya sangat tinggi dan ekosistem media digitalnya sedang berkembang pesat.

</details>

---

## 👤 Team

**Yusup Sapari** (Founder) + **PressChain Agent**

- Twitter/X: [@arthousebase](https://x.com/arthousebase)
- Hackathon: [Synthesis 2026](https://synthesis.md)

---

## 📄 License

MIT — Because journalism should be free.

---

*Empowering citizen journalists, one report at a time. 📰*
*Synthesis Hackathon 2026 | github.com/yusufsafary/presschain*
