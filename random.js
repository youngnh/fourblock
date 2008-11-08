// multiplication of large numbers
// got this from the jdk
//
function nbits(n, x) {
    return (Math.pow(2, n) - 1) & x;
}

// turns an int array into a 32-bit integer
// truncating any bits higher
//
function combineIntArray(x) {
    var arr = slice(x.length - 8, x);
    var result = arr[0];
    for(var i = 1; i < arr.length; i++) {
        result = (result << 4) | arr[i];
    }
    return result >>> 1;
}

// magic numbers for random number generator
var multiplier = [5, 13, 14, 14, 12, 14, 6, 6, 13];
var addend = [11];

// x and y are arrays of 4 bit integers
// z stores the resulting product array and is returned
//
function multiplyIntArrays(x, y) {
    var xstart = x.length - 1;
    var ystart = y.length - 1;

    var z = new Array(x.length + y.length);

    var carry = 0;
    for(var j = ystart, k = ystart + 1 + xstart; j >= 0; j--, k--) {
        var product = (y[j] * x[xstart]) + carry;
        z[k] = nbits(4, product);
        carry = product >>> 4;
    }
    z[xstart] = nbits(4, carry);

    for(var i = xstart - 1; i >= 0; i--) {
        carry = 0;
        for(var j = ystart, k = ystart + 1 + i; j >= 0; j--, k--) {
            var product = (y[j] * x[i]) + z[k] + carry;
            z[k] = nbits(4, product);
            carry = product >>> 4;
        }
        z[i] = nbits(4, carry);
    }
    return z;
}

function addIntArrays(x, y) {
    var xstart = x.length - 1;
    var ystart = y.length - 1;

    var z = new Array();

    var carry = 0;
    for(var j = ystart, k = xstart; j >= 0 || k >=0; j--, k--) {
        var xval = x[k] ? x[k] : 0, yval = y[j] ? y[j] : 0;
        var sum = xval + yval + carry;
        z.push(nbits(4, sum));
        carry = sum >>> 4;
    }
    z.push(carry);

    var result = z.reverse();
    var i = 0;
    while(result[i] == undefined || result[i] == 0)
        i++;
    return slice(i, result);
}

// exclusive or for an array of numbers representing a larger number
//
function xor(x, y) {
    var xstart = x.length - 1;
    var ystart = y.length - 1;
    var z = [];

    for(var i = xstart, j = ystart; (xstart > ystart && i >= 0) || (ystart > xstart && j >= 0); i--, j--) {
        z.push((x[i] ? x[i] : 0) ^ (y[j] ? y[j] : 0));
    }

    return z.reverse();
}

function setSeed(seeder) {
    var seed = typeof(seeder) == "number" ? [seeder] : seeder;
    var s = xor(seed, multiplier);
    var seed = slice(s.length - 12, s);
    var i = 0;
    while(seed[i] == undefined || seed[i] == 0)
        i++;
    return slice(i, seed);
}

function Random(seed) {
    this.seed = setSeed(seed);
}

Random.prototype.next = function() {
    var oldseed, nextseed;

    oldseed = this.seed;
    var product = multiplyIntArrays(oldseed, multiplier);
    nextseed = addIntArrays(product, addend);
    nextseed = slice(nextseed.length - 12, nextseed);

    this.seed = nextseed;

    return combineIntArray(this.seed);
};

Random.prototype.nextInt = function(n) {
    return this.next() % n;
}
