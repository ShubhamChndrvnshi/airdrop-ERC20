// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { mkdirSync, existsSync, readFileSync, writeFileSync } = require("fs");
require("dotenv").config();

async function main() {
  mkdirSync("abi", { recursive: true });
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  // Deploy Mock Token
  if (!process.env.DEPLOYED_ERC20_ADDRESS) {
    printStars();
    console.log("Deploying Mock Token");
    console.log("Procuring artifacts");
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    console.log("Sending transaction");
    const mockToken = await MockToken.deploy(process.env.ERC20_TOKEN_NAME, process.env.ERC20_TOKEN_SYMBOL);
    console.log("Transaction sent");
    console.log("Waiting for deployment");
    await mockToken.deployed();
    console.log("Waiting for block confirmation");
    reciept = await mockToken.deployTransaction.wait();
    console.log("Transaction confirmed\ncreating abi");
    createAbiJSON(mockToken, reciept, "Token");
  }

  // deploying address registry
  printStars();
  console.log("Deploying AddressRegistry");
  console.log("Procuring artifacts");
  const AirDrop = await hre.ethers.getContractFactory("AirDrop");
  console.log("Sending transaction");
  const airDrop = await AirDrop.deploy(process.env.DEPLOYED_ERC20_ADDRESS || mockToken.address, process.env.PAYER_ADDRESS);
  console.log("Transaction sent");
  console.log("Waiting for deployment");
  await airDrop.deployed();
  console.log("Waiting for block confirmation");
  let reciept = await airDrop.deployTransaction.wait();
  console.log("Transaction confirmed\ncreating abi");
  createAbiJSON(airDrop, reciept, "AirDrop");

  console.log("Deployed all");
}

function createAbiJSON(artifact, reciept, filename) {
  if (existsSync(`${__dirname}/../abi/${filename}.json`)) {
    const prevData = JSON.parse(readFileSync(`${__dirname}/../abi/${filename}.json`, "utf8"));
    const data = {
      abi: JSON.parse(artifact.interface.format("json")),
      networks: { ...prevData.networks }
    };
    data.networks[chainId] = { "address": artifact.address, blockNumber: reciept.blockNumber };
    writeFileSync(`${__dirname}/../abi/${filename}.json`, JSON.stringify(data));
  } else {
    const data = {
      abi: JSON.parse(artifact.interface.format("json")),
      networks: {}
    };
    data.networks[chainId] = { "address": artifact.address, blockNumber: reciept.blockNumber };
    writeFileSync(`${__dirname}/../abi/${filename}.json`, JSON.stringify(data));
  }
}

function printStars() { console.log("\n*****************************************************"); }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
