// Use the http module: http://nodejs.org/api/http.html
var http = require('http');
var fs = require('fs');
var url =  require('url');

// http://nodejs.org/api/http.html#http_event_request
function handleIt(req, res) {
	console.log("The URL is: " + req.url);

	//req is an IncominMessage: http://nodejs.org/api/http.html#http_http_incomingmessage
	//res is a ServerResponse: http://nodejs.org/api/http.html#http_class_http_serverresponse
	//res.writeHead(200, {'Content-Type': 'text/html'});
	//res.end('<html><body><b>Hello World</b></body></html>\n');

	var parsedUrl = url.parse(req.url);
	console.log("They asked for " + parsedUrl.pathname);

	var path = parsedUrl.pathname;
	if (path == "/") {
		path = "index.html";
	}

	fs.readFile(__dirname + path,

		// Callback function for reading
		function (err, fileContents) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + req.url);
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(fileContents);
		}
		);	
	
	// Send a log message to the console
	console.log("Got a request " + req.url);
}



// Call the createServer method, passing in an anonymous callback function that will be called when a request is made
var httpServer = http.createServer(handleIt);

// Tell that server to listen on port 8081
httpServer.listen(8080);  

console.log('Server listening on port 8080');

//////////////////////////

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);
var usersId=[];
var usersPosX=[];
var usersPosY=[];
var userList=[];


// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function
	function (socket) {

		var userId = socket.id;
		var thisUser = {
			id: socket.id,
			x: 80 * Math.random(),
			y: 60 * Math.random(), 
			chatHistory: '',
		};

		socket.on('drawing', function(data) {
			// console.log("server recieved the x, y data!");
			io.sockets.emit("drawing", data);
		});

		socket.on('avataradded', function(user) {
			thisUser.img = user.img;
			userList.push(thisUser);
			io.emit('userListUpdated', userList);
		});

		socket.on('chatmessage', function(data) {
			for (var i = 0; i < userList.length; i++) {
			    if (userList[i].id === userId) {
			       userList[i].chatHistory = data;
			    }
			}
			// Send it to all of the clients
			io.emit('chatmessage', {message:data, userId:userId});
		});

		
		socket.on('clear', function(){
			for (var i = 0; i < userList.length; i++) {
			    if (userList[i].id === userId) {
			       userList[i].chatHistory = '';
			    }
			}
			// Send it to all of the clients
			io.emit('clear', socket.id);
		});
			
		socket.on('disconnect',function(){
			for (var i = 0; i < userList.length; i++) {
			    if (userList[i].id === userId) {
			       userList.splice(i,1);
			    }
			}
			io.emit('disconnect', socket.id);
		});

	}
	);


