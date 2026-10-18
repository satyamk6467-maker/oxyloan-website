import { chromium } from "/home/claude/.npm-global/lib/node_modules/playwright/index.mjs";
import fs from "fs";
const C = JSON.parse(fs.readFileSync("/tmp/claude-0/chain.json","utf8"));
const rpc = async (method, params=[]) => { const r = await fetch("http://127.0.0.1:8545",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})}); const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result; };
const bal = async (a) => { const d = "0x70a08231"+a.toLowerCase().slice(2).padStart(64,"0"); return Number(BigInt(await rpc("eth_call",[{to:C.usdt,data:d},"latest"]))/10n**16n)/100; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport:{width:1280,height:900}, bypassCSP:true });
const p = await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push("PAGEERR "+e.message)); p.on("console",m=>{ if(m.type()==="error") errs.push(m.text().slice(0,200)); });
await p.exposeFunction("__rpc", (m, pr) => rpc(m, pr));
await p.addInitScript((acc) => {
  const provider = { isMetaMask:true, request: async ({method, params}) => {
    if (method==="eth_requestAccounts"||method==="eth_accounts") return [acc];
    if (method==="eth_chainId") return "0x38"; if (method==="net_version") return "56";
    if (method==="wallet_switchEthereumChain"||method==="wallet_addEthereumChain") return null;
    if (method==="wallet_getPermissions"||method==="wallet_requestPermissions") return [{parentCapability:"eth_accounts"}];
    return window.__rpc(method, params||[]); }, on(){}, removeListener(){} };
  const info = { uuid:"11111111-1111-1111-1111-111111111111", name:"MetaMask", icon:"data:image/svg+xml;base64,PHN2Zy8+", rdns:"io.metamask" };
  const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider",{detail:Object.freeze({info,provider})}));
  window.addEventListener("eip6963:requestProvider", announce); announce(); window.ethereum = provider;
}, C.alice);
const before = { mgmt: await bal(C.mgmt), swap: await bal(C.swap), alice: await bal(C.alice) };
console.log("before", before);
await p.goto("http://localhost:3100/", { waitUntil:"networkidle" });
await p.waitForTimeout(2000);
console.log("page:", (await p.locator("body").innerText()).slice(0,160).replace(/\n/g," | "), errs.slice(0,3));
console.log("auto-connected:", await p.locator(".walletchip").count());
console.log("header:", (await p.locator(".walletchip").innerText().catch(()=>"(no chip)")).replace(/\n/g," "));
await p.fill('input[aria-label="USDT amount"]', "100");
await p.waitForTimeout(1500);
const btn = p.locator("main .btn-primary.wide").first();
console.log("cta1:", await btn.innerText(), "disabled:", await btn.isDisabled());
await p.screenshot({path:"/tmp/claude-0/shots/e2e1.png"});
p.on("response", async (r)=>{ if(r.url().includes("8545")){ try{ const rq=JSON.parse(r.request().postData()||"{}"); const rs=await r.json(); const m=Array.isArray(rq)?rq.map(x=>x.method).join(","):rq.method; console.log("  rpc", m, JSON.stringify(rs).slice(0,110)); }catch{} } });
if (!(await btn.isDisabled())) { await btn.click(); await p.waitForTimeout(9000); }
const btn2 = p.locator("main .btn-primary.wide").first();
console.log("cta2:", await btn2.innerText(), "disabled:", await btn2.isDisabled());
if (!(await btn2.isDisabled())) { await btn2.click(); await p.waitForTimeout(6000); }
console.log("message:", (await p.locator(".msg").first().innerText().catch(()=>"(none)")).replace(/\n/g," "));
await p.screenshot({path:"/tmp/claude-0/shots/e2e2.png"});
const after = { mgmt: await bal(C.mgmt), swap: await bal(C.swap), alice: await bal(C.alice), contract: await bal(C.invest) };
console.log("after", after, "deltas mgmt", after.mgmt-before.mgmt, "swap", after.swap-before.swap, "alice", after.alice-before.alice);
console.log("errors:", errs.slice(0,6));
await b.close();
