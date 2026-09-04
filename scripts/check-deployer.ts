import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";

const key = process.env.BSC_MAINNET_PRIVATE_KEY;

if (!key) {
  throw new Error("BSC_MAINNET_PRIVATE_KEY is not set");
}

const normalized = key.startsWith("0x") ? key : `0x${key}`;

const account = privateKeyToAccount(normalized as `0x${string}`);

console.log("DEPLOYER:", account.address);
