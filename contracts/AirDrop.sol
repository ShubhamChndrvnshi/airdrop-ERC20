//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract AirDrop is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address;

    struct Drop {
        uint256 eligible;
        uint256 airDroped;
        uint256 eligibleEth;
        uint256 airDropedEth;
    }
    mapping(address => Drop) public airDrops;
    address[] public airDropAccounts;
    address public erc20;
    address public payer;

    constructor(address _erc20, address _payer) Ownable() ReentrancyGuard() {
        erc20 = _erc20;
        payer = _payer;
    }

    function addAirDrops(
        address[] memory _candidates,
        uint256[] memory _amount,
        uint256[] memory _amountEth
    ) external onlyOwner {
        require(
            _candidates.length == _amount.length &&
                _candidates.length == _amountEth.length,
            "Array length mismatch"
        );
        for (uint256 i; i < _candidates.length; i++) {
            airDrops[_candidates[i]].eligible += _amount[i];
            airDrops[_candidates[i]].eligibleEth += _amountEth[i];
            if( indexOf(airDropAccounts, _candidates[i]) < 0 ){
                airDropAccounts.push(_candidates[i]);
            }
        }
    }

    function addEth() external payable {}

    function airdropAccountsLength() external view returns (uint256 length) {
        return airDropAccounts.length;
    }

    function airDropTokens(address account) public onlyOwner nonReentrant {
        _airDropToAccount(account);
    }

    function batchAirDropTokens(address[] memory accounts)
        public
        onlyOwner
        nonReentrant
    {
        for (uint256 i; i < accounts.length; i++) {
            _airDropToAccount(accounts[i]);
        }
    }

    function airDropToAllEligible() public onlyOwner nonReentrant {
        for (uint256 i; i < airDropAccounts.length; i++) {
            _airDropToAccount(airDropAccounts[i]);
        }
    }

    function airdropsLeftERC20(uint256 n)
        public
        view
        returns (address[] memory)
    {
        address[] memory accLeft = new address[](n);
        uint256 j;
        for (uint256 i; i < airDropAccounts.length && j < n; i++) {
            if (airDrops[airDropAccounts[i]].eligible > 0) {
                accLeft[j] = airDropAccounts[i];
                j++;
            }
        }
        return accLeft;
    }

    function airdropsLeftEth(uint256 n) public view returns (address[] memory) {
        address[] memory accLeft = new address[](n);
        uint256 j;
        for (uint256 i; i < airDropAccounts.length && j < n; i++) {
            if (airDrops[airDropAccounts[i]].eligibleEth > 0) {
                accLeft[j] = airDropAccounts[i];
                j++;
            }
        }
        return accLeft;
    }

    function _airDropToAccount(address _account) internal {
        uint256 tokensToSend = airDrops[_account].eligible;
        if (tokensToSend > 0) {
            airDrops[_account].eligible -= tokensToSend;
            airDrops[_account].airDroped += tokensToSend;
            IERC20(erc20).transferFrom(payer, _account, tokensToSend);
        }
        uint256 ethToSend = airDrops[_account].eligibleEth;
        require(
            ethToSend <= address(this).balance,
            "Not enough eth in contract"
        );
        if (ethToSend > 0) {
            airDrops[_account].eligibleEth -= ethToSend;
            airDrops[_account].airDropedEth += ethToSend;
            payable(_account).transfer(ethToSend);
        }
    }

    function indexOf(address[] memory arr, address searchFor)
        internal
        pure
        returns (int)
    {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == searchFor) {
                return int(i);
            }
        }
        return -1; // not found
    }

    function withdraw(address _token) public onlyOwner nonReentrant {
        IERC20 acceptedToken = IERC20(_token);
        acceptedToken.transfer(owner(), acceptedToken.balanceOf(address(this)));
    }

    function withdraw() public onlyOwner nonReentrant {
        Address.sendValue(payable(owner()), address(this).balance);
    }
}
