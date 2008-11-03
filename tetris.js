//global variables section
//
gameloop = false;       //will hold closure to call at intervals
endgame = false;        //will hold id of interval, so it can be cleared

seed = 314;             //seed number for random number generator

board_height = 18;      //height in grid units of board
board_width = 10;       //width in grid units of board
prev_height = 4;        //height in grid units of preview pane
prev_width = 6;         //width in grid units of preview pane

glbl_width = 20;        //width of block
border_width = 3;       //width of border around board
board_top = 40;         //top offset of board
board_left = 40;        //left offset of board
prev_top = 100;          //top offset of preview box
prev_left = 280;        //left offset of preview box

level = 0;              //keeps track of the player's level
lines = 0;              //number of lines a player has cleared
level_timing = [2, 4, 6, 8, 10, 12, 14, 16, 18, 32, 64];  //number of times per second a block falls

glbl_board = false;     //global board variable
current_piece = false;  //user-manipulable currently-falling piece
next_piece = false;     //the next piece

SQUARE = 0;             //piece types
TEE = 1;
STRAIGHT = 2;
RZEE = 3;
LZEE = 4;
RELL = 5;
LELL = 6;

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
function createblock() {
    var blk = document.createElement("div");
    blk.className = "block";
    blk.style.backgroundColor = "red";

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

function drawonboard(piece) {
    translatePos(piece.blocks, board_top, board_left, board_height);
}

function drawinpreview(piece) {
    translatePos(piece.blocks, prev_top, prev_left, prev_height);
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
        drawonboard(piece);

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
    drawonboard(piece);
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
        drawonboard(piece);
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
        drawonboard(piece);
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

function dropabove(row, board) {
    //collect all blocks above row
    function findblk(blk) {
        return blk ? blk.y > row : false;
    }
    var allabove = rfilter(findblk, board);

    //drop all by one unit
    function boarddown(blk) {
        board[blk.x][blk.y] = false;
        blk.y -= 1;
        board[blk.x][blk.y] = blk;
    }
    map(boarddown, allabove);

    //draw the newly positioned blocks
    translatePos(allabove, board_top, board_left, board_height);
}

function nextlevel() {
    level++;
    clearInterval(endgame);
    endgame = setInterval("gameloop()", 1000/level_timing[level]);
}

function clearallines(rows, board) {
    //clear from the top down    
    rows.sort(function(a,b){return b - a;});  //sort into reverse order
    for(var r = 0; r < rows.length; r++)
        clearline(rows[r], board);
}

function clearline(row, board) { 
    lines++;
    updatelines(lines);

    //remove blocks from board
    for(var col = 0; col < board_width; col++) {
        var blk = board[col][row]
        board[col][row] = false;
        document.body.removeChild(blk);
    }

    dropabove(row, board);

    if(lines > 1 && lines % 10 == 0)
        nextlevel();
}

//returns a random Piece object
function nextpiece() {
    var p = Math.floor(Math.random(seed) * 6.0);
    seed = Math.floor(Math.random(seed) * 1200000000);
    return new Piece(p);
}

//tries to put a pieces blocks in their initial positions
//will return false if not possible, true otherwise
function initialplace(piece, board) {
    //get initial positions for piece type
    var blkpos = init_positions[piece.type];

    //check that positions are available
    if(!checkposset(blkpos, board))
        return false;
    
    function setblkpos(blk, pos) {
        blk.x = pos[0];
        blk.y = pos[1];
    }

    map(setblkpos, piece.blocks, blkpos);

    drawonboard(piece);

    return true;
}

//gets the next piece type,
//creates its blocks
//draws them in the preview box
//and returns the piece
function previewplace() {
    //get next piece from random sequence
    var piece = nextpiece();

    //get preview positions for piece type
    var blkpos = prev_positions[piece.type];

    function blockcreate(pos) {
        var blk = createblock();
        blk.x = pos[0];
        blk.y = pos[1];
        piece.addBlock(blk);
        document.body.appendChild(blk);
    }

    //map creation function across initial positions
    map(blockcreate, blkpos);
    piece.center = piece.blocks[0];

    drawinpreview(piece);

    return piece;
}

function startgame() {
    glbl_board = createboard();
    current_piece = previewplace();
    initialplace(current_piece, glbl_board);
    next_piece = previewplace();

    document.onkeydown = function(event) {
        var code = window.event ? window.event.keyCode : event.which;
        arrowkeymap(code);
    };

    function falloop() {
        if(!fall(current_piece, glbl_board)) {
            settle(current_piece, glbl_board);
            fulline(glbl_board, clearallines);
            current_piece = next_piece;
            if(!initialplace(current_piece, glbl_board)) { //if this fails, the player loses
                gameover();
                return;
            }
            next_piece = previewplace();
        }
    }

    gameloop = falloop;
    
    endgame = setInterval("gameloop()", 1000/level_timing[0]);
}

function gameover() {
    clearInterval(endgame);
    alert("Game Over.");
}

function arrowkeymap(keycode) {
    //shift left
    if(keycode == 37) //left arrow
        shiftleft(current_piece, glbl_board);

    //shift right
    if(keycode == 39) //right arrow
        shiftright(current_piece, glbl_board);

    //fall
    if(keycode == 40) //down arrow
        fall(current_piece, glbl_board);

    //plummet
    if(keycode == 32) //space
        plummet(current_piece, glbl_board);

    //rotate clockwise
    if(keycode == 38) //up arrow
        rotatecw(current_piece, glbl_board);
}

function ijklkeymap(keycode) {
    //shift left
    if(keycode == 74) // j
        shiftleft(current_piece, glbl_board);

    //shift right
    if(keycode == 76) // l
        shiftright(current_piece, glbl_board);

    //fall
    if(keycode == 75) // k
        fall(current_piece, glbl_board);

    //plummet
    if(keycode == 79) // o
        plummet(current_piece, glbl_board);

    //rotate clockwise
    if(keycode == 73) // i
        rotatecw(current_piece, glbl_board);
}

function keyhandler(keycode) {
    //shift left (left arrow/j)
    if(keycode == 37 || keycode == 74) {
        shiftleft(current_piece, glbl_board);
    }

    //rotate clockwise (up arrow/i)
    if(keycode == 38 || keycode == 73) {
        rotatecw(current_piece, glbl_board);
    }

    //shift right (right arrow/l)
    if(keycode == 39 || keycode == 76) {
        shiftright(current_piece, glbl_board);
    }

    //fall current_piece (down arrow/k)
    if(keycode == 40 || keycode == 75) {
        fall(current_piece, glbl_board);
    }

    //plummet current_piece (o)
    if(keycode == 79) {
        plummet(current_piece, glbl_board);
    }

    //rotate counterclockwise (u)
    if(keycode == 85) {
        rotateccw(current_piece, glbl_board);
    }
}

function updatelines(lines) {
    var span = document.getElementById("lines");
    var text = document.createTextNode("" + lines);
    span.replaceChild(text, span.firstChild);
}
