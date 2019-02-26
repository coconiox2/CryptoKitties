pragma solidity ^0.4.19;

contract ERC721 {

    event Transfer(address indexed _from, address indexed _to, uint256 _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 _tokenId);

    function balanceOf(address _owner) public view returns (uint256 _balance);
    function ownerOf(uint256 _tokenId) public view returns (address _owner);
    function transfer(address _to, uint256 _tokenId) public;
    function approve(address _to, uint256 _tokenId) public;
    function takeOwnership(uint256 _tokenId) public;
}


library SafeMath {

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}

contract Ownable{

	address public owner;

	event OwnershipTransferred(address indexed previousOwner,address indexed newOwner);

	function Ownable() public {
		owner = msg.sender;
	}

	modifier onlyOwner() { 
		require (msg.sender == owner); 
		_; 
	}
	function transferOwnership(address newOwner) public onlyOwner{

		require (newOwner != address(0));
		OwnershipTransferred(owner,newOwner);
		owner = newOwner;
		
	}
	
}