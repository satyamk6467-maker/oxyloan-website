import assert from "node:assert/strict";
import { test } from "node:test";
import hre from "hardhat";

test("OxyLoan: routes 1,000 USDT 50/50 and records the investment", async () => {
  const connection = await hre.network.create();

  const { viem } = connection;

  const [owner, investor, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  const investmentAmount = 1000n * 10n ** 18n;
  const half = 500n * 10n ** 18n;

  await mockUsdt.write.mint([
    investor.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    {
      account: investor.account,
    }
  );

  const treasuryBefore = await mockUsdt.read.balanceOf([
    treasury.account.address,
  ]);

  const liquidityBefore = await mockUsdt.read.balanceOf([
    liquidity.account.address,
  ]);

  await central.write.invest([investmentAmount], {
    account: investor.account,
  });

  const treasuryAfter = await mockUsdt.read.balanceOf([
    treasury.account.address,
  ]);

  const liquidityAfter = await mockUsdt.read.balanceOf([
    liquidity.account.address,
  ]);

  assert.equal(treasuryAfter - treasuryBefore, half);
  assert.equal(liquidityAfter - liquidityBefore, half);
});

test("Investor can register a referrer", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, referrer, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor.account }
  );

  const referrerOfInvestor = await central.read.getReferrer([
    investor.account.address,
  ]);

  assert.equal(
    referrerOfInvestor.toLowerCase(),
    referrer.account.address.toLowerCase()
  );
});

test("Investor cannot refer themselves", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  await assert.rejects(
    central.write.registerReferrer(
      [investor.account.address],
      { account: investor.account }
    )
  );
});

test("Investor cannot use zero address as referrer", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  await assert.rejects(
    central.write.registerReferrer(
      ["0x0000000000000000000000000000000000000000"],
      { account: investor.account }
    )
  );
});

test("Investor cannot change their referrer", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, referrer1, referrer2, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  await central.write.registerReferrer(
    [referrer1.account.address],
    { account: investor.account }
  );

  await assert.rejects(
    central.write.registerReferrer(
      [referrer2.account.address],
      { account: investor.account }
    )
  );
});

test("One referrer can have unlimited direct referrals", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [
    owner,
    investor1,
    investor2,
    investor3,
    referrer,
    treasury,
    liquidity,
  ] = await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor1.account }
  );

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor2.account }
  );

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor3.account }
  );

  const referrer1 = await central.read.getReferrer([
    investor1.account.address,
  ]);

  const referrer2 = await central.read.getReferrer([
    investor2.account.address,
  ]);

  const referrer3 = await central.read.getReferrer([
    investor3.account.address,
  ]);

  assert.equal(
    referrer1.toLowerCase(),
    referrer.account.address.toLowerCase()
  );

  assert.equal(
    referrer2.toLowerCase(),
    referrer.account.address.toLowerCase()
  );

  assert.equal(
    referrer3.toLowerCase(),
    referrer.account.address.toLowerCase()
  );
});

test("Referral reward is 10% of qualifying investment", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, referrer, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  const investmentAmount = 1000n * 10n ** 18n;
  const expectedReferralReward = 100n * 10n ** 18n;

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor.account }
  );

  await mockUsdt.write.mint([
    investor.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    { account: investor.account }
  );

  await central.write.invest(
    [investmentAmount],
    { account: investor.account }
  );

  const referralReward = await central.read.getReferralReward([
    referrer.account.address,
  ]);

  assert.equal(referralReward, expectedReferralReward);
});

test("Investor without a referrer generates no referral reward", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, referrer, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  const investmentAmount = 1000n * 10n ** 18n;

  await mockUsdt.write.mint([
    investor.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    { account: investor.account }
  );

  await central.write.invest(
    [investmentAmount],
    { account: investor.account }
  );

  const referralReward = await central.read.getReferralReward([
    referrer.account.address,
  ]);

  assert.equal(referralReward, 0n);
});

test("Referral rewards accumulate from multiple direct referrals", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [
    owner,
    investor1,
    investor2,
    referrer,
    treasury,
    liquidity,
  ] = await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  const investmentAmount = 1000n * 10n ** 18n;
  const expectedTotalReward = 200n * 10n ** 18n;

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor1.account }
  );

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor2.account }
  );

  await mockUsdt.write.mint([
    investor1.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.mint([
    investor2.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    { account: investor1.account }
  );

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    { account: investor2.account }
  );

  await central.write.invest(
    [investmentAmount],
    { account: investor1.account }
  );

  await central.write.invest(
    [investmentAmount],
    { account: investor2.account }
  );

  const referralReward = await central.read.getReferralReward([
    referrer.account.address,
  ]);

  assert.equal(referralReward, expectedTotalReward);
});

