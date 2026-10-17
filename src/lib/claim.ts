/** The exact text a wallet signs to request a claim. Shared by the browser and the server. */
export const claimMessage = (address: string, issued: string) =>
  `OXYLOAN claim\n\nI ask to send my credited OXYLOAN to this wallet.\nWallet: ${address.toLowerCase()}\nIssued: ${issued}\n\nThis does not cost gas and does not move any funds.`;
export const CLAIM_MAX_AGE_MS = 5 * 60 * 1000;
