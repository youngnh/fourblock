function slice(from, seq) {
    var arr = new Array();
    for(var i = from; i < seq.length; i++) {
        arr.push(seq[i]);
    }
    return arr;
}

function shortestof(seqs) {
    var shortest = seqs[0].length;
    for(var i = 0; i < seqs.length; i++) {
        if(seqs[i].length < shortest)
            shortest = seqs[i].length;
    }
    return shortest;
}

function collectargs(index, seqs) {
    var collected = new Array();
    for(var i = 0; i < seqs.length; i++)
        collected.push(seqs[i][index]);
    return collected;
}

function map(fn, seq) {
    var seqs = slice(1, arguments);

    var mapped = new Array();
    var args = false;

    var i = 0;
    var shortest = shortestof(seqs);
    while(shortest > i) {
        args = collectargs(i, seqs);
        mapped.push(fn.apply(null, args));

        i++;
    }

    return mapped;
}

function filter(fn, seq) {
    var filtered = new Array();

    for(var i = 0; i < seq.length; i++) {
        if(fn(seq[i])) {
            filtered.push(seq[i]);
        }
    }

    return filtered;
}

function rfilter(fn, seq) {
    var filtered = new Array();

    for(var i = 0; i < seq.length; i++) {
        if(seq[i] && seq[i].length) {  //element is a sequence
            filtered = filtered.concat(rfilter(fn, seq[i]));
        } else {
            if(fn(seq[i])) {
                filtered.push(seq[i]);
            }
        }
    }

    return filtered;
}
