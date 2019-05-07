
App = {
    web3Provider: null,
    contracts: {},
    api: null,
    tabs: ['TradeCenter', 'UploadCenter', 'Me','UseCenter'],
    currentTab: null,
    config: {},
    currentAccount: null,
    currentAccountBalance: 0,
    userid: null,
    email: null,

    getQueryVariable: function(variable)
    {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
                var pair = vars[i].split("=");
                if(pair[0] == variable){return pair[1];}
        }
        return(false);
    },

    init: function () {
        var userid = App.getQueryVariable("userid");
        var email = App.getQueryVariable("email");
        App.userid = userid;
        App.email = email;

        console.log(userid + email);
        // 初始化配置
        //this.handleDownloadThing();
        $.getJSON('../config.json', function (thing) {
            App.config.debug = thing.debug;
            App.config.dappName = thing.dapp_name;
            App.config.rpc = thing.rpc;
            App.config.networkId = thing.network_id;
            App.config.imgUrl = thing.img_url;
            App.config.imgCount = thing.img_count;

            App.config.defaultTradeCenterThingsNum = thing.default_trade_center_things_num;
            App.config.defaultUploadCenterThingsNum = thing.default_upload_center_things_num;
            App.config.defaultUsersThingsNum = thing.default_users_things_num;

            App.config.defaultTradeCenterAccount = thing.default_accounts.trade_center;
            App.config.defaultUploadCenterAccount = thing.default_accounts.upload_center;
            App.config.defaultUsersAccount = thing.default_accounts.users;

            // init global var
            App.currentAccount = userid;
            $('#current-account').text(App.currentAccount);
            App.currentTab = App.tabs[0];
        }).then(function () {
            App.initWeb3();
        });
    },

    // 初始化Web3
    initWeb3: function () {
        App.web3Provider = new Web3.providers.HttpProvider(App.config.rpc);
        web3 = new Web3(App.web3Provider);
        return App.initContract();
    },

    // 初始化合约相关
    initContract: function () {
        $.getJSON('../build/contracts/ThingCore.json', function (thing) {
            if (App.config.debug) {
                console.log('Contract abi: ' + JSON.stringify(thing.abi));
                console.log('Contract networks: ' + JSON.stringify(thing.networks));
            }
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            App.contracts.ThingCore = TruffleContract(thing);
            // Set network id
            App.contracts.ThingCore.setNetwork(App.config.networkId);
            // Set the provider for our contract
            App.contracts.ThingCore.setProvider(App.web3Provider);
            App.api = web3.eth.contract(App.contracts.ThingCore.abi).at(App.contracts.ThingCore.address);
            // Log Event
            App.api.LogStatus().watch(function (error, result) {
                if (!error) {
                    console.log('LogStatus: ' + JSON.stringify(result.args.log));
                } else {
                    console.log('LogStatus error: ' + error.message);
                }
            });
            // ThingFactory的NewThing事件
            App.api.NewThing().watch(function (error, result) {
                if (!error) {
                    console.log('NewThing: ' + JSON.stringify(result));
                    switch (result.args._from) {
                        case App.config.defaultTradeCenterAccount:
                            App.loadThing(result.args.thingId, App.tabs[0]);
                            break;
                        case App.config.defaultUploadCenterAccount:
                            App.loadThing(result.args.thingId, App.tabs[1]);
                            break;
                        
                        default:
                            App.loadThing(result.args.thingId, App.tabs[2]);
                            break;
                    }
                } else {
                    console.log('NewThing error: ' + error.message);
                }
            });
            // ERC721 Transfer事件
            App.api.Transfer().watch(function (error, result) {
                if (!error) {
                    console.log('Transfer: ' + JSON.stringify(result));
                    App.updateBalance();
                    switch (result.args._from) {
                        case App.config.defaultTradeCenterAccount:
                            App.removeThing(result.args._tokenId, App.tabs[0]);
                            break;
                        case App.config.defaultUploadCenterAccount:
                            App.removeThing(result.args._tokenId, App.tabs[1]);
                            break;
                        
                        default:
                            App.removeThing(result.args._tokenId, App.tabs[2]);
                            break;
                    }
                    switch (result.args._to) {
                        case App.config.defaultTradeCenterAccount:
                            App.loadThing(result.args.thingId, App.tabs[0]);
                            break;
                        case App.config.defaultUploadCenterAccount:
                            App.loadThing(result.args.thingId, App.tabs[1]);
                            break;
                        
                        default:
                            App.loadThing(result.args.thingId, App.tabs[2]);
                            break;
                    }
                } else {
                    console.log('Transfer error: ' + error.message);
                }
            });
            App.initAccount();
            App.initThingFactory(App.config.defaultTradeCenterAccount, App.config.defaultTradeCenterThingsNum);
            App.initThingFactory(App.config.defaultUploadCenterAccount, App.config.defaultUploadCenterThingsNum);

            for (let i = 0; i < App.config.defaultUsersAccount.length; i++) {
                App.initThingFactory(App.config.defaultUsersAccount[i], App.config.defaultUsersThingsNum);
            }
            // Update UI
            return App.handleTradeCenter();
        });

        return App.bindEvents();
    },

    // 初始化帐号相关
    initAccount: function () {
        let menuRow = $('#menuRow');
        let li;
        for (let i = 0; i < App.config.defaultUsersAccount.length; i++) {
            if (li) {
                li = li + ` <li class="menu-template" role="presentation">
                    <a class="menu-item" role="menuitem">${App.config.defaultUsersAccount[i]}</a>
                </li>`;
            } else {
                li = ` <li class="menu-template" role="presentation">
                    <a class="menu-item" role="menuitem">${App.config.defaultUsersAccount[i]}</a>
                </li>`;
            }
        }
        menuRow.append(li);
        // 更新帐号余额
        App.updateBalance();
    },

    // 初始化帐号的产品，写入区块链
    initThingFactory: function (account, num) {
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThingsByOwner(account);
        }).then(function (result) {
            if (result.length < num) {
                var initP;
                var initContent;
                for (let i = 0; i < (num - result.length); i++) {
                    initP = App.generateRandomPrinme();
                    var oriCon = Math.random().toString(36).substr(2);
                    //console.log(oriCon);
                    initContent = oriCon;
                    //console.log(initContent);
                    App.api.createRandomThing(Math.random().toString(36).substr(2),
                        parseInt(num),initContent,
                        Math.random().toString(36).substr(2)
                        , {from: account, gas: 100000000});
                }
            }
            console.log('initThingFactory for ' + account);
        }).catch(function (err) {
            console.log('initThingFactory error, account: ' + account + ", num: " + num
                + ", error: " + err.message);
        });
    },

    // 交易大厅
    handleTradeCenter: function () {
        App.currentTab = App.tabs[0];
        $('#play-hint').text("用法：（1）点击购买数据包（2）数据入链后交易才完成（3）在“我的“中查看已购数据").show();
        $('#thingsRow').empty();
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThingsByOwner(App.config.defaultTradeCenterAccount);
        }).then(function (thingIds) {
            for (let i = 0; i < thingIds.length; i++) {
                App.loadThing(thingIds[i], App.tabs[0]);
            }
        }).catch(function (err) {
            console.log('handleTradeCenter error: ' + err.message);
        });
    },

    // shangchuan中心
    handleUploadCenter: function () {
        App.currentTab = App.tabs[1];
        $('#play-hint').text("用法：（1）点击上传中心（2）选择文件上传（3）数据入链后，可以在我的中查看").show();
        $('#thingsRow').empty();
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThingsByOwner(App.config.defaultUploadCenterAccount);
        }).then(function (thingIds) {
            for (let i = 0; i < thingIds.length; i++) {
                App.loadThing(thingIds[i], App.tabs[1]);
            }
        }).catch(function (err) {
            console.log('handleBreedCenter error: ' + err.message);
        });
    },

    // 我的
    handleMyCenter: function () {
        App.currentTab = App.tabs[2];
        $('#play-hint').hide();
        $('#thingsRow').empty();
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThingsByOwner(App.currentAccount);
        }).then(function (thingIds) {
            for (let i = 0; i < thingIds.length; i++) {
                App.loadThing(thingIds[i], App.tabs[2]);
            }
        }).catch(function (err) {
            console.log('updateUIInTradeCenter error: ' + err.message);
        });
    },

    handleUseCenter:function(){
        App.currentTab = App.tabs[3];
        $('#play-hint').hide();
        $('#thingsRow').empty();
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThingsByOwner(App.currentAccount);
        }).then(function (thingIds) {
            for (let i = 0; i < thingIds.length; i++) {
                App.loadThing(thingIds[i], App.tabs[3]);
            }
        }).catch(function (err) {
            console.log('updateUIInTradeCenter error: ' + err.message);
        });
    },

    handleChangeAccount: function () {
        console.log("handleChangeAccount");
        App.currentAccount = $(this).html();
        console.log("handleChangeAccount text: " + $(this).html());
        $('#current-account').text(App.currentAccount);
        App.updateBalance();
    },

    // 购买
    handleBuyThing: function () {
        if (parseInt($(this).attr('thing-price')) > App.currentAccountBalance) {
            alert("当前账户余额不足");
        }
        let thingId = $(this).attr('thing-id');
        let thingPrice = $(this).attr('thing-price');
        $("[thing-item-id="+thingId+"]").find('.btn-bug').text('购买中').attr('disabled', true);
        App.contracts.ThingCore.deployed().then(function (instance) {
            if (App.config.debug) {
                console.log(App.currentAccount + ' buy thing, thingId: ' + thingId + ", thingPrice: " + thingPrice);
            }
            web3.eth.sendTransaction({from: App.currentAccount, to: App.config.defaultTradeCenterAccount,
                value:web3.toWei(thingPrice,'ether')});
            return instance.buyThing(thingId, {from: App.currentAccount});
        }).then(function (result) {
            if (App.config.debug) {
                console.log('handleBuyThing result = ' + JSON.stringify(result));
            }
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    // 出售
    handleSellThing: function () {
        $(this).text('出售中').attr('disabled', true);
        let thingId = $(this).attr('thing-id');
        let thingPrice = $(this).attr('thing-price');
        App.contracts.ThingCore.deployed().then(function (instance) {
            if (App.config.debug) {
                console.log(App.currentAccount + ' sell thing, thingId: ' + thingId + ", thingPrice: " + thingPrice);
            }
            web3.eth.sendTransaction({from: App.config.defaultTradeCenterAccount, to: App.currentAccount,
                value:web3.toWei(thingPrice,'ether')});
            return instance.buyThing(thingId, {from: App.config.defaultTradeCenterAccount});
        }).then(function (result) {
            if (App.config.debug) {
                console.log('handleBuyThing result = ' + JSON.stringify(result));
            }
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    downloadTxtFile : function(downloadFileName,downloadText) {
        var element = document.createElement('a');
        element.setAttribute('href', ' data:text/plain; charset=utf-8,' +encodeURIComponent(downloadText));
        element.setAttribute('download',downloadFileName);

        element.style.display = 'none' ;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    },

    downloadCsvFile : function(downloadFileName,downloadCsv) {
        let csvContent = "";
        /*rows.forEach(function(downloadCsv){
            let row = downloadCsv.join(",");
            csvContent += row + "\r\n";
        }); 
        */
        for(var i=0;i<downloadCsv.length;i++){
            let row = downloadCsv[i].join(",");
            csvContent += row + "\r\n";
        }

        var element = document.createElement('a');
        element.setAttribute('href', ' data:text/plain; charset=utf-8,' +encodeURI(csvContent));
        element.setAttribute('download',downloadFileName);

        element.style.display = 'none' ;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    },

     isPrinme : function(n){
        if(n == 0 || n==1){
            return 0;
        }else if(n==2){
            return 1;
        }else if(n % 2 == 0){
            return 0;
        }
        for(var i=3;i<Math.sqrt(n);i=i+2){
            if(n%i == 0){
                return 0;
            }
        }
        return 1;
    },

    generateRandomPrinme : function(){
        var randomInt10;
        while(1){
            randomInt10 = Math.floor((Math.random()+Math.floor(Math.random()*9+1))*Math.pow(10,9));
            if(App.isPrinme(randomInt10)){
                break;
            }
        }
        return randomInt10;
    },

    decryptFile : function(_fileContent,_priKey){
        var keys = {};
        var tempKey = new Array();
        var modulusbits = 1024;
        var decryptContent;
        /////tempKey[0] = n
        /////tempKey[1] = lambda
        tempKey = _priKey.split(" ");
        var temp1 = new BigInteger(tempKey[0]);
        var temp2 = new BigInteger(tempKey[1])
        keys.pub = new paillier.publicKey(modulusbits,temp1);
        keys.sec = new paillier.privateKey(temp2,keys.pub);

        var fileNum = new BigInteger(_fileContent);

        decryptContent = keys.sec.decrypt(fileNum);
        var test = decryptContent.toString(10);
        return test;
    },

    

    
 
////////////////
    isNumber:function(val) {
        var regPos = /^\d+(\.\d+)?$/; //非负浮点数
        var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
        if(regPos.test(val) || regNeg.test(val)) {
            return true;
            } else {
            return false;
            }
    },

//检查编码，引用了 jschardet
    checkEncoding:function( base64Str ){
        //这种方式得到的是一种二进制串
        var str = atob( base64Str.split(";base64,")[1] );
//      console.log(str);
        //要用二进制格式
        var encoding = jschardet.detect( str );
        encoding = encoding.encoding;
//      console.log( encoding );
        if( encoding == "windows-1252"){    //有时会识别错误（如UTF8的中文二字）
            encoding = "ANSI";
        }
        return encoding;
    },

    handleDownloadKey:function(_keys){
        //$(this).text('yixiazai').attr('disabled',true);
        //var numBits = 1024;
        //var keysT = paillier.generateKeys(numBits);
        var keys = new Array();
        keys[0] = _keys.pub.n.toString();
        keys[1] = _keys.sec.lambda.toString();

        downloadName = "keys.txt";

        App.downloadTxtFile(downloadName,keys.join(" "));
    },


    handleUploadThing: function(){
        //const XLSX = require("xlsx");
        
        var P = App.generateRandomPrinme();

        var filePrice = $('.offerPrice').val();
        var fileType = $('.offerType').val();
        var fileIntro = $('.offerIntro').val();
        console.log("fileName:"+fileName+"fileSize:"+fileSize+"fileType:"+fileType);
        var readFile = document.getElementsByName("upload")[0].files[0];
        
        var fileName = readFile.name;
        var fileSize = readFile.size;
        alert(fileSize);
        var pubKey;

        var reader = new FileReader();
        var keyReader = new FileReader();
        if(fileType == "txt"){
            keyReader.onload = function(){
                pubKey = JSON.stringify(keyReader.result);
            }
            keyReader.readAsText(pubKeyFile);

            reader.onload=function(){
                var fileContent = JSON.stringify(reader.result);

                //alert(typeof(reader.result));
                //fileContent = App.encryptFile(fileContent,pubKey);
                App.api.uploadThing(fileName,filePrice,fileType,fileSize,fileContent,fileIntro
                                            ,{from: App.config.defaultTradeCenterAccount, gas: 100000000});
            }
            reader.readAsText(readFile);
        }else{
            
            var res = new Array();
            var numBits = 1024;
            var keys = paillier.generateKeys(numBits);
            App.handleDownloadKey(keys);

            reader.readAsDataURL(readFile);
            reader.onload = function(){
                var data = reader.result;
                var encoding = App.checkEncoding(data);
                Papa.parse( readFile, {
                    encoding: encoding,
                    complete: function(results) {       // UTF8 \r\n与\n混用时有可能会出问题
                    //              console.log(results);
                        res = results.data;
                        if( res[ res.length-1 ] == ""){ //去除最后的空行
                            res.pop();
                        }
                        ////////////array res for use
                        var enc = new Array();
                        for(var temp1 = 0;temp1<res[0].length;temp1++){
                            enc[temp1] = new Array();
                        }
                        for(var temp = 1;temp<res[0].length;temp++){
                            enc[0][temp] = res[0][temp];
                        }

                        for(var i=1;i<res.length;i++){
                            enc[i][0] = res[i][0];
                        }

                        for(var i=1;i<res.length;i++){
                            for(var j=1;j<res[i].length;j++){
                                enc[i][j] = (keys.pub.encrypt(nbv(res[i][j]))).toString();
                            }
                        }

                        var fileArr = new Array();
                        for(var i=0;i<res.length;i++){
                            fileArr[i] = enc[i].join("#");
                        }
                        var  fileContent =  fileArr.join("|");

                        App.api.uploadThing(fileName,filePrice,fileType,fileSize,fileContent,fileIntro
                                            ,{from: App.config.defaultTradeCenterAccount, gas: 100000000});
                        //console.log(enc);
                    }
                });
            }

        }
        
        

        
        console.log("uploadFile:"+fileName);

                
    
    },

    

    handleDownloadThing: function(){
        $(this).text('已下载').attr('disabled',true);
        let thingId = $(this).attr('thing-id');
        //let thingName = $(this).attr('thing-name');
        var keyReader = new FileReader();
        var priKey;

        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThing(parseInt(thingId));
        }).then(function (thing) {
                console.log(thing);
                //let downloadName = strConcat(thingName,".txt");
                

                let file_content = thing[4].valueOf();
                let downloadContent;
                //let downloadP = parseInt(thing[6].valueOf());
                let fileType = thing[2].valueOf();

                if(fileType == "txt"){
                    let downloadName = "result.txt";
                    downloadContent = file_content;
                    App.downloadTxtFile(downloadName,downloadContent);
                }else{
                    var len = document.getElementsByName("upload").length-2;
                    var test = document.getElementsByName("upload")[len];
                    var priKeyFile = test.files[0];

                    keyReader.onload = function(){
                        //alert(typeof(keyReader.result));
                        priKey = keyReader.result;
                        let downloadName = "result.csv";
                        var tempArr = file_content.split("|");
                        var dataArr = new Array();
                        for(var i =0;i<tempArr.length;i++){
                            dataArr[i] = new Array();
                            dataArr[i] = tempArr[i].split("#");
                        }
                        for(var i=1;i<dataArr.length;i++){
                            for(var j=1;j<dataArr[i].length;j++){
                                dataArr[i][j] = App.decryptFile(dataArr[i][j],priKey);
                            }
                        }

                        App.downloadCsvFile(downloadName,dataArr);
                    }
                    keyReader.readAsText(priKeyFile);

                    //alert(typeof(dataArr));

                }

                
        
                //let downloadContent = App.decryptFile(file_content,downloadP);
                //App.downloadFile(downloadName,downloadContent);
            }
        );
        

    },

    handleUseThing:function(thingId, callback){
        //$(this).text('已下载').attr('disabled',true);
        /*let thingId = $(this).attr('thing-id');*/
        //let thingName = $(this).attr('thing-name');



        



        var keyReader = new FileReader();
        var priKey;

        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThing(parseInt(thingId));
        }).then(function (thing) {
                console.log(thing);
                //let downloadName = strConcat(thingName,".txt");
                

                let file_content = thing[4].valueOf();
                let downloadContent;
                //let downloadP = parseInt(thing[6].valueOf());
                let fileType = thing[2].valueOf();

                
                var test = document.getElementById("upFile");
                //var test = document.getElementsByName("upFile")[len];
                var priKeyFile = test.files[0];

                keyReader.onload = function(){
                    //alert(typeof(keyReader.result));
                    priKey = keyReader.result;
                    let downloadName = "result.csv";
                    var tempArr = file_content.split("|");
                    var dataArr = new Array();
                    for(var i =0;i<tempArr.length;i++){
                        dataArr[i] = new Array();
                        dataArr[i] = tempArr[i].split("#");
                    }
                    
                    for(var i=1;i<dataArr.length;i++){
                        for(var j=1;j<dataArr[i].length;j++){
                            dataArr[i][j] = App.decryptFile(dataArr[i][j],priKey);
                        }
                    }

                    callback(dataArr)
                    // App.downloadCsvFile(downloadName,dataArr);

                }
                keyReader.readAsText(priKeyFile);

                //alert(typeof(dataArr));

                

                
        
                //let downloadContent = App.decryptFile(file_content,downloadP);
                //App.downloadFile(downloadName,downloadContent);
            }
        );
    },
   

    bindEvents: function () {
        $(document).on('click', '.menu-item', App.handleChangeAccount);
        $('#trade-center').on('click', App.handleTradeCenter);
        $('#upload-center').on('click', App.handleUploadCenter);
        $('#my-center').on('click', App.handleMyCenter);
        $('#use-center').on('click', App.handleUseCenter);

        $(document).on('click', '.btn-buy', App.handleBuyThing);
        $(document).on('click', '.btn-buyUse', App.handleBuyThing);
        $(document).on('click', '.btn-use', App.handleUseThing);
        $(document).on('click', '.btn-sell', App.handleSellThing);
        $(document).on('click', '.btn-upload', App.handleUploadThing);
        $(document).on('click', '.btn-download', App.handleDownloadThing);
        $(document).on('click', '.btn-downloadKey', App.handleDownloadKey);
    },

    updateBalance: function () {
        let balance = web3.fromWei(web3.eth.getBalance(App.currentAccount), "ether");
        App.currentAccountBalance = balance;
        $('#account-balance').text(balance + " ETH");
    },


    loadThing: function(thingId, targetTab) {
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThing(parseInt(thingId));
        }).then(function (thing) {
            if ($('#page-hint').is(':visible')) {
                //$('#pageTitle').text(App.config.dappName);
                $('#page-hint').hide();
                $('#page-tabs').show();
                $('#page-head').show();
            }
            let name = thing[0];
            let price = thing[1];
            let thingType = thing[2];
            let size = thing[3];
            if(thingType == "txt"){
                var thingImg = "text.png";
            }else{
                var thingImg = "form.jpeg"
            }

            let url = App.config.imgUrl + (thing[1] % App.config.imgCount);
            if (App.config.debug) {
                //console.log("Image res: " + url);
            }
            $.get(url, function(thing) {
                //console.log(JSON.stringify(thing));
                let thingsRow = $('#thingsRow');
                let thingTemplate = $('#thing-template');
                thingTemplate.find('.thing-template-body').addClass('thing-item');
                thingTemplate.find('.thing-template-body').attr('thing-item-id', thingId);
                thingTemplate.find('.panel-title').text("名字：" + name);

                thingTemplate.find('img').attr('src', thingImg);
                thingTemplate.find('.thing-id').text(thingId);
                thingTemplate.find('.thing-template-body').attr('onclick', '');
                thingTemplate.find('.thing-price').text(price);
                thingTemplate.find('.thing-thingType').text(thingType);
                thingTemplate.find('.thing-size').text(size);
            /*    let timestamp=new Date().getTime() / 1000;
                if (timestamp >= readyTime) {
                    thingTemplate.find('.thing-ready-time').text(0);
                } else {
                    thingTemplate.find('.thing-ready-time').text(parseInt((readyTime - timestamp) / 60));
                }
                thingTemplate.find('.thing-fight-win').text(winCount);
                thingTemplate.find('.thing-fight-loss').text(lossCount);
                let attr = App.generateAttr(thing[2]);
                thingTemplate.find('.thing-head').text(attr.headChoice);
                thingTemplate.find('.thing-eye').text(attr.eyeChoice);
                thingTemplate.find('.thing-skin').text(attr.skinChoice);
                thingTemplate.find('.thing-up').text(attr.upChoice);
                thingTemplate.find('.thing-down').text(attr.downChoice);*/

                thingTemplate.find('.btn-buy').attr('thing-id', thingId);
                thingTemplate.find('.btn-buy').attr('thing-price', price);
                thingTemplate.find('.btn-sell').attr('thing-id', thingId);
                thingTemplate.find('.btn-sell').attr('thing-price', price);
                thingTemplate.find('.btn-upload').attr('thing-id', thingId);
                thingTemplate.find('.btn-upload').attr('thing-price', price);
                thingTemplate.find('.btn-download').attr('thing-id', thingId);
                thingTemplate.find('.btn-download').attr('thing-price', price);
                ////////////zhongyao///////////////////thingTemplate.find('.btn-upload').attr('thing-price', price);

                /*thingTemplate.find('.btn-upgrade').attr('thing-id', thingId);
                thingTemplate.find('.btn-breed').attr('thing-id', thingId);
                thingTemplate.find('.btn-fight').attr('thing-id', thingId);
                thingTemplate.find('.btn-feed').attr('thing-id', thingId);*/
                if (App.currentTab !== targetTab) {
                    return;
                }
                switch (App.currentTab) {
                    case App.tabs[0]:
                        thingTemplate.find('.btn-upload').hide();
                        thingTemplate.find('.btn-buy').show();
                        thingTemplate.find('.btn-buyUse').show();
                        thingTemplate.find('.btn-use').hide();
                        thingTemplate.find('.btn-sell').hide();
                        thingTemplate.find('.btn-download').hide();
                        thingTemplate.find('.btn-downloadKey').hide();

                        thingTemplate.find('.uploadFile').hide();
                        thingTemplate.find('.offerID').hide();
                        thingTemplate.find('.offerPrice').hide();
                        thingTemplate.find('.offerSize').hide();
                        thingTemplate.find('.offerType').hide();
                        thingTemplate.find('.offerIntro').hide();
                        
                        break;
                    case App.tabs[1]:
                        thingTemplate.find('.thing-id').text("");
                        thingTemplate.find('.thing-price').text("");
                        thingTemplate.find('.thing-thingType').text("");
                        thingTemplate.find('.thing-size').text("");
                        thingTemplate.find('.thing-intro').text("");
                        thingTemplate.find('.btn-download').hide();

                        thingTemplate.find('.btn-downloadKey').hide();
                        thingTemplate.find('.btn-upload').show();
                        thingTemplate.find('.btn-buy').hide();
                        thingTemplate.find('.btn-use').hide();
                        thingTemplate.find('.btn-buyUse').hide();
                        thingTemplate.find('.btn-sell').hide();
                        

                        thingTemplate.find('.uploadFile').show();
                        thingTemplate.find('.offerID').show();
                        thingTemplate.find('.offerPrice').show();
                        thingTemplate.find('.offerSize').show();
                        thingTemplate.find('.offerType').show();
                        thingTemplate.find('.offerIntro').show();
                        
                        break;
                    case App.tabs[2]:
                        thingTemplate.find('.btn-upload').hide();
                        thingTemplate.find('.btn-buy').hide();
                        thingTemplate.find('.btn-use').hide();
                        thingTemplate.find('.btn-buyUse').hide();
                        thingTemplate.find('.btn-sell').show();
                        thingTemplate.find('.btn-download').show();
                        thingTemplate.find('.btn-downloadKey').hide();


                        thingTemplate.find('.uploadFile').show();
                        thingTemplate.find('.offerID').hide();
                        thingTemplate.find('.offerPrice').hide();
                        thingTemplate.find('.offerSize').hide();
                        thingTemplate.find('.offerType').hide();
                        thingTemplate.find('.offerIntro').hide();

                        break;
                    case App.tabs[3]:
                        thingTemplate.find('.btn-upload').hide();
                        thingTemplate.find('.btn-buy').hide();
                        thingTemplate.find('.btn-buyUse').hide();
                        thingTemplate.find('.btn-use').show();
                        thingTemplate.find('.btn-sell').hide();
                        thingTemplate.find('.btn-download').hide();
                        thingTemplate.find('.btn-downloadKey').hide();
                        thingTemplate.find('.thing-template-body').attr('onclick', 'gotoUseCenter("' + App.userid + '","' + App.email + '","' + thingId +'")');

                        thingTemplate.find('.uploadFile').hide();
                        thingTemplate.find('.offerID').hide();
                        thingTemplate.find('.offerPrice').hide();
                        thingTemplate.find('.offerSize').hide();
                        thingTemplate.find('.offerType').hide();
                        thingTemplate.find('.offerIntro').hide();

                        break;
                    
                }
                thingsRow.append(thingTemplate.html());
            });
        }).catch(function (err) {
            console.log('loadThing error: ' + err.message);
        });
    },
    
    removeThing: function (thingId, targetTab) {
        if (App.currentTab !== targetTab) {
            return;
        }
        $("[thing-item-id="+thingId+"]").remove();
    }

};


        $(function () {
            $(window).load(function () {
                //var cal = new Calculator();
                App.init();
            });
        });


