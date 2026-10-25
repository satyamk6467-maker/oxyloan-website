import ganache from "ganache";
import { ethers } from "ethers";
import fs from "fs";
import assert from "assert";
const load = (n) => JSON.parse(fs.readFileSync(`build/${n}.json`));
const provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 8 } }));
const [owner, mgmt, swap, alice, bob, carol, eve] = await Promise.all([0,1,2,3,4,5,6].map(i => provider.getSigner(i)));
const addr = async s => s.getAddress();
const deploy = async (n, s, ...a) => { const j = load(n); const f = new ethers.ContractFactory(j.abi, j.bytecode, s); const c = await f.deploy(...a); await c.waitForDeployment(); return c; };
const E = (n) => ethers.parseEther(String(n));
const usdt = await deploy("MockUSDT", owner);
const inv = await deploy("OxyloanInvest", owner, await usdt.getAddress(), await addr(mgmt), await addr(swap), await addr(owner));
const invAddr = await inv.getAddress();
for (const u of [alice, bob, carol]) await (await usdt.mint(await addr(u), E(10000))).wait();
const bal = async s => usdt.balanceOf(typeof s === "string" ? s : await addr(s));

// 1. no referrer: 50/50
await (await usdt.connect(alice).approve(invAddr, E(100))).wait();
await (await inv.connect(alice).invest(E(100), ethers.ZeroAddress)).wait();
assert.equal(await bal(mgmt), E(50)); assert.equal(await bal(swap), E(50));
assert.equal(await bal(invAddr), 0n); // contract holds nothing
console.log("ok  no referrer: 50 mgmt / 50 swap, contract balance 0");

// 2. bob referred by alice: 40 mgmt / 10 alice / 50 swap
const aliceBefore = await bal(alice);
await (await usdt.connect(bob).approve(invAddr, E(200))).wait();
await (await inv.connect(bob).invest(E(200), await addr(alice))).wait();
assert.equal(await bal(alice) - aliceBefore, E(20));
assert.equal(await bal(mgmt), E(50) + E(80)); assert.equal(await bal(swap), E(50) + E(100));
assert.equal(await inv.referralEarned(await addr(alice)), E(20));
console.log("ok  referral: 10% to referrer, paid out of the fee");

// 3. referrer is permanent; later different referrer ignored; bonus on every deposit
await (await usdt.connect(bob).approve(invAddr, E(50))).wait();
await (await inv.connect(bob).invest(E(50), await addr(carol))).wait();
assert.equal(await inv.referrerOf(await addr(bob)), await addr(alice));
assert.equal(await inv.referralEarned(await addr(alice)), E(25));
console.log("ok  first referrer is permanent, bonus on every deposit");

// 4. self referral ignored
await (await usdt.connect(carol).approve(invAddr, E(10))).wait();
await (await inv.connect(carol).invest(E(10), await addr(carol))).wait();
assert.equal(await inv.referrerOf(await addr(carol)), ethers.ZeroAddress);
console.log("ok  self-referral ignored");

// 5. below min reverts (min 10 USDT)
await (await usdt.connect(carol).approve(invAddr, E(9))).wait();
await assert.rejects(inv.connect(carol).invest(E(9), ethers.ZeroAddress));
console.log("ok  below 10 USDT rejected");

// 6. non-owner cannot change anything; caps enforced
await assert.rejects(inv.connect(eve).setParams(1000, 100, E(10)));
await assert.rejects(inv.connect(eve).pause());
await assert.rejects(inv.connect(owner).setParams(6000, 1000, E(10)));   // fee > 50%
await assert.rejects(inv.connect(owner).setParams(5000, 2500, E(10)));   // referral > 20%
await assert.rejects(inv.connect(owner).setParams(1000, 2000, E(10)));   // referral > fee
await (await inv.connect(owner).setParams(2000, 500, E(10))).wait();
console.log("ok  owner-only + hard caps enforced");

// 7. pause
await (await inv.connect(owner).pause()).wait();
await (await usdt.connect(carol).approve(invAddr, E(20))).wait();
await assert.rejects(inv.connect(carol).invest(E(20), ethers.ZeroAddress));
await (await inv.connect(owner).unpause()).wait();
console.log("ok  pause works");

// 8. odd amounts: split sums exactly to amount
const odd = 12345678901234567891n;
await (await usdt.mint(await addr(carol), odd)).wait();
const t0 = (await bal(mgmt)) + (await bal(swap)) + (await bal(alice));
await (await usdt.connect(carol).approve(invAddr, odd)).wait();
await (await inv.connect(carol).invest(odd, await addr(alice))).wait();
const t1 = (await bal(mgmt)) + (await bal(swap)) + (await bal(alice));
assert.equal(t1 - t0, odd);
console.log("ok  odd amount splits sum exactly");

// 9. ownership is two-step
await (await inv.connect(owner).transferOwnership(await addr(eve))).wait();
assert.equal(await inv.owner(), await addr(owner));
console.log("ok  two-step ownership");
console.log("ALL CONTRACT TESTS PASSED");
