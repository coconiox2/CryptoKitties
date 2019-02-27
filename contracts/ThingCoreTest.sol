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

/////////////
/////////////below is thing contract
/////////////

contract DataFactory is Ownable{
	using SafeMath for uint256;

	/////Notification event after uploading a Data.
	event NewData(address _from, string _name, string _type, uint _dataID, uint _dataPrice, string _usageMode);
	/////log 
	event LogStatus(address _from,string log);

	uint dataIDScale = 100000;

	struct Data{
		string name;
		string type;
		uint dataID;
		uint dataPrice;
		string usageMode;
	}

	Data[] public datas;

	//////_dataID <==> _owner
	mapping (uint => address) public dataToOwner;
	//////_owner <==> _dataCount
	mapping (address => uint) ownerDataCount;

/*	function _generateRandomDataID (string _str) internal view returns(uint){
		uint rand = uint(keccak256(_str));
		return rand % dataIDScale;
	}
*/	

	function _offerData(string _name, string _type, uint _dataID,uint _dataPrice,string _usageMode) public{
		require (msg.sender != address(0));
		
		//////Configure a default data.
		Data memory _data;
		_data.name = _name;
		_data.type = _type;
		_data.dataID = _dataID;
		_data.dataPrice = _dataPrice;
		_data.usageMode = _usageMode;
		
		//////record on  blockchain.
		uint id = datas.push(_data) - 1;
		dataToOwner[id] = msg.sender;
		ownerDataCount[msg.sender]++;

		/////Notification
		NewData(msg.sender,_name,_type,_dataID,_dataPrice,_usageMode);
	}
	
}

/**
 * The DataHelper contract 
 */
contract DataHelper is DataFactory{
	//////////////external interface
	/////////////returns the data array of the corresponding owner.
	
 	function withdraw() external onlyOwner {
        owner.transfer(this.balance);
    }

	////////////fanhui geidingde owner de duiying de shuju IDs
	function getDatasByOwner (address _owner) external view returns(uint[]){
		uint[] memory result = new uint[](ownerDataCount[_owner]);
		uint counter = 0;
		for(uint i = 0; i < datas.length; i++){
			if(dataToOwner(i) == _owner){
				result[counter] = i;
				counter++;
			}
		}
		return result;
	}
	
	/////////external interface
	/////////fanhui duiying ID de shujuxinxi

	fuction getData(uint _dataID) public view returns(
		string name,
		string type,
		uint dataPrice,
		string _usageMode){
		Data storage data = datas[_dataID];
		name = this.name;
		type = this.type;
		dataPrice = this.dataPrice;
		usageMode = this.usageMode;
	}
}


//////////ERC721 Impl
contract DataCore is DataHelper, ERC721 {
	
	using SafeMath for uint256;

	mapping (uint => address) dataApprovals;

	// ERC721 impl
	// return dataCount
    function balanceOf(address _owner) public view returns (uint256 _balance) {
        return ownerThingCount[_owner];
    }

    // ERC721 impl
    function ownerOf(uint256 _tokenId) public view returns (address _owner) {
        return thingToOwner[_tokenId];
    }

    function _transfer(address _from, address _to, uint256 _tokenId) private {
        ownerDataCount[_to] = ownerDataCount[_to].add(1);
        ownerDataCount[_from] = ownerDataCount[_from].sub(1);
        dataToOwner[_tokenId] = _to;
        Transfer(_from, _to, _tokenId);
    }

    // ERC721 impl
    function transfer(address _to, uint256 _tokenId) public onlyOwnerOf(_tokenId) {
        _transfer(msg.sender, _to, _tokenId);
    }

    // ERC721 impl
    function approve(address _to, uint256 _tokenId) public onlyOwnerOf(_tokenId) {
        thingApprovals[_tokenId] = _to;
        Approval(msg.sender, _to, _tokenId);
    }

    // ERC721 impl
    function takeOwnership(uint256 _tokenId) public {
        require(thingApprovals[_tokenId] == msg.sender);
        address owner = ownerOf(_tokenId);
        _transfer(owner, msg.sender, _tokenId);
    }

    function buyThing(uint _thingId) public payable {
        address owner = thingToOwner[_thingId];
        _transfer(owner, msg.sender, _thingId);
    }
	
}