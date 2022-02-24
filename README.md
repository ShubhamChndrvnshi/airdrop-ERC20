# ERC20 Airdrop contract

This project demonstrates a way to airdrop ERC20 Tokens

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
```

# Work flow

Constructor takes two arguments:
-- Token address
-- Address of payer where the ERC20 tokens are present

addAirDrops function Takes two args:
-- _candidates - This is array of candidates where Tokens are to be airdroppped
-- _amount - Array of amount of Tokens that needs be airdropped to candidates

airDropAqr function will airdrop Tokens to particular account

batchAirDropAqr function: As the name suggests, this will airdrop Tokens to array of account

airDropToAllEligible function will airdrop Tokens to all account who is eligble for airdrop.

