// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Salary is Ownable, AccessControl{
    struct issueItem{
        uint256 year;
        uint256 month;
        uint256 day;
        uint256 money;
    }
    mapping(address=>issueItem []) public _issueHistory;
    address public _salaryToken;

    event distribute_salary(address from, address to,uint256 amount, uint256 year, uint256 month, uint256 day);

    constructor(address salaryToken_) {
        _salaryToken = salaryToken_;
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function setSalaryToken(address salaryToken_) external onlyOwner() {
        _salaryToken = salaryToken_;
    }

    function paySalary(address staff_, uint256 amount_, uint256 year_, uint256 month_, uint256 day_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_salaryToken != address(0) , "has not set salaryToken");
        IERC20(_salaryToken).transferFrom(_msgSender(), staff_, amount_);
        _issueHistory[staff_].push(issueItem(year_, month_, day_, amount_));
        emit distribute_salary(_msgSender(), staff_, amount_, year_, month_, day_);
    }

    function paySalaryBatch(address []memory staffs_, uint256 []memory amount_, uint256 year_, uint256 month_, uint256 day_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_salaryToken != address(0) , "has not set salaryToken");
        require(staffs_.length == amount_.length, "array length inconsistent");
        for (uint i = 0; i < staffs_.length; i++) {
            IERC20(_salaryToken).transferFrom(_msgSender(), staffs_[i], amount_[i]);
            _issueHistory[staffs_[i]].push(issueItem(year_, month_, day_, amount_[i]));
            emit distribute_salary(_msgSender(), staffs_[i], amount_[i], year_, month_, day_);
        }
    }
}