pragma solidity ^0.4.17;

contract Junkyard {

    struct Item {
        uint id;
        uint value;
        address owner;
    }

    Item[100] public junks;
    uint totalItems = 0;

    function dump(uint itemId, uint value) public returns (uint) {
        require(itemId > 0);
        require(totalItems < 100);

        address seller = msg.sender;
        Item memory _item = Item(itemId, value, seller);
        junks[totalItems] = _item;
        totalItems++;

        return totalItems;
    }

    function buy(uint itemId) public payable {
        uint i = 0;
        for (; i < totalItems; i++) {
            if (junks[i].id == itemId) {
                break;
            }
        }

        require(i != totalItems); // fail if itemId passed is not valid
        require(msg.value >= junks[i].value); //fail is transferred amount is less than item value

        junks[i].owner.transfer(msg.value);
        junks[i].owner = msg.sender;
    }

    function getItemByIndex(uint itemIndex) public constant returns (uint, uint, address) {
        require(itemIndex < totalItems && itemIndex >= 0);
        Item memory junk = junks[itemIndex];
        return (junk.id, junk.value, junk.owner);
    }

    function getTotalItems() public constant returns (uint) {
        return totalItems;
    }   
}