test("Referral reward does not change the 50/50 investment routing", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, referrer, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  const investmentAmount = 1000n * 10n ** 18n;
  const half = 500n * 10n ** 18n;

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor.account }
  );

  await mockUsdt.write.mint([
    investor.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    { account: investor.account }
  );

  const treasuryBefore = await mockUsdt.read.balanceOf([
    treasury.account.address,
  ]);

  const liquidityBefore = await mockUsdt.read.balanceOf([
    liquidity.account.address,
  ]);

  await central.write.invest(
    [investmentAmount],
    { account: investor.account }
  );

  const treasuryAfter = await mockUsdt.read.balanceOf([
    treasury.account.address,
  ]);

  const liquidityAfter = await mockUsdt.read.balanceOf([
    liquidity.account.address,
  ]);

  assert.equal(treasuryAfter - treasuryBefore, half);
  assert.equal(liquidityAfter - liquidityBefore, half);
});

test("Referrer can claim accumulated referral reward", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, referrer, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  const investmentAmount = 1000n * 10n ** 18n;
  const expectedReferralReward = 100n * 10n ** 18n;

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor.account }
  );

  await mockUsdt.write.mint([
    investor.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    { account: investor.account }
  );

  await central.write.invest(
    [investmentAmount],
    { account: investor.account }
  );

  await mockUsdt.write.mint([
    treasury.account.address,
    expectedReferralReward,
  ]);

  await mockUsdt.write.approve(
    [central.address, expectedReferralReward],
    { account: treasury.account }
  );

  const referrerBefore = await mockUsdt.read.balanceOf([
    referrer.account.address,
  ]);

  await central.write.claimReferralReward({
    account: referrer.account,
  });

  const referrerAfter = await mockUsdt.read.balanceOf([
    referrer.account.address,
  ]);

  assert.equal(
    referrerAfter - referrerBefore,
    expectedReferralReward
  );

  const remainingReward = await central.read.getReferralReward([
    referrer.account.address,
  ]);

  assert.equal(remainingReward, 0n);
});

test("Referral reward claim fails when treasury has insufficient USDT", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, referrer, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  const investmentAmount = 1000n * 10n ** 18n;
  const expectedReferralReward = 100n * 10n ** 18n;

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor.account }
  );

  await mockUsdt.write.mint([
    investor.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    { account: investor.account }
  );

  await central.write.invest(
    [investmentAmount],
    { account: investor.account }
  );

  const rewardBefore = await central.read.getReferralReward([
    referrer.account.address,
  ]);

  assert.equal(rewardBefore, expectedReferralReward);

  // Leave only 50 USDT in the treasury so the 100 USDT
  // referral reward cannot be paid.
  await mockUsdt.write.transfer(
    [investor.account.address, 450n * 10n ** 18n],
    { account: treasury.account }
  );

  // Give the contract enough allowance so the failure is
  // specifically caused by insufficient treasury balance.
  await mockUsdt.write.approve(
    [central.address, expectedReferralReward],
    { account: treasury.account }
  );

  await assert.rejects(
    central.write.claimReferralReward({
      account: referrer.account,
    }),
    /Treasury has insufficient USDT/
  );

  const rewardAfter = await central.read.getReferralReward([
    referrer.account.address,
  ]);

  assert.equal(rewardAfter, expectedReferralReward);
});

test("Claiming referral reward twice without new reward does not pay twice", async () => {
  const connection = await hre.network.create();
  const { viem } = connection;

  const [owner, investor, referrer, treasury, liquidity] =
    await viem.getWalletClients();

  const mockUsdt = await viem.deployContract("MockUSDT");

  const oxyToken = await viem.deployContract("OXYToken", [
    owner.account.address,
  ]);

  const central = await viem.deployContract("OxyLoanCentral", [
    owner.account.address,
    mockUsdt.address,
    oxyToken.address,
    treasury.account.address,
    liquidity.account.address,
  ]);

  const investmentAmount = 1000n * 10n ** 18n;
  const expectedReferralReward = 100n * 10n ** 18n;

  await central.write.registerReferrer(
    [referrer.account.address],
    { account: investor.account }
  );

  await mockUsdt.write.mint([
    investor.account.address,
    investmentAmount,
  ]);

  await mockUsdt.write.approve(
    [central.address, investmentAmount],
    { account: investor.account }
  );

  await central.write.invest(
    [investmentAmount],
    { account: investor.account }
  );

  await mockUsdt.write.mint([
    treasury.account.address,
    expectedReferralReward,
  ]);

  await mockUsdt.write.approve(
    [central.address, expectedReferralReward],
    { account: treasury.account }
  );

  await central.write.claimReferralReward({
    account: referrer.account,
  });

  const referrerAfterFirstClaim = await mockUsdt.read.balanceOf([
    referrer.account.address,
  ]);

  assert.equal(
    referrerAfterFirstClaim,
    expectedReferralReward
  );

  await assert.rejects(
    central.write.claimReferralReward({
      account: referrer.account,
    }),
    /No referral reward available/
  );

  const referrerAfterSecondClaim = await mockUsdt.read.balanceOf([
    referrer.account.address,
  ]);

  assert.equal(
    referrerAfterSecondClaim,
    expectedReferralReward
  );
});

