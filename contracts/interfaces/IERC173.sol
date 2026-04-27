// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

/// @title ERC-173 Contract Ownership Standard
///  Note: the ERC-165 identifier for this interface is 0x7f5828d0
/* is ERC165 */
interface IERC173 {

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


    function owner() external view returns (address owner_);

 
    function transferOwnership(address _newOwner) external;
}
