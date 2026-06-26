const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MedZoo Web3 Healthcare Platform...\n");

  console.log("📋 Deploying MedicalRecords...");
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const medicalRecords = await MedicalRecords.deploy();
  await medicalRecords.waitForDeployment();
  const mrAddress = await medicalRecords.getAddress();
  console.log(`   ✅ MedicalRecords deployed at: ${mrAddress}`);

  console.log("🏥 Deploying DoctorRegistry...");
  const DoctorRegistry = await hre.ethers.getContractFactory("DoctorRegistry");
  const doctorRegistry = await DoctorRegistry.deploy();
  await doctorRegistry.waitForDeployment();
  const drAddress = await doctorRegistry.getAddress();
  console.log(`   ✅ DoctorRegistry deployed at: ${drAddress}`);

  console.log("⭐ Deploying ReviewSystem...");
  const ReviewSystem = await hre.ethers.getContractFactory("ReviewSystem");
  const reviewSystem = await ReviewSystem.deploy();
  await reviewSystem.waitForDeployment();
  const rsAddress = await reviewSystem.getAddress();
  console.log(`   ✅ ReviewSystem deployed at: ${rsAddress}`);

  console.log("🔗 Deploying ReferralSystem...");
  const ReferralSystem = await hre.ethers.getContractFactory("ReferralSystem");
  const referralSystem = await ReferralSystem.deploy(mrAddress);
  await referralSystem.waitForDeployment();
  const rfAddress = await referralSystem.getAddress();
  console.log(`   ✅ ReferralSystem deployed at: ${rfAddress}`);

  console.log("\n🎉 All contracts deployed successfully!\n");
  console.log("Contract Addresses:");
  console.log(`  MedicalRecords:  ${mrAddress}`);
  console.log(`  DoctorRegistry:  ${drAddress}`);
  console.log(`  ReviewSystem:    ${rsAddress}`);
  console.log(`  ReferralSystem:  ${rfAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
