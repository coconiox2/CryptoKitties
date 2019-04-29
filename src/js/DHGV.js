const theta = 15;
const n =4;
const big2 = new BigInteger("2");

function RandomOdd(n){
	return big2.multiply(big2.pow(n.subtract(big2)).add(new BigInteger(n.subtract(big2),new Random()))).add(BigInteger.ONE);
}

function sum2(li){
	var empty = true;
	var res;
	for(var i=0;i<li.length();i++){
		if(empty){
			res = li[i];
			empty = false;
		}else{
			res = res.add(li[i]);
		}
	}
	if(empty){
		return (BigInteger.ZERO);
	}else{
		return res;
	}
}

class array extends list{

}

function reduceSteps(f,li){
	var i =0;
	var res = li[0];

}

function sumBinary(a,b){
	//Computes the sum of the binary vectors a and b, modulo 2^n where n is the length of the vectors a and b
	var c = new Array();
	c[0] = a[0]+b[0];
	var carry = a[0]*b[0];
	for(var i=1;i<a.length()-1;i++){
		var carry2=(a[i]+b[i])*carry + a[i]*b[i];
		c.append(a[i]+b[i]+carry);
		carry = carry2;
	}
	c.append(a[-1]+b[-1]+carry);
	return c;
}


function prodScal(x,y){
	var temp = new Array();
	for(var i=0;i<x.length();i++){
		temp[i] = x[i].multiply(y[i]);
	}
	return sum2(temp);
}

functionn randSparse(n,h){
	//////////////让长度为n的数组v中 随机选h个元素置为1，其余置为0
	var v = new Array();
	for(var i=0;i<n;i++){
		v[i] = 0;
	}
	while(sum2(v)<h){
		i = Math.floor(Math.random()*n);
		if(v[i] == 0){
			v[i] = 1;
		}
	}
	return v;
}

//部分同态DGHV方案，没有xi's
//"The PK of the DGHV somewhat homomorphic scheme, without the xi's"
class Pk{
	//生成私钥p
    function generateRandomP(n){
        var big2 = new BigInteger("2");
        var bign_1 = n.subtract(BigInteger.ONE);
        var randomIntN = big2.pow(bign_1);
        while(1){
            temp = Math.floor((Math.random()+Math.floor(Math.random()*9+1))*Math.pow(10,10));
            if((randomIntN.add(temp)).isprime() && (randomIntN.add(temp)).isOdd()){
                break;
            }
        }
        return randomIntN.add(temp);
    },

    //生成共私钥
	constructor(rho,eta,gam,modx0,args,kwargs){
		//rho为噪音的比特长度
		//eta为私钥的比特长度
		//gam为公钥整数的比特长度
		//modx0我觉得没啥用
		//生成密钥p∈[2^(eta-1),2^eta]，且p为素奇数
		//生成公钥串 x0

		this.rho = rho;
		this.eta = eta;
		this.gam = gam;
		this.modx0 = modx0;
		
		this.p = Pk.generateRandomP(this.eta);		
		this.x0 = this.p.multiply(RandomOdd(this.gam.subtract(this.eta)));
	},

	//对明文m进行加密
	//c = p*q + 2*r +m,m∈{0,1}
	function encrypt(m){
		//Q∈[0,2^(gam-eta-1)]
		//R∈[-2^rho+1,2^rho]
		//通过[0,1]上的随机数确定 R是正数或者负数
		
		var randomQ;
		var randomR;
	
		randomQ = new BigInteger(this.gam.subtract(this.eta).subtract(BigInteger.ONE),new Random());
		
		var randomRTest = new BigInteger(this.rho,new Random());
		randomR = (Math.floor(Math.random())) ? randomRTest : randomRTest.multiply(BigInteger.minusOne)；

		return this.p.multiply(randomQ).add((new BigInteger("2")).multiply(randomR)).add(new BigInteger(m))
	},


	//噪音 c mod p
	function noise(c){
		return c.mod(this.p);
	},


	//解密 (c mod p) mod 2
	function decrypt(c){
		return Pk.noise(c).mod(2);
	},


	//密文相加
	function add(c1,c2){
		return c1.add(c2);
	},

	//密文相乘
	function mul(c1,c2){
		return c1.multiply(c2);
	}
} 

class Cipertext(){
	constructor(val,pk,degree){
		this.val = val;
		this.pk = pk;
		this.degree = degree;
	},

