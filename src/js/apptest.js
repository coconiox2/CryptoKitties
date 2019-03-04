App = {
	web3Provider: null,
    contracts: {},
    api: null,
    tabs: ['TradeCenter', 'UploadCenter', 'Me'],
    currentTab: null,
    config: {},
    currentAccount: null,
    currentAccountBalance: 0,

    init: function () {
        // 初始化配置
        $.getJSON('../config.json', function (data) {
            // read from config.json
            App.config.debug = data.debug;
            App.config.dappName = data.dapp_name;
            App.config.rpc = data.rpc;
            App.config.networkId = data.network_id;
            App.config.imgUrl = data.img_url;
            App.config.imgCount = data.img_count;
            App.config.defaultTradeCenterThingsNum = data.default_trade_center_things_num;
            App.config.defaultUploadCenterThingsNum = data.default_upload_center_things_num;
            //App.config.defaultFightCenterThingsNum = data.default_fight_center_things_num;
            App.config.defaultUsersThingsNum = data.default_users_things_num;


            App.config.defaultTradeCenterAccount = data.default_accounts.trade_center;
            App.config.defaultUploadCenterAccount = data.default_accounts.upload_center;
            //App.config.defaultFightCenterAccount = data.default_accounts.fight_center;
            //App.config.defaultFeedCenterAccount = data.default_accounts.feed_center;
            //App.config.defaultUpgradeCenterAccount = data.default_accounts.upgrade_center;
            App.config.defaultUsersAccount = data.default_accounts.users;
            App.config.levelUpFee = data.level_up_fee;

            // init global var
            App.currentAccount = data.default_accounts.users[0];
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

    
}