/*
    // 战斗中心
    handleFightCenter: function () {
        App.currentTab = App.tabs[2];
        $('#play-hint').text("玩法：（1）在希望与之战斗的宠物下输入我的宠物ID（2）点击打TA触发战斗（3）数据入链后，战斗结果在“我的“中查看").show();
        $('#thingsRow').empty();
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThingsByOwner(App.config.defaultFightCenterAccount);
        }).then(function (thingIds) {
            for (let i = 0; i < thingIds.length; i++) {
                App.loadThing(thingIds[i], App.tabs[2]);
            }
        }).catch(function (err) {
            console.log('handleFightCenter error: ' + err.message);
        });
    },

    // 喂养中心
    handleFeedCenter: function () {
        App.currentTab = App.tabs[3];
        $('#play-hint').text("玩法：（1）给你的宠物喂食以太猫（2）在希望被喂食的宠物下输入以太猫ID，介于1~60000之间，点击“”喂食”（3）数据入链后，在“我的“中查看产生的新的变异宠物").show();
        $('#thingsRow').empty();
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThingsByOwner(App.currentAccount);
        }).then(function (thingIds) {
            for (let i = 0; i < thingIds.length; i++) {
                App.loadThing(thingIds[i], App.tabs[3]);
            }
        }).catch(function (err) {
            console.log('handleFeedCenter error: ' + err.message);
        });
    },

    // 升级中心
    handleUpgradeCenter: function () {
        App.currentTab = App.tabs[4];
        $('#play-hint').text("玩法：升级宠物需花费 1ETH").show();
        $('#thingsRow').empty();
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThingsByOwner(App.currentAccount);
        }).then(function (thingIds) {
            for (let i = 0; i < thingIds.length; i++) {
                App.loadThing(thingIds[i], App.tabs[4]);
            }
        }).catch(function (err) {
            console.log('handleUpgradeCenter error: ' + err.message);
        });
    },
*/


