// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../libraries/LibDiamond.sol";

contract GetDeployedEventsFacet {
    function getDeployedEvents() public view returns (address[] memory) {
        return LibDiamond.diamondStorage().deployedEvents;
    }
}
