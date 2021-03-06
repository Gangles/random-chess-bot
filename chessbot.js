// import twitter library
var Twit = require('twit');
var T = new Twit(require('./config.js'));

// import chess library
var ch =  require('chess.js');

// global bot variables
var DO_TWEET = true;
var toTweet = "";

function waitToBegin() {
	// generate a chess game to tweet immediately
	queueTweet();
	
	// schedule tweet every 12 hours
	var d = new Date();
	var timeout = 60 - d.getSeconds();
	timeout += (59 - d.getMinutes()) * 60;
	timeout += (11 - (d.getHours() % 12)) * 60 * 60;
	if (!DO_TWEET) timeout = 1; // debug

	// heroku scheduler runs every 10 minutes
	console.log("Wait " + timeout + " seconds for next tweet");
	if (timeout < 10 * 60)
		setTimeout(postTweet, timeout * 1000);
	else
		process.exit(0);
}

function postTweet() {
	// this shouldn't happen, a tweet should already be queued
	while (toTweet.length < 100 || toTweet.length > 140) queueTweet();
	
	// post a new status to the twitter API
	console.log( "Posting tweet:", toTweet );
	if (DO_TWEET) {
		T.post('statuses/update', { status: toTweet }, postCallback);
	}
}

function postCallback( error, data, response ) {
	// twitter API callback from posting tweet
	console.log(error, data);
	if (response.statusCode == 200 && !error) {
		console.log("Post tweet success!");
		process.exit(0);
	}
	else {
		console.log("Post tweet error:", error);
		process.exit(1);
	}
}

function queueTweet() {
	// clear the previous tweet
	toTweet = "";
	
	// simulate chess games until we find a checkmate
	var chess = playRandomChess();
	while (chess == null) chess = playRandomChess();
	
	// add the move count and last move
	var turns = chess.history().length;
	var last = chess.history().pop();
	toTweet = "↱" + turns + ": " + last;
	
	// generate an ASCII chess board
	var board = chess.ascii().split("\n");
	
	// clean up the board, add unicode symbols
	for(var i = 0; i < board.length ; ++i) {
		if (/^ \d/.test(board[i])) {
			board[i] = board[i].substring(5, 27);
		
			board[i] = board[i].replace(/K/g, "♔");
			board[i] = board[i].replace(/Q/g, "♕");
			board[i] = board[i].replace(/R/g, "♖");
			board[i] = board[i].replace(/B/g, "♗");
			board[i] = board[i].replace(/N/g, "♘");
			board[i] = board[i].replace(/P/g, "♙");

			board[i] = board[i].replace(/k/g, "♚");
			board[i] = board[i].replace(/q/g, "♛");
			board[i] = board[i].replace(/r/g, "♜");
			board[i] = board[i].replace(/b/g, "♝");
			board[i] = board[i].replace(/n/g, "♞");
			board[i] = board[i].replace(/p/g, "♟");

			board[i] = board[i].replace(/\./g, "▢");
			board[i] = board[i].replace(/  /g, " ");
			
			toTweet += "\n" + board[i];
		}
	}
}

function playRandomChess() {
	// reset the board
	var chess = new ch.Chess();
	
	while (!chess.game_over()) {
		// play a random legal move
		var moves = chess.moves();
		chess.move(moves[Math.floor(Math.random() * moves.length)]);

		// we found a checkmate!
		if (chess.in_checkmate()) return chess;

		// this game probably won't end, restart
		if (chess.history().length > 300) return null;
	}
	
	// fell through to a non-checkmate result
	return null;
}

waitToBegin();