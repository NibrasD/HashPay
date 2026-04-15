const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying HashPay contracts to HashKey Chain...\n");

  // Deploy HashPay
  const HashPay = await hre.ethers.getContractFactory("HashPay");
  const nullpay = await HashPay.deploy();
  await nullpay.waitForDeployment();
  const nullpayAddress = await nullpay.getAddress();
  console.log(`✅ HashPay deployed to: ${nullpayAddress}`);

  // Deploy HSPSettlement
  const HSPSettlement = await hre.ethers.getContractFactory("HSPSettlement");
  const settlement = await HSPSettlement.deploy();
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log(`✅ HSPSettlement deployed to: ${settlementAddress}`);

  console.log("\n📋 Deployment Summary:");
  console.log("━".repeat(50));
  console.log(`  HashPay:     ${nullpayAddress}`);
  console.log(`  HSPSettlement:   ${settlementAddress}`);
  console.log(`  Network:         ${hre.network.name}`);
  console.log("━".repeat(50));

  // Write addresses to a file for frontend consumption
  const fs = require("fs");
  const addresses = {
    HashPay: nullpayAddress,
    HSPSettlement: settlementAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Addresses saved to deployed-addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