/*
    // 繁育
    handleBreed: function () {
        let targetThingId = $(this).attr('thing-id');
        let myId = $("[thing-item-id="+targetThingId+"]").find('.my-id').val();
        if (myId === "") {
            alert("请输入你的宠物ID");
            return;
        }
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThing(parseInt(myId));
        }).then(function (thing) {
            let readyTime = thing[4];
            let timestamp = new Date().getTime() / 1000;
            if (timestamp >= readyTime) {
                $("[thing-item-id="+targetThingId+"]").find('.btn-breed').text('交配中').attr('disabled', true);
                App.contracts.ThingCore.deployed().then(function (instance) {
                    if (App.config.debug) {
                        console.log(App.currentAccount + ' bread thing, targetThingId: ' + targetThingId + ", myId: " + myId);
                    }
                    return instance.breed(parseInt(myId), parseInt(targetThingId), {from: App.currentAccount,gas: 1000000000});
                }).then(function (result) {
                    if (App.config.debug) {
                        console.log('handleBreed result = ' + JSON.stringify(result));
                    }
                    $("[thing-item-id="+targetThingId+"]").find('.btn-breed').text('选TA').attr('disabled', false);
                    alert("繁育完成，请在“我的”中查看结果。")
                }).catch(function (err) {
                    console.log(err.message);
                });
            } else {
                alert("宠物还在冷却中，请换个")
            }
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    // 战斗
    handleFight: function () {
        let targetThingId = $(this).attr('thing-id');
        let myId = $("[thing-item-id="+targetThingId+"]").find('.my-id').val();
        if (myId === "") {
            alert("请输入你的宠物ID");
            return;
        }
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThing(parseInt(myId));
        }).then(function (thing) {
            let readyTime = thing[4];
            let timestamp = new Date().getTime() / 1000;
            if (timestamp >= readyTime) {
                $("[thing-item-id="+targetThingId+"]").find('.btn-fight').text('战斗中').attr('disabled', true);
                App.contracts.ThingCore.deployed().then(function (instance) {
                    if (App.config.debug) {
                        console.log(App.currentAccount + ' fight thing, targetThingId: ' + targetThingId + ", myId: " + myId);
                    }
                    return instance.attack(parseInt(myId), parseInt(targetThingId), {from: App.currentAccount,gas: 1000000000});
                }).then(function (result) {
                    if (App.config.debug) {
                        console.log('handleBreed result = ' + JSON.stringify(result));
                    }
                    $("[thing-item-id="+targetThingId+"]").find('.btn-fight').text('打TA').attr('disabled', false);
                    alert("战斗完成，请在“我的”中查看战斗结果。")
                }).catch(function (err) {
                    console.log(err.message);
                });
            } else {
                alert("宠物还在冷却中，请换个")
            }
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    // 喂养
    handleFeed: function () {
        let targetThingId = $(this).attr('thing-id');
        let kittyId = $("[thing-item-id="+targetThingId+"]").find('.kitty-id').val();
        if (kittyId === "") {
            alert("请输入食物（Kitty）的ID");
            return;
        }
        App.contracts.ThingCore.deployed().then(function (instance) {
            return instance.getThing(parseInt(targetThingId));
        }).then(function (thing) {
            let readyTime = thing[4];
            let timestamp = new Date().getTime() / 1000;
            if (timestamp >= readyTime) {
                $("[thing-item-id="+targetThingId+"]").find('.btn-feed').text('喂食中').attr('disabled', true);
                App.contracts.ThingCore.deployed().then(function (instance) {
                    if (App.config.debug) {
                        console.log(App.currentAccount + ' feed thing, targetThingId: ' + targetThingId + ", kittyId: " + kittyId);
                    }
                    return instance.feedOnKitty(parseInt(targetThingId), parseInt(kittyId), {from: App.currentAccount,gas: 1000000000});
                }).then(function (result) {
                    if (App.config.debug) {
                        console.log('handleBreed result = ' + JSON.stringify(result));
                    }
                    $("[thing-item-id="+targetThingId+"]").find('.btn-feed').text('喂TA').attr('disabled', false);
                    alert("喂食完成，请在“我的”中查看获得的变异宠物。")
                }).catch(function (err) {
                    console.log(err.message);
                });
            } else {
                alert("宠物还在冷却中，请换个")
            }
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    // 升级
    handleUpgradeThing: function () {
        if (App.currentAccountBalance < 1) {
            alert("当前账户余额不足，升级至少需要1ETH");
        }
        $(this).text('升级中').attr('disabled', true);
        let thingId = $(this).attr('thing-id');
        App.contracts.ThingCore.deployed().then(function (instance) {
            if (App.config.debug) {
                console.log(App.currentAccount + ' upgrade thing, thingId: ' + thingId);
            }
            return instance.levelUp(thingId, {from: App.currentAccount,
                value: web3.toWei(App.config.levelUpFee, 'ether')});
        }).then(function (result) {
            if (App.config.debug) {
                console.log('handleUpgradeThing result = ' + JSON.stringify(result));
            }
            App.contracts.ThingCore.deployed().then(function (instance) {
                    return instance.getThing(parseInt(thingId));


                }).then(function (thing) {
                $("[thing-item-id="+thingId+"]").find('.thing-level').text(thing[3]);
                $("[thing-item-id="+thingId+"]").find('.btn-upgrade').text('升级').attr('disabled', false);
                alert("升级完成，请在“我的”中查看结果。")

            });
        }).catch(function (err) {
            console.log(err.message);
        });
    },
*/

/*    generateAttr: function (dna) {

        let dnaStr = String(dna);
        // 如果dna少于16位,在它前面用0补上
        while (dnaStr.length < 16) {
            dnaStr = "0" + dnaStr;
        }
        return {
            // 前两位数构成头部.我们可能有7种头部, 所以 % 7
            // 得到的数在0-6,再加上1,数的范围变成1-7
            // 通过这样计算：
            headChoice: dnaStr.substring(0, 2) % 7 + 1,
            // 我们得到的图片名称从head1.png 到 head7.png

            // 接下来的两位数构成眼睛, 眼睛变化就对11取模:
            eyeChoice: dnaStr.substring(2, 4) % 11 + 1,
            // 再接下来的两位数构成衣服，衣服变化就对6取模:
            skinChoice: dnaStr.substring(4, 6) % 6 + 1,

            upChoice: dnaStr.substring(6, 8),
            downChoice: dnaStr.substring(8, 10),
        }

    },

*/