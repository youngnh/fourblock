//global variables section
//
board_height = 18;      //height in grid units of board
board_width = 10;       //width in grid units of board
prev_height = 4;        //height in grid units of preview pane
prev_width = 6;         //width in grid units of preview pane

glbl_width = 20;        //width of block
border_width = 3;       //width of border around board

level_timing = [2, 4, 6, 8, 10, 12, 14, 16, 18, 32, 64];  //number of times per second a block falls

// keymaps
arrowkeymap = {
    37: shiftleft,
    39: shiftright,
    40: fall,
    32: plummet,
    38: rotatecw
};

ijklmap = {
    74: shiftleft,  // j
    76: shiftright, // l
    75: fall,       // k
    79: plummet,    // o
    73: rotatecw    // i
};

wasdmap = {
    65: shiftleft,  // a
    68: shiftright, // d
    83: fall,       // s
    69: plummet,    // e
    87: rotatecw    // w
};

combinedmap = {
    37: shiftleft,   // <-
    74: shiftleft,   // j
    39: shiftright,  // ->
    76: shiftright,  // l
    40: fall,        // \/
    75: fall,        // k
    79: plummet,     // o
    32: plummet,     // <space>
    38: rotatecw,    // ^
    73: rotatecw,    // i
    85: rotateccw,   // u
};

SQUARE = 0;                //piece types
TEE = 1;
STRAIGHT = 2;
RZEE = 3;
LZEE = 4;
RELL = 5;
LELL = 6;
piece_colors = ["yellow", "purple", "lightblue", "green", "red", "orange", "blue"];
init_positions = [         //intial positions of blocks, with center block first
                  [[5,17], //square - 0
                   [6,17],
                   [5,16],
                   [6,16]],
                  [[5,17], //tee - 1
                   [4,17],
                   [6,17],
                   [5,16]],
                  [[5,17], //straight - 2
                   [4,17],
                   [6,17],
                   [7,17]],
                  [[5,17], //rzee - 3
                   [6,17],
                   [5,16],
                   [4,16]],
                  [[5,17], //lzee - 4
                   [4,17],
                   [5,16],
                   [6,16]],
                  [[5,17], //rell - 5
                   [4,17],
                   [6,17],
                   [4,16]],
                  [[5,17], //lell - 6
                   [4,17],
                   [6,17],
                   [6,16]]
];

prev_positions = [         //initial positions of preview pieces
                  [[1,2],  //square - 0
                   [2,2],
                   [1,1],
                   [2,1]],
                  [[2,2],  //tee - 1
                   [1,2],
                   [3,2],
                   [2,1]],
                  [[2,2],  //straight - 2
                   [1,2],
                   [3,2],
                   [4,2]],
                  [[2,2],  //rzee - 3
                   [3,2],
                   [1,1],
                   [2,1]],
                  [[2,2],  //lzee - 4
                   [1,2],
                   [2,1],
                   [3,1]],
                  [[2,2],  //rell - 5
                   [1,2],
                   [1,1],
                   [3,2]],
                  [[2,2],  //lell - 6
                   [1,2],
                   [3,2],
                   [3,1]]
];

//
//end of global variables section

//Piece class
function Piece(type) {
    this.type = type;
    this.blocks = new Array();
    this.addBlock = function(b) {
        this.blocks.push(b);
    }
}

//construct a single div element
function createblock(type) {
    var blk = document.createElement("div");
    blk.className = "block";

    blk.style.backgroundColor = piece_colors[type];

    return blk;
}

//construct a board
function createboard() {
    var board = new Array(board_width);
    for(var i = 0; i < board_width; i++) {
        board[i] = new Array(board_height);
    }

    return board;
}

function translatePos(blocks, top_offset, left_offset, grid_height) {
    for(var i = 0; i < blocks.length; i++) {
        var blk = blocks[i];
        var x = blk.x;
        var y = blk.y;
        blk.style.top = glbl_width * (grid_height - 1 - y) + top_offset;
        blk.style.left = glbl_width * x + left_offset + border_width;
    }
}

//checks a grid position for out of bounds
//or already containg a block
function blocklegal(x, y, board) {
    if(x >= board_width || x < 0 || y < 0 || board[x][y])
        return false;
    return true;
}

//checks that all of the x,y pairs in
//positions are legal positions
function checkposset(positions, board) {
    for(var i = 0; i < positions.length; i++) {
        if(!blocklegal(positions[i][0], positions[i][1], board))
            return false;
    }
    return true;
}

