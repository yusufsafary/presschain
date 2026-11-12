/* Presschain: public site configuration.
   Agents and this page read contract data from here only. */
window.PRESSCHAIN_CONFIG = {
  CONTRACT: "0xE77D762716A98DbCDA3ECb205C0F92fBc161A64E", // PressEditions NFT (COPY), deployed 2026-11-12
  TOKEN: "0x1B2F57A01204fa9C305C517A3e30FA3De0d5afEB", // $PRESS token, deployed 2026-11-12
  CLAIM: "0x7Bb78c6b5811eB74C7f3E2C719789dbDF8a1b866", // PressClaim ($PRESS holder claim), claims not open yet
  CLAIM_FEE_WEI: "241997895908961", // flat claim fee in BNB wei, forwarded to project wallet per claim
  AGENT_ID_REGISTRY: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F", // SPACE ID Agent ID registry
  PROJECT_WALLET: "0xCe8FAC78Ab5477fE97d9f01d2da83a66EdDf42de",
  CHAIN_ID: 56,
  MAX_PER_EDITION: 10,
  RPCS: [
    "https://bsc-rpc.publicnode.com",
    "https://bsc-dataseed.bnbchain.org",
    "https://bsc-dataseed.binance.org",
    "https://bsc-dataseed1.binance.org"
  ]
};
