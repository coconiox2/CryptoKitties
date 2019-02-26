module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 7545,
            from: "0x1c964dBf3Cb12B69b12693E10585092298AAA80a",
            // gas: 4712388, // web3.eth.getBlock("pending").gasLimit
            network_id: "*"
        }
    },
    compilers: {
	solc: {
      		version: "0.4.24" // ex:  "0.4.20". (Default: Truffle's installed solc)
    	}
    }
};
