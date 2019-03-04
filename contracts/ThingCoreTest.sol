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
/////////////下面是业务合约
/////////////

contract DataFactory is Ownable{
	using SafeMath for uint256;

	/////产生一份新数据时的提醒事件
	event NewData(address _from, string _name, string _dataType, uint _dataID, uint _dataPrice, uint _dataSize);
	/////日志信息事件
	event LogStatus(address _from,string log);
	/////产生随机数据ID的位数大小 这里设置为0~999
	uint dataIDScale = 1000;
	////数据的结构定义
	struct Data{
		string name;//////////数据名称
		string dataType;//////////数据类型"excel","text","img"等
		uint dataID;//////////数据随机唯一ID 
		uint dataPrice;///////
		uint dataSize;/////数据大小 单位为KB
	}

	Data[] public datas;

	//////_dataID <==> _owner 由数据进数组的序号为哈希值 得到数据拥有者的address
	mapping (uint => address) public dataToOwner;
	//////_owner <==> _dataCount 由owner的地址为哈希值得到他一共有几份数据 与下面的getDatasByOwner配合得到用户的数据份数 和数据进数组时的序号 由此可用datas[序号]得到数据信息
	mapping (address => uint) ownerDataCount;

	/////根据数据名称生成数据唯一ID
	function _generateRandomDataID (string _str) internal view returns(uint){
		uint rand = uint(keccak256(_str));
		return rand % dataIDScale;
	}
	
	
	////////平台自己提供数据 用于初始化
	function _offerData(string _name, string _dataType,uint _dataPrice,uint _dataSize) internal{
		require (msg.sender != address(0));
		
		
		Data memory _data;
		_data.name = _name;
		_data.dataType = _dataType;
		_data.dataID = _generateRandomDataID(_name);
		_data.dataPrice = _dataPrice;
		_data.dataSize = _dataSize;
		
		//////记录到区块链上
		uint id = datas.push(_data) - 1;
		dataToOwner[id] = msg.sender;
		ownerDataCount[msg.sender]++;

		/////数据上链后提醒事件
		NewData(msg.sender,_name,_dataType,_data.dataID,_dataPrice,_dataSize);
	}
	
}

//////////数据上传系统
contract DataUpload is DataFactory{
	
	modifier onlyOwnerOf(uint _dataID) {
        require(msg.sender == dataToOwner[_dataID]);
        _;
    }

	function dataUpload(string _name, string _dataType, uint _dataPrice,uint _dataSize) public{
		Data memory _data;
		_data.name = _name;
		_data.dataType = _dataType;
		_data.dataID = _generateRandomDataID(_name);
		_data.dataPrice = _dataPrice;
		_data.dataSize = _dataSize;
		
		//////record on  blockchain.
		uint id_1 = datas.push(_data) - 1;
		dataToOwner[id_1] = msg.sender;
		ownerDataCount[msg.sender]++;

		/////Notification
		NewData(msg.sender,_name,_dataType,_data.dataID,_dataPrice,_dataSize);
	}
}

/**
 * datahelper 合约 
 */
contract DataHelper is DataUpload{
	
	
 	function withdraw() external onlyOwner {
        owner.transfer(this.balance);
    }
	//////////////对外接口
	/////////////
	//////////// 返回给定的owner的对应的数据进入数组时的序号

	function getDatasByOwner (address _owner) external view returns(uint[]){
		uint[] memory result = new uint[](ownerDataCount[_owner]);
		uint counter = 0;
		for(uint i = 0; i < datas.length; i++){
			if(dataToOwner[i] == _owner){
				result[counter] = i;
				counter++;
			}
		}
		return result;
	}
	
	/////////external interface
	/////////返回对应数据序号的数据信息
	function getData(uint _id) public view returns(
		string name,
		string dataType,
		uint dataPrice,
		uint dataSize){
		Data storage data = datas[_id];
		name = data.name;
		dataType = data.dataType;
		dataPrice = data.dataPrice;
		dataSize = data.dataSize;
	}
}


//////////ERC721 Impl
contract DataCore is DataHelper, ERC721 {
	
	using SafeMath for uint256;

	mapping (uint => address) dataApprovals;

	// ERC721 impl
	// 返回owner的数据总份数
    function balanceOf(address _owner) public view returns (uint256 _balance) {
        return ownerDataCount[_owner];
    }

    // ERC721 impl
    function ownerOf(uint256 _tokenId) public view returns (address _owner) {
        return dataToOwner[_tokenId];
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
        dataApprovals[_tokenId] = _to;
        Approval(msg.sender, _to, _tokenId);
    }

    // ERC721 impl
    function takeOwnership(uint256 _tokenId) public {
        require(dataApprovals[_tokenId] == msg.sender);
        address owner = ownerOf(_tokenId);
        _transfer(owner, msg.sender, _tokenId);
    }

    function buyThing(uint _dataID) public payable {
        address owner = dataToOwner[_dataID];
        _transfer(owner, msg.sender, _dataID);
    }
	
}