	function encrypt(pk,m){
		return (new Cipertext(pk.encrypt(m),pk,1));
	},

	function noise(){
		return this.pk.noise(this.val);
	},

	function decrypt(){
		return this.pk.decrypt(this.val);
	},

	function add(x){
		return (new Cipertext(this.pk.add(this.val,x.val),this.pk,max(this.degree,x.degree)));
	},

	function mul(x){
		return (new Cipertext(this.pk.add(this.val,x.val),this.pk,this.degree+x.degree));
	},

	function scalmult(x){
		if(typeof(x) == "object"){
			//x为数组
			var temp = new Array();
			for(var i=0;i<x.length;i++){
				temp[i] = new Cipertext(x[i].multiply(this.val),this.pk,this.degree);
			}
			return temp;
		}else{
			//x为大数
			return (new Cipertext(this.val.multiply(x),this.pk,this.degree));
		}
	},

	function expand(){
		return this.pk.expand(this.val);
	}
}


//A list of pseudo-random integers.
class PRIntegers {
	//gam公钥整数的比特长度
	//ell
	constructor(gam,ell){
		//num
		this.gam = gam;
		this.ell = ell;
		//生成随机数se
		var seed = new Math.seedrandom();
		this.se = seed();
		//数组li的长度为ell
		this.li = new Array();
	},

	function getItem(i){
		return this.li[i];
	},

	function setItem(i,val){
		this.li[i] = val;
	},

	function iter(){
		var seed = new Math.seedrandom(this.se);
		for(var i=0;i<this.ell;i++){
			a = new BigInteger(this.gam,new Random());
			if(this.li[i] != undefined){
				yield this.li[i];
			}else{
				yield a;
			}
		}
		Math.seedrandom();
	}
}

class PRIntegersDelta extends PRIntegers{


	function iter(){
		for(var i=0;i<this.delta.length();i++){
			return (this.delta[i]+PRIntegers.iter().next());
		}
	},

	function ciphertexts(pk){
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	},

	function encrypt(pk,v){
		var pr = PRIntegersDelta(pk.gam,v.length());
		var r = new Array();
		pr.delta = new Array();
		for(var i=0;i<v.length();i++){
			var randomTest = new BigInteger(this.rho,new Random());
			r[i] = (Math.floor(Math.random())) ? randomRTest : randomRTest.multiply(BigInteger.minusOne)；
			pr.delta[i] = 0;
		}

		temp = new Array();
		for(var i=0;i<v.length();i++){
			pr.delta[i] = temp[i].lift() + r[i] + v[i];
		}
		return pr;
	}
}

class PkRecrypt extends Pk{
	//"The Pk of the DGHV scheme, with the xi's, the yi's and the encrypted secret-key bits"
	constructor(rho,eta,gam,Theta,PkRecrypt,args,kwargs){
		this.rho = rho;
		this.eta = eta;
		this.gam = gam;
		this.modx0 = modx0;
		

		this.p = Pk.generateRandomP(this.eta);		
		this.x0 = this.p.multiply(RandomOdd(this.gam.subtract(this.eta)));

		/////////////////////////////
		
		this.kap = (new BigInteger("64")).multiply(this.gam.divide(new BigInteger("64")).add(BigInteger.ONE)).subtract(BigInteger.ONE);
		this.Theta = Theta;
		this.alpha = args.alpha;
		this.tau = args.tau;


		var xp = (new BigInteger("2")).pow(this.kap).divide(this.p);
		var B = this.Theta.divide(theta);
		var BNum = Integer.valueOf(B.toString());
		///////Theta 必须是 theta的倍数

		//////////////////////////
		///产生s
		////////////////////////////
		this.s = new Array();
		this.s.push(1);
		for(var i =0;i<BNum-1;i++){
			this.s.push(0);
		}
		var temps = 0;
		for(var i=0;i<theta-1;i++){
			temps = temps + randSparse(BNum,1);
		}
		this.s.push(temps);
		//////////////////////////
		///产生yis
		////////////////////////////

		this.y = PRIntegers(this.kap,this.p);
		this.y[0] = 0;
		var big2 = new BigInteger("2");
		this.y[0] = xp.subtract(new BigInteger(prodScal(this.s,this.y))).mod(big2.pow(this.kap.add(BigInteger.ONE))).lift();
		//assert mod(prodScal(self.s,self.y),2^(self.kap+1))==mod(xp,2^(self.kap+1)),"Equality not valid"

		//////////////////////////
		///产生xi s
		////////////////////////////
		var tempx = new Array();
		for(var i =0;i<this.tau;i++){
			tempx[i] = 0;
		}
		this.x = PRIntegersDelta.encrypt(tempx);

		//////////////////////////
		///产生seis
		////////////////////////////
		//******************165
		this.se =PRIntegersDelta.encrypt(this.s);

		//////////////////////////
		///至此钥匙生成完毕
		/////////////
	},
	function encrypt_pk(m){

		var rhop = this.eta-this.rho;

		var f = new Array();
		for(var i =0;i<this.tau;i++){
			var tempF = new BigInteger(this.alpha,new Random());
			f[i] = new Cipertext(tempF); 
		}
		
		var cf = new Array();
		for(var i=0;i<f.length();i++){
			cf[i] = f[i].multiply(this.x[i]);
		}
		var tempRhop = new Cipertext(new BigInteger(rhop,new Random()));
		var tempM = new Cipertext(m);
		var tempC = cf.concat(tempRhop).concat(tempM); 
		var c = sum2(tempC);
		c.degree = 1;
		return c;
	},