//if set of positions are legal,
//first four become the positions
//of piece's blocks, and true returned
//otherwise, false
function checkandset(piece, positions, board) {
    if(checkposset(positions, board)) {
        for(var i = 0; i < 4; i++) {
            piece.blocks[i].x = positions[i][0];
            piece.blocks[i].y = positions[i][1];
        }
        return true;
    }
    return false;
}

//tries to move a piece downward
//one grid unit, returns false
//if it can't, true if it can and does
function fall(piece, board) {
    function onebelow(blk) {
        return [blk.x, blk.y - 1];
    }
    var fell = checkandset(piece, map(onebelow, piece.blocks), board);

    if(fell)
        piece.board.drawonboard(piece);

    return fell;
}

//drops a piece as far down as it can
//go instantly, does not return a value
function plummet(piece, board) {
    function setpos(blk, pos) {
        blk.x = pos[0];
        //adjusts for incorrect y depth
        blk.y = pos[1] + 1;
    }

    var depth = 0;
    while(true) {
        function nbelow(blk) {
            return [blk.x, blk.y - (depth + 1)];
        }
        var posset = map(nbelow, piece.blocks);
        if(!checkposset(posset, board)) {
            map(setpos, piece.blocks, posset);
            break;
        }
        depth++;
    }
    piece.board.drawonboard(piece);
}

//transfers a movable piece onto
//its final position on the board
function settle(piece, board) {
    function mvtoboard(blk) {
        board[blk.x][blk.y] = blk;
    }

    map(mvtoboard, piece.blocks);
}

//moves a piece in the horizontal plane
function shift(dist, piece, board) {
    function hshift(blk) {
        return [blk.x + dist, blk.y];
    }

    var shifted = checkandset(piece, map(hshift, piece.blocks), board);

    if(shifted)
        piece.board.drawonboard(piece);
}

function shiftleft(piece, board) {
    shift(-1, piece, board);
}

function shiftright(piece, board) {
    shift(1, piece, board);
}

//rotates a piece 90 deg. clockwise
function rotatecw(piece, board) {
    if(piece.type == SQUARE) //no need to rotate squares
        return;

    var aroundx = piece.center.x;
    var aroundy = piece.center.y;

    //check for center next to side
    //which will prevent pieces from rotating
    //this technique does not work flawlessly for straight pieces
    if(((aroundx + 1 >= board_width) ||
        (aroundx - 1 < 0)) && (piece.type != STRAIGHT))
        aroundx = aroundx - 1 < 0 ? aroundx + 1 : aroundx - 1;

    function rotcoord(blk) {
        var relx = blk.x - aroundx;
        var rely = blk.y - aroundy;

        return [aroundx + rely, aroundy - relx];
    }

    var rotated = checkandset(piece, map(rotcoord, piece.blocks), board);

    if(rotated)
        piece.board.drawonboard(piece);
}

//rotates a piece 90 deg. counterclockwise
function rotateccw(piece, board) {
    function rotcoord(blk) {
        var relx = blk.x - piece.center.x;
        var rely = blk.y - piece.center.y;

        return [piece.center.x - rely, piece.center.y + relx];
    }

    var rotated = checkandset(piece, map(rotcoord, piece.blocks), board);

    if(rotated)
        drawonboard(piece);
}

//checks the entire board for any
//completed lines and executes the
//given handler for it
function fulline(board, clearfn) {
    var c;
    var toclear = new Array();
    for(var r = 0; r < board_height; r++) {
        for(c = 0; c < board_width; c++) {
            if(!board[c][r])
                break;
        }
        if(c >= board_width) {
            toclear.push(r);
        }
    }
    clearfn(toclear, board);
}

function falloop(gb) {
    if(!fall(gb.current_piece, gb.board)) {
        settle(gb.current_piece, gb.board);
        fulline(gb.board, function(rows, board) { gb.clearallines(rows); });
        gb.current_piece = gb.next_piece;
        gb.current_piece.board = gb;
        if(!gb.initialplace(gb.current_piece, gb.board)) { //if this fails, the player loses
            gb.gameover();
            return;
        }
        gb.next_piece = gb.previewplace();
    }
}

function startgame() {
    var seed = new Date().getTime();

    var plrname = document.getElementById("plr_name").value;
    var opponame = document.getElementById("oppo_name").value;
    var plr = new GameBoard('plr', seed, wasdmap, opponame);
    var oppo = new GameBoard('oppo', seed, arrowkeymap, plrname);
}
