// Tests for OxyloanInvestV2 on a local ganache chain with mock USDT, OXYLOAN and PancakeSwap router.
// Run: npm test   (compiles with mocks, then runs this file)
import ganache from "ganache";
import { ethers } from "ethers";
import fs from "fs";
import assert from "assert/strict";

const provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 6, defaultBalance: 1000 }, chain: { chainId: 1337 } }));
const [owner, mgmt, alice, bob, carol] = await Promise.all([0, 1, 2, 3, 4].map((i) => provider.getSigner(i)));
const load = (n) => JSON.parse(fs.readFileSync(`build/${n}.json`, "utf8"));
const deploy = async (n, ...args) => { const j = load(n); const c = await new ethers.ContractFactory(j.abi, j.bytecode, owner).deploy(...args); await c.waitForDeployment(); return c; };
const E = (x) => ethers.parseEther(String(x));
const DAY = 86400;
const mine = async (secs) => { await provider.send("evm_increaseTime", [secs]); await provider.send("evm_mine", []); };
const addr = (s) => s.getAddress();
// note: claims use a fixed gasLimit because ganache's default-tag gas estimation ignores evm_increaseTime

const usdt = await deploy("MockToken", "USDT");
const oxy = await deploy("MockToken", "OXY");
const router = await deploy("MockRouter", 100n); // 1 USDT -> 100 OXYLOAN
await (await oxy.mint(await router.getAddress(), E(1_000_000_000))).wait();
const inv = await deploy("OxyloanInvestV2", await usdt.getAddress(), await oxy.getAddress(), await router.getAddress(), await addr(mgmt), await addr(owner));
const I = await inv.getAddress();
for (const s of [alice, bob, carol]) { await (await usdt.mint(await addr(s), E(10_000))).wait(); await (await usdt.connect(s).approve(I, ethers.MaxUint256)).wait(); }

let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log("  ok -", name); };
const bal = async (t, s) => t.balanceOf(typeof s === "string" ? s : await addr(s));

await test("with referrer: 50% fee, 10% referrer, 40% swapped and locked", async () => {
  const m0 = await bal(usdt, mgmt), b0 = await bal(usdt, bob);
  await (await inv.connect(alice).invest(E(100), await addr(bob), E(4000))).wait();
  assert.equal(await bal(usdt, mgmt) - m0, E(50));
  assert.equal(await bal(usdt, bob) - b0, E(10));
  assert.equal(await bal(usdt, I), 0n, "contract keeps no USDT");
  assert.equal(await bal(oxy, I), E(4000), "40 USDT swapped to 4000 OXYLOAN, held in contract");
  assert.equal(await bal(oxy, alice), 0n, "investor gets nothing up front");
  const a = await inv.accountOf(await addr(alice));
  assert.equal(a.total, E(4000)); assert.equal(a.locked, E(4000)); assert.equal(a.claimable, 0n);
});

await test("referrer is permanent even if another is passed later", async () => {
  await (await inv.connect(alice).invest(E(10), await addr(carol), 0)).wait();
  assert.equal(await inv.referrerOf(await addr(alice)), await addr(bob));
});

await test("without referrer: 50% fee, 50% swapped for the investor", async () => {
  const m0 = await bal(usdt, mgmt);
  await (await inv.connect(carol).invest(E(100), ethers.ZeroAddress, 0)).wait();
  assert.equal(await bal(usdt, mgmt) - m0, E(50));
  assert.equal((await inv.accountOf(await addr(carol))).total, E(5000));
});

await test("nothing claimable before one day", async () => {
  await assert.rejects(inv.connect(carol).claim.staticCall({ blockTag: "latest" }), /NothingToClaim|revert/);
});

await test("10% unlocks per day, claimable step by step", async () => {
  await mine(DAY);
  await (await inv.connect(carol).claim({ gasLimit: 500_000 })).wait();
  assert.equal(await bal(oxy, carol), E(500));
  await mine(3 * DAY);
  await (await inv.connect(carol).claim({ gasLimit: 500_000 })).wait();
  assert.equal(await bal(oxy, carol), E(2000), "40% after 4 days");
  const a = await inv.accountOf(await addr(carol));
  assert.equal(a.locked, E(3000)); assert.equal(a.claimable, 0n); assert.equal(a.claimed, E(2000));
});

await test("fully unlocked after 10 days and never more", async () => {
  await mine(20 * DAY);
  await (await inv.connect(carol).claim({ gasLimit: 500_000 })).wait();
  assert.equal(await bal(oxy, carol), E(5000));
  await assert.rejects(inv.connect(carol).claim.staticCall({ blockTag: "latest" }), /NothingToClaim|revert/);
});

await test("multiple investments each follow their own schedule", async () => {
  const d0 = await bal(oxy, alice);
  await (await inv.connect(alice).claim({ gasLimit: 500_000 })).wait(); // 100 + 10 USDT earlier, both fully unlocked by now
  assert.equal(await bal(oxy, alice) - d0, E(4000 + 400));
  await (await inv.connect(alice).invest(E(100), ethers.ZeroAddress, 0)).wait(); // referrer bob still applies
  await mine(DAY * 2);
  const a = await inv.accountOf(await addr(alice));
  assert.equal(a.claimable, E(800), "20% of 4000 after 2 days");
  assert.ok(a.nextUnlock > 0n);
});

await test("slippage protection: reverts if swap gives less than minOut", async () => {
  await assert.rejects(inv.connect(bob).invest(E(100), ethers.ZeroAddress, E(5001)));
});

await test("below minimum reverts", async () => {
  await assert.rejects(inv.connect(bob).invest(E(9), ethers.ZeroAddress, 0), /BelowMinimum|revert/);
});

await test("owner cannot take investors' locked OXYLOAN, only excess", async () => {
  const locked = await inv.totalLocked();
  assert.equal(await bal(oxy, I), locked);
  await assert.rejects(inv.rescueToken(await oxy.getAddress(), await addr(owner), 1n), /NotExcess|revert/);
  await (await oxy.mint(I, E(7))).wait();
  await (await inv.rescueToken(await oxy.getAddress(), await addr(owner), E(7))).wait();
  await assert.rejects(inv.rescueToken(await oxy.getAddress(), await addr(owner), 1n));
});

await test("only owner can change settings; caps enforced", async () => {
  await assert.rejects(inv.connect(alice).setParams(1000, 1000, E(10)));
  await assert.rejects(inv.setParams(6000, 1000, E(10)), /BadParams|revert/);
  await assert.rejects(inv.setParams(5000, 2500, E(10)), /BadParams|revert/);
});

await test("paused blocks investing but not claiming", async () => {
  await (await inv.pause()).wait();
  await assert.rejects(inv.connect(bob).invest(E(100), ethers.ZeroAddress, 0));
  await mine(DAY);
  await (await inv.connect(alice).claim({ gasLimit: 500_000 })).wait();
  await (await inv.unpause()).wait();
});

console.log(`\n${passed} tests passed`);
process.exit(0);
