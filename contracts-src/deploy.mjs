// Deploys OxyloanInvestV2 (auto-swap on PancakeSwap + 10%/day lock) to BNB Smart Chain from your own computer (VS Code terminal). No Remix needed.
//   1) copy .env.example to .env and fill it in   2) npm install   3) npm run compile   4) npm run deploy
import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";

const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955"; // the ONLY investment token: USDT on BNB Smart Chain
const MANAGEMENT = "0xCBbAcCbFaf4b1B8a968Bb205AC59C5175189874d";
const OXYLOAN = "0x899dCFfAF285D087D700744DD6Bd9EBfb29BF299";
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 router

const need = (k) => { const v = process.env[k]; if (!v) { console.error(`Missing ${k} in .env`); process.exit(1); } return v; };
const rpc = process.env.BSC_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const provider = new ethers.JsonRpcProvider(rpc);
const net = await provider.getNetwork();
const testMode = process.env.ALLOW_TESTNET === "1";
if (net.chainId !== 56n && !testMode) { console.error(`Connected to chain ${net.chainId}, not BNB Smart Chain (56). Stopping.`); process.exit(1); }

const usdt = testMode && process.env.USDT_ADDRESS ? process.env.USDT_ADDRESS : USDT_BEP20;
const owner = ethers.getAddress(need("OWNER_ADDRESS"));
const wallet = new ethers.Wallet(need("DEPLOYER_PRIVATE_KEY"), provider);

// sanity checks before spending gas
if (!testMode) {
  const t = new ethers.Contract(usdt, ["function symbol() view returns (string)", "function decimals() view returns (uint8)"], provider);
  const [sym, dec] = await Promise.all([t.symbol(), t.decimals()]);
  if (sym !== "USDT" || Number(dec) !== 18) { console.error(`USDT address check failed (${sym}, ${dec} decimals). Stopping.`); process.exit(1); }
}
const bal = await provider.getBalance(wallet.address);
console.log(`Deployer ${wallet.address}  balance ${ethers.formatEther(bal)} BNB`);
const needed = ethers.parseEther(testMode ? "0.0001" : "0.004");
if (process.env.CONFIRM === "yes" && bal < needed) {
  console.error(`\nNot enough BNB for gas. Send at least ${ethers.formatEther(needed)} BNB (about 0.01 BNB is comfortable) to ${wallet.address} on BNB Smart Chain, then run again.`);
  process.exit(1);
}
console.log(`USDT (only accepted token) : ${usdt}\nManagement wallet          : ${MANAGEMENT}\nOXYLOAN token              : ${OXYLOAN}\nPancakeSwap router         : ${PANCAKE_ROUTER}\nOwner (controls contract)  : ${owner}`);
if (owner.toLowerCase() === wallet.address.toLowerCase()) console.log("NOTE: owner is the same as the deployer key. A hardware wallet or Safe is safer as owner.");
if (process.env.CONFIRM !== "yes") { console.log("\nDRY RUN: nothing sent. Run again with CONFIRM=yes (npm run deploy:live) to deploy."); process.exit(0); }

const j = JSON.parse(fs.readFileSync("build/OxyloanInvestV2.json", "utf8"));
const factory = new ethers.ContractFactory(j.abi, j.bytecode, wallet);
let c, rc;
try {
  c = await factory.deploy(usdt, OXYLOAN, PANCAKE_ROUTER, MANAGEMENT, owner);
  console.log(`\nTransaction sent: ${c.deploymentTransaction().hash}\nWaiting for confirmation...`);
  rc = await c.deploymentTransaction().wait();
} catch (e) {
  console.error("\nDeployment failed:", e.shortMessage || e.message?.slice(0, 300));
  process.exit(1);
}
if (rc.status !== 1) { console.error("Deployment transaction reverted:", rc.hash); process.exit(1); }
const address = await c.getAddress();
console.log(`\nDEPLOYED\n  contract address : ${address}\n  block number     : ${rc.blockNumber}\n  tx               : ${rc.hash}`);
fs.writeFileSync("deployment.json", JSON.stringify({ address, block: rc.blockNumber, tx: rc.hash, usdt, oxyloan: OXYLOAN, router: PANCAKE_ROUTER, management: MANAGEMENT, owner, constructorArgs: ethers.AbiCoder.defaultAbiCoder().encode(["address", "address", "address", "address", "address"], [usdt, OXYLOAN, PANCAKE_ROUTER, MANAGEMENT, owner]).slice(2) }, null, 2));
console.log("Saved deployment.json (includes the constructor arguments needed for BscScan verification).");
console.log(`\nNEXT STEPS\n  1. Verify on BscScan with build/standard-input.json + the constructor args above\n  2. Run supabase/003_v2_lock.sql in Supabase\n  3. Put ${address} in DEPLOYED_INVEST_CONTRACT (src/lib/config.ts) or NEXT_PUBLIC_INVEST_CONTRACT, and INVEST_CONTRACT_DEPLOY_BLOCK=${rc.blockNumber}\n  4. Pause the old contract (0x14b2...d3E1) so nobody invests there by mistake`);
