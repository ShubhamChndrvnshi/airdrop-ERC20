//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract AirDrop is Ownable, ReentrancyGuard{
    using SafeERC20 for IERC20;
    using Address for address;

    struct drop {
        uint256 eligible;
        uint256 airDroped;

    }
    mapping(address => drop) public airDrops;
    address[] public airDropAccounts;
    address public erc20;
    address public payer;

    constructor(address _erc20, address _payer) Ownable() ReentrancyGuard() {
        erc20 = _erc20;
        payer = _payer;
    }

    function addAirDrops(address[] memory _candidates, uint256[] memory _amount) external onlyOwner {
        require(_candidates.length == _amount.length,"Array length mismatch");
        for(uint256 i; i < _candidates.length; i++){
            if(airDrops[_candidates[i]].eligible > 0 || airDrops[_candidates[i]].airDroped > 0){
                airDrops[_candidates[i]].eligible += _amount[i];
            } else {
                airDrops[_candidates[i]] = drop(_amount[i],0);
                airDropAccounts.push(_candidates[i]);
            }
        }
    }

    function airdropAccountsLength() external view returns(uint length){
        return airDropAccounts.length;
    }

    function airDropTokens(address account) public onlyOwner nonReentrant {
        _airDropToAccount(account);
    }

    function batchAirDropTokens(address[] memory accounts) public onlyOwner nonReentrant {
        for(uint i; i < accounts.length; i++){
            _airDropToAccount(accounts[i]);
        }
    }

    function airDropToAllEligible() public onlyOwner nonReentrant {
        for(uint i; i < airDropAccounts.length; i++){
            _airDropToAccount(airDropAccounts[i]);
        }
    }

    function airdropsLeft(uint256 n) public view returns( address  [] memory){
        address[] memory accLeft = new address[](n);
        uint256 j;
        for(uint256 i; i < airDropAccounts.length; i++){
            if(airDrops[airDropAccounts[i]].eligible > 0){
                accLeft[j] = airDropAccounts[i];
                j++;
            }
        }
        return accLeft;
    }

    function _airDropToAccount(address _account) internal {
        uint256 tokensToSend = airDrops[_account].eligible;
        IERC20(erc20).transferFrom( payer, _account, tokensToSend);
        airDrops[_account].eligible -= tokensToSend;
        airDrops[_account].airDroped += tokensToSend;
    }

    function withdraw(address _token) public onlyOwner nonReentrant{
        IERC20 acceptedToken = IERC20(_token);
        acceptedToken.transfer( owner(), acceptedToken.balanceOf(address(this)));
    }

    function withdraw() public onlyOwner nonReentrant{
        Address.sendValue(payable(owner()), address(this).balance);
    }
}