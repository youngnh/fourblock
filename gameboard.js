function GameBoard(id, seed, keymap) {
    this.random = new Random(seed);
    this.board = createboard();
    this.keymap = keymap;

    this.setupOffsets(id);
    this.setupHandlers();
    this.setupPieces();

    this.level = 0;
    this.lines = 0;
    var loop = function(gb){ return function(){falloop(gb);}; }(this);
    this.endgame = setInterval(loop, 1000/level_timing[this.level]);
}

GameBoard.prototype.setupOffsets = function(id) {
    var board_div = document.getElementById(id);
    var preview_div = document.getElementById(id + "_next");
    this.board_top = board_div.offsetTop;
    this.board_left = board_div.offsetLeft;
    this.prev_top = preview_div.offsetTop;
    this.prev_left = preview_div.offsetLeft;

    this.lines_span = document.getElementById(id + "_lines");
};
GameBoard.prototype.setupHandlers = function() {
    var handler = function(gb) {
        return function(event) { gb.keyhandler(event.which); };
    }(this);
    document.addEventListener('keydown', handler, false);
};
GameBoard.prototype.keyhandler = function(keycode) {
    var fn = this.keymap[keycode];
    if(fn)
        fn(this.current_piece, this.board);
};
GameBoard.prototype.setupPieces = function() {
    this.current_piece = this.previewplace();
    this.current_piece.board = this;
    this.initialplace(this.current_piece);
    this.next_piece = this.previewplace();
};
GameBoard.prototype.drawonboard = function(piece) {
    translatePos(piece.blocks, this.board_top, this.board_left, board_height);
};
GameBoard.prototype.drawinpreview = function(piece) {
    translatePos(piece.blocks, this.prev_top, this.prev_left, prev_height);
};

//tries to put a pieces blocks in their initial positions
//will return false if not possible, true otherwise
GameBoard.prototype.initialplace = function(piece) {
    //get initial positions for piece type
    var blkpos = init_positions[piece.type];

    //check that positions are available
    if(!checkposset(blkpos, this.board))
        return false;

    function setblkpos(blk, pos) {
        blk.x = pos[0];
        blk.y = pos[1];
    }

    map(setblkpos, piece.blocks, blkpos);

    this.drawonboard(piece);

    return true;
};


//gets the next piece type,
//creates its blocks
//draws them in gb's preview box
//and returns the piece
GameBoard.prototype.previewplace = function() {
    //get next piece from random sequence
    var piece = this.nextpiece();

    //get preview positions for piece type
    var blkpos = prev_positions[piece.type];

    function blockcreate(pos) {
        var blk = createblock(piece.type);
        blk.x = pos[0];
        blk.y = pos[1];
        piece.addBlock(blk);
        document.body.appendChild(blk);
    }

    //map creation function across initial positions
    map(blockcreate, blkpos);
    piece.center = piece.blocks[0];

    this.drawinpreview(piece);

    return piece;
};
GameBoard.prototype.nextpiece = function() {
    var p = this.random.nextInt(7);
    return new Piece(p);
};
GameBoard.prototype.clearallines = function(rows) {
    //clear from the top down
    rows.sort(function(a,b){return b - a;});  //sort into reverse order
    for(var r = 0; r < rows.length; r++)
        this.clearline(rows[r]);
};
GameBoard.prototype.clearline = function(row) {
    this.lines++;
    this.updatelines(this.lines);

    //remove blocks from board
    for(var col = 0; col < board_width; col++) {
        var blk = this.board[col][row]
        this.board[col][row] = false;
        document.body.removeChild(blk);
    }

    this.dropabove(row, this.board);

    if(this.lines % 10 == 0)
        this.nextlevel();
};
GameBoard.prototype.updatelines = function(lines) {
    var text = document.createTextNode("" + lines);
    this.lines_span.replaceChild(text, this.lines_span.firstChild);
};
GameBoard.prototype.nextlevel = function() {
    this.level++;
    clearInterval(this.endgame);
    var loop = function(gb) { return function(){falloop(gb);}; }(this);
    this.endgame = setInterval(loop, 1000/level_timing[this.level]);
};
GameBoard.prototype.dropabove = function(row) {
    //collect all blocks above row
    function findblk(blk) {
        return blk ? blk.y > row : false;
    }
    var allabove = rfilter(findblk, this.board);

    //drop all by one unit
    var board = this.board;
    function boarddown(blk) {
        board[blk.x][blk.y] = false;
        blk.y -= 1;
        board[blk.x][blk.y] = blk;
    }
    map(boarddown, allabove);

    //draw the newly positioned blocks
    translatePos(allabove, this.board_top, this.board_left, board_height);
};