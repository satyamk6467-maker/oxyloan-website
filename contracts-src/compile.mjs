import solc from "solc";
import fs from "fs";
import path from "path";

const files = { "OxyloanInvest.sol": fs.readFileSync("OxyloanInvest.sol", "utf8") };
if (process.env.WITH_MOCK === "1") files["test/MockUSDT.sol"] = fs.readFileSync("test/MockUSDT.sol", "utf8");
const sources = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, { content: v }]));
const settings = { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris", outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } };
const used = {};
function findImports(p) {
  const f = path.join("node_modules", p);
  if (!fs.existsSync(f)) return { error: "not found " + p };
  const contents = fs.readFileSync(f, "utf8");
  used[p] = { content: contents };
  return { contents };
}
const out = JSON.parse(solc.compile(JSON.stringify({ language: "Solidity", sources, settings }), { import: findImports }));
let bad = false;
for (const e of out.errors ?? []) { console.log(e.formattedMessage); if (e.severity === "error") bad = true; }
if (bad) process.exit(1);
fs.mkdirSync("build", { recursive: true });
for (const [file, cs] of Object.entries(out.contracts)) for (const [name, c] of Object.entries(cs)) {
  if (file.startsWith("@")) continue;
  fs.writeFileSync(`build/${name}.json`, JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2));
  console.log("compiled", name);
}
// File for BscScan -> Verify -> "Solidity (Standard-Json-Input)"
fs.writeFileSync("build/standard-input.json", JSON.stringify({ language: "Solidity", sources: { "OxyloanInvest.sol": sources["OxyloanInvest.sol"], ...used }, settings: { optimizer: settings.optimizer, evmVersion: settings.evmVersion, outputSelection: { "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"] } } } }, null, 2));
console.log("wrote build/standard-input.json (solc " + solc.version() + ")");