	function expand(c){
		var m = 2^(n+1)-1;
		var ce = new Array();
		for(var i=0;i<this.y.length();i++){
			ce[i] = (((directProd(c,yi,self.kap) >> (32-(n+2)))+1) >> 1) & m;
		}
		return ce;
	},

	function recrypt(c){
		var B = BigInteger.valueOf(this.Theta.divide(theta).toString());
		var cebin;	/////////197
		var sec;	////////199
		var li = new Array();
		for(var i=0;i<sec.length;i++){
			li[i] = sec[i].scalmult(cebin[i]);
		}

		var res;/////////204
		var v = res[-1]+res[-2];
		v.val = c.val & 1;

		return v;
	},

	function testPkRecrypt(){
		var scales = new Array();
		
		for(var i=0;i<5;i++){
			scales[i] = new Object();
		}
		////////////////////toy
		scales[0].type = "toy";
		scales[0].lam = new BigInteger("42");
		scales[0].rho = new BigInteger("26");
		scales[0].eta = new BigInteger("988");
		scales[0].gam = new BigInteger("147456");
		scales[0].Theta = new BigInteger("150");
		scales[0].pksize = new BigInteger("0.076519");
		scales[0].seclevel = new BigInteger("42.0");
		scales[0].alpha = new BigInteger("936");
		scales[0].tau = new BigInteger("158");

		///////////////////////////small
		scales[0].type = "small";
		scales[0].lam = new BigInteger("52");
		scales[0].rho = new BigInteger("41");
		scales[0].eta = new BigInteger("1558");
		scales[0].gam = new BigInteger("843033");
		scales[0].Theta = new BigInteger("555");
		scales[0].pksize = new BigInteger("0.437567");
		scales[0].seclevel = new BigInteger("52.0");
		scales[0].alpha = new BigInteger("1476");
		scales[0].tau = new BigInteger("572");

		//////////////////////////medium
		scales[0].type = "medium";
		scales[0].lam = new BigInteger("62");
		scales[0].rho = new BigInteger("56");
		scales[0].eta = new BigInteger("2128");
		scales[0].gam = new BigInteger("4251866");
		scales[0].Theta = new BigInteger("2070");
		scales[0].pksize = new BigInteger("2.207241");
		scales[0].seclevel = new BigInteger("62.0");
		scales[0].alpha = new BigInteger("2016");
		scales[0].tau = new BigInteger("2110");

		///////////////////////////large
		scales[0].type = "large";
		scales[0].lam = new BigInteger("72");
		scales[0].rho = new BigInteger("71");
		scales[0].eta = new BigInteger("2698");
		scales[0].gam = new BigInteger("19575950");
		scales[0].Theta = new BigInteger("7965");
		scales[0].pksize = new BigInteger("10.303797");
		scales[0].seclevel = new BigInteger("72.0");
		scales[0].alpha = new BigInteger("2556");
		scales[0].tau = new BigInteger("7659");
		//////////////////////////////////////////////////////////////////////
		
		val selScales = 0;
		var m1 = 1;
		var m2 = 0;
		var pk = new PkRecrypt(rho,eta,gam,Theta,tau,alpha);

		var c1 = Ciphertext.encrypt(pk,m1);
		var c2 = Ciphertext.encrypt(pk,m2);


}