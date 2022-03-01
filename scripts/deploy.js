/* eslint-disable node/no-path-concat */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { mkdirSync, existsSync, readFileSync, writeFileSync } = require("fs");
const { BigNumber } = require("ethers");
require("dotenv").config();
const GasEstimator = require("./gasEstimator");

async function main() {
  mkdirSync("abi", { recursive: true });
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const provider = hre.ethers.getDefaultProvider(hre.network.config.url);
  // Deploy Mock Token
  const gasEstimator = new GasEstimator("polygon");
  let mockToken;
  if (!process.env.DEPLOYED_ERC20_ADDRESS) {
    printStars();
    console.log("Deploying Mock Token");
    console.log("Procuring artifacts");
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    console.log("Sending transaction");
    mockToken = await MockToken.deploy(
      process.env.ERC20_TOKEN_NAME,
      process.env.ERC20_TOKEN_SYMBOL
    );
    console.log("Transaction sent");
    console.log("Waiting for deployment");
    await mockToken.deployed();
    console.log("Waiting for block confirmation");
    const reciept = await mockToken.deployTransaction.wait();
    console.log("Transaction confirmed\ncreating abi");
    createAbiJSON(mockToken, reciept, "Token");
  }
  // deploying Airdrop contract
  printStars();
  console.log("Deploying Airdrop contract");
  console.log("Procuring artifacts");
  const AirDrop = await hre.ethers.getContractFactory("AirDrop");
  console.log("Sending transaction");
  const airDrop = await AirDrop.deploy(
    process.env.DEPLOYED_ERC20_ADDRESS || mockToken.address,
    process.env.PAYER_ADDRESS,
    {
      gasPrice: hre.ethers.utils.parseUnits(
        Math.ceil(await gasEstimator.estimate()).toString(),
        "gwei"
      ),
    }
  );
  console.log(airDrop.deployTransaction.hash);
  console.log("Transaction sent");
  console.log("Waiting for deployment");
  await airDrop.deployed();
  console.log("Waiting for block confirmation");
  const reciept = await airDrop.deployTransaction.wait();
  console.log("Transaction confirmed\ncreating abi");
  createAbiJSON(airDrop, reciept, "AirDrop");
  const accounts = [];
  const amountsERC20 = [];
  const amountEth = [];
  if (existsSync(`${__dirname}/airdropAccounts.json`)) {
    const accountsArray = JSON.parse(
      readFileSync(`${__dirname}/airdropAccounts.json`, "utf8")
    );
    console.log(accountsArray.length + " accounts found for airdrop");
    for (let i = 0; i < accountsArray.length; i++) {
      if (accountsArray[i].amount > 0 || accounts[i].amountEth > 0) {
        accounts.push(accountsArray[i].account);
        amountsERC20.push(
          BigNumber.from(Math.round(accountsArray[i].amount * 1e8)).mul(
            BigNumber.from(10).pow(BigNumber.from(10))
          )
        );
        amountEth.push(
          BigNumber.from(
            Math.round(Number(accountsArray[i].amountEth) * 1e8)
          ).mul(BigNumber.from(10).pow(BigNumber.from(10)))
        );
      }
      if (accounts.length === 30) {
        console.log("sending trasaction for 30 accounts");
        console.log("Transaction sent");
        const reciept = await airDrop.addAirDrops(
          accounts,
          amountsERC20,
          amountEth,
          {
            gasPrice: hre.ethers.utils.parseUnits(
              Math.ceil(await gasEstimator.estimate()).toString(),
              "gwei"
            ),
          }
        );
        console.log(reciept.hash);
        console.log("Waiting for confimation");
        await reciept.wait();
        accounts.length = 0;
        amountsERC20.length = 0;
        amountEth.length = 0;
      }
    }
  }
  if (accounts.length) {
    console.log("sending trasaction for left accounts: " + accounts.length);
    console.log("Transaction sent");
    const reciept = await airDrop.addAirDrops(
      accounts,
      amountsERC20,
      amountEth,
      {
        gasPrice: hre.ethers.utils.parseUnits(
          Math.ceil(await gasEstimator.estimate()).toString(),
          "gwei"
        ),
      }
    );
    console.log("Waiting for confimation");
    await reciept.wait();
  }
  console.log("Deployed all");
}

function createAbiJSON(artifact, reciept, filename) {
  const { chainId } = hre.network.config;
  if (existsSync(`${__dirname}/../abi/${filename}.json`)) {
    const prevData = JSON.parse(
      readFileSync(`${__dirname}/../abi/${filename}.json`, "utf8")
    );
    const data = {
      abi: JSON.parse(artifact.interface.format("json")),
      networks: prevData.networks,
    };
    data.networks[chainId] = {
      address: artifact.address,
      blockNumber: reciept.blockNumber,
    };
    writeFileSync(`${__dirname}/../abi/${filename}.json`, JSON.stringify(data));
  } else {
    const data = {
      abi: JSON.parse(artifact.interface.format("json")),
      networks: {},
    };
    data.networks[chainId] = {
      address: artifact.address,
      blockNumber: reciept.blockNumber,
    };
    writeFileSync(`${__dirname}/../abi/${filename}.json`, JSON.stringify(data));
  }
}

function printStars() {
  console.log("\n*****************************************************");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
