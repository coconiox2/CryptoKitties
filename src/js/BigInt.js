function bigAdd(a,b){
    var str1,str2,temp;
    var addFlag = 0;
    var max = [],min = [],res = [];
    str1 = a.split("").reverse();//分割字符串，并且反转
    str2 = b.split("").reverse();
 
    if (parseInt(a) >= parseInt(b)) {
        max = str1;
        min = str2;
    }
    else{
        max = str2;
        min = str1;
    }
    for (var i = 0; i <= max.length - 1; i++) {
        if (i <= min.length - 1) {
            temp = parseInt(max[i]) + parseInt(min[i]) + addFlag;
        }
        else{
            temp = parseInt(max[i]) + addFlag;
        }
 
        if (temp > 9) {
            res[i] = temp - 10;
            addFlag = 1;
            if (i == max.length - 1) {
                res[max.length] = 1;//如果是最后一位，要进位
            }
        }
        else{
            res.push(temp);
            addFlag = 0;
        }
    };
    return res.reverse().join("");
}

function bigSub(a,b){
    var str1,str2,temp,des,r;
    var addFlag = 0;
    var max = [],min = [],res = [];
    str1 = a.split("").reverse();//依然分割字符串，并且翻转
    str2 = b.split("").reverse();
 
    if (parseInt(a) >= parseInt(b)) {//比较大小
        max = str1;
        min = str2;
    }
    else{
        max = str2;
        min = str1;
        des = -1;//意味着结果是负数
    }
    for (var i = 0; i <= max.length - 1; i++) {
        if (i <= min.length - 1) {
            temp = parseInt(max[i]) - parseInt(min[i]) + addFlag;
        }
        else{
            temp = parseInt(max[i]) + addFlag;
        }
 
        if (temp <= 0) {
            res[i] = temp + 10;
            addFlag = -1;
            if (i == max.length - 1) {
                res[max.length - 1] = "";//如果是最后一位，退位
            }
        }
        else{
            res.push(temp);
            addFlag = 0;
        }
    };
    r = res.reverse().join("");
    if (des == -1) {//最后再来判断符号，这是负数
        return -r;
    }
    else{
        return r;
    }
}

function bigMul(a,b){
    var str1,str2,temp,n;
    var max = [],min = [],res = [];
    str1 = a.split("").reverse();
    str2 = b.split("").reverse();
     
 
    if (str1.length > str2.length) {
        max = str1;
        min = str2;
    }
    else{
        max = str2;
        min = str1;
    }
 
    for (var i = 0; i <= min.length - 1; i++) {
        for (var j = 0; j <= max.length - 1; j++) {
            res[i + j] = 0;//下面要进行递归，这里必须声明，否则是NaN
        }
    }
 
    for (var i = 0; i <= min.length - 1; i++) {
        for (var j = 0; j <= max.length - 1; j++) {
            res[i + j] += parseInt(max[j]) * parseInt(min[i]);
        }
    }
    var m = res.length;//这个声明不可以放在前面，否则为null
    for (var n = 0; n < m; n++) {
        if (res[n] >= 10) {
            if (n == m - 1) {
                res[n + 1] = 0;
            }
            res[n + 1] += Math.floor(res[n]/10);
            res[n] = res[n] % 10;  
        }
    }
    return res.reverse().join("");
}

function bigDiv(a,b){
    var max,min,temp;
    var res = [];
    var s = 0;
    if (a-b>=0) {
        max = a;
        min = b;
    }
    else{
        return "0";
    }
    if(max - min - min>= 0){
        while(max - min >= 0){
            max -= min;
            console.log(max)
            s++;
            console.log(s)
            if (max - min -min< 0) {
                temp = max;
            };
        }
    }
    else{
        s = 0;
        temp = max - min;
    }
    res[0] = s;
    res[1] = temp;
    return s.toString();
 
}　

function bigPow(a,b){
  var res = "1";
  var bNum = parseInt(b);
  for(var i=0;i<bNum;i++){
    res = bigMul(res,a);
  }
  return res;
}

function bigMod(a,b){
    var max,min,temp;
    var res = [];
    var s = 0;
    if (a - b >= 0) {
        max = a;
        min = b;
    }
    else{
        return a;
    }
    if(max - min - min >= 0){
        while(max - min >= 0){
            max -= min;
            //console.log(max)
            s++;
            //console.log(s)
            if (max - min -min< 0) {
                temp = max;
            };
        }
    }
    else{
        s = 0;
        temp = max - min;
    }
    res[0] = s;
    res[1] = temp;
    return temp.toString();
}
function bigGcd(a,b){
    if(b == 0) return a;
    return bigGcd(b,bigMod(a,b));
}
