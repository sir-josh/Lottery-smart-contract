//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract Lottery {
    address public manager;
    address payable[] public players;
    mapping (address => bool) private playersInPool;
    address internal Winner;
    address public lastWinner;
    
    constructor() {
        manager = msg.sender;
    }
    
    function enter() public payable {
        require(msg.value > .01 ether, "Minimum amout to enter lottery is 0.01 ether");
        if (!playersInPool[msg.sender]) {
            players.push(payable(msg.sender));
            playersInPool[msg.sender] = true;
        }
    }
    
    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }
    
    function pickWinner() public restricted {
        require(players.length > 0, "No player has entered the pool yet");
        
        uint index = random() % players.length;
        Winner = players[index];
        players[index].transfer(address(this).balance);

        //Reset lottery pool parameters
        lastWinner = Winner;
        Winner = address(0);
        resetPlayersInPool();
        players = new address payable[](0);
    }

    function resetPlayersInPool () private {
        // iterate over the players array in the playersInPool mapping and delete all
        for (uint i=0; i< players.length ; i++) {
            delete playersInPool[players[i]];
        }
    }
    
    modifier restricted() {
        require(msg.sender == manager, "Restricted access. Only the manager can shuffle pool");
        _;
    }
    
    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }
}   