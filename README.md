CryptoKitties
=========================

A simple implementation of CryptoKitties with more tricks.

More Info：[Ethereum-ERC721智能合约和Dapp实践--以太猫CryptoKitties的简单实现](https://blog.csdn.net/hello2mao/article/details/81241112)

![image](/img/1.png)

Feature
-------------

 * 交易系统：用户可使用帐号在商店里对产品进行买卖交易。
 * 繁育系统：用户可以使用已有的产品与繁殖中心的产品进行繁殖，产生新的产品。
 * 对战系统：用户可以使用已有的产品与对战心中的产品进行对战，赢了将升级并产生一个新产品，输了失败次数将加一。
 * 喂养系统：用户可以对已有的产品喂养以太坊公链上的以太猫，从而产生新的带以太猫基因的杂交品种。
 * 升级系统：用户可以对已有的产品花ETH进行升级，2级以后可以改名，20级后可以定制DNA，从而用户激励升级。

Quick Start
-------------

#### 1. Run Ganache
Go https://truffleframework.com/ganache

#### 2. Edit src/config.json
Change default_accounts from Ganache.
```
{
  "debug":true,
  "dapp_name": "CryptoKitties",
  "rpc": "http://127.0.0.1:7545",
  "network_id":"5777",
  "img_url":"https://api.cryptokitties.co/kitties/",
  "img_count":"600000",
  "default_trade_center_things_num": 6,
  "default_breed_center_things_num": 4,
  "default_fight_center_things_num": 4,
  "default_users_things_num": 1,
  "default_accounts": {
    "trade_center":"0x13379Ec77e75012DdE8b0B08B1ff446F4065f52A",
    "breed_center":"0x5a9Ee3cC24262154C72CeefE719B1D2A25bC824d",
    "fight_center":"0xCC81EEd7Fd2B87c242528e6cf463a79B6d026E88",
    "feed_center":"0x74dc378B48E121d6C78594D736072da86e3Ad36c",
    "upgrade_center":"0xe2431fEd750e673C615e5E65476D874fCb13EBB7",
    "users":[
      "0xed5cF228Eb4508Acc9F1fe6626087E8ACA31d10e",
      "0x1C64f8Ea7BebdbfF58b4397d408c4928914AFD2A"
    ]
  },
  "level_up_fee":"1"
}
```

#### 3. Start APP
```shell
npm install
sh run.sh
```

License
-------------

    Copyright (C) 2018 hello2mao.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.







///////////////////////////////////////////yqDataTransfer
DataFactory合约中的_offerData函数是平台自己提供数据 供app.js中初始化界面使用的样例数据
		  dataToOwner函数是由数据进数组的序号得到数据拥有者的address
		  ownerDataCount函数是由owner的地址得到他一共有几份数据 与下面的getDatasByOwner配合得到用户的数据份数 和数据进数组时的序号 由此可用datas[序号]得到数据信息
DataHelper合约中的getDatasByOwner函数是根据owner返回该owner对应的数据ID
		 getData函数是根据数据ID得到数据的名字、类型、数据价格，数据的使用方式
DataCore合约中的balanceOf函数是根据owner的地址得到该地址拥有的数据的总份数
		 ownerOf函数是根据数据ID返回数据拥有者的地址
		 _transfer函数是平台将数据的所有权从数据所有者转移到数据需求者
		 transfer函数是任何用户都可以将自己的拥有的数据的所有权转移给数据需求者//我这里应该不需要
