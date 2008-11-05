// multiplication of large numbers
// got this from the jdk
//
function intbits(x) {
    return (Math.pow(2, 32) - 1) & x;
}

function nbits(n, x) {
    return (Math.pow(2, n) - 1) & x;
}

// x and y are arrays of 8 bit integers
// z stores the resulting array and is returned
//
function multiplyToLen(x, xlen, y, ylen, z) {
    var xstart = xlen - 1;
    var ystart = ylen - 1;

    if(z || z.length < (xlen + ylen))
        z = new Array(xlen + ylen);

    var carry = 0;
    for(var j = ystart, k = ystart + 1 + xstart; j >= 0; j--, k--) {
        var product = (y[j] * x[xstart]) + carry;
        z[k] = nbits(8, product);
        carry = product >>> 16;
    }
    z[xstart] = nbits(8, carry);

    for(var i = xstart - 1; i >= 0; i--) {
        carry = 0;
        for(var j = ystart, k = ystart + 1 + i; j >= 0; j--, k--) {
            var product = (y[j] * x[i]) + z[k] + carry;
            z[k] = nbits(8, product);
            carry = product >>> 16;
        }
        z[i] = nbits(8, carry);
    }
    return z;
}