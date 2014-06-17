var speeds = [1,2,4,5,10,15,20,25,30,40,50,75,100,150,200,250,300,400,500,750,1000], currSpeed = 8;
var app = {
	tick: 0, 
	pop: 0, 
	pixelWidth: 12, 
	paused: true, 
	speed: speeds[currSpeed]

},	canvas;

$(function() {
	canvas = document.getElementById('canvas');
	canvas.width = Math.floor(window.innerWidth/app.pixelWidth)*app.pixelWidth;
	canvas.height = Math.floor((window.innerHeight-22)/app.pixelWidth)*app.pixelWidth;

	if (canvas.getContext) {
		app.ctx = canvas.getContext('2d');
		app.width = canvas.width/app.pixelWidth;
		app.height = canvas.height/app.pixelWidth;

		
		app.grid = [];
		for (i = 0; i < app.width * app.height; i++)
			app.grid.push(false);

		console.log("Initalizing grid with dimensions: " + app.width + " / " + app.height);

  		document.addEventListener("keydown", keyDown, false);
		$("#canvas").on('mousedown', mouse.down);
		$("#canvas").on('mousemove', mouse.move);
		$("#canvas").on('mouseup', mouse.up);

		$("#reset").on('click', reset);

		$("#increaseSpeed").on('click', function (event) {
			if (currSpeed < speeds.length-1) {
				app.speed = speeds[--currSpeed];
			}
			updateStatus();
		});
		$("#decreaseSpeed").on('click', function (event) {
			if (currSpeed > 0) {
				app.speed = speeds[++currSpeed];
			}
			updateStatus();
		});

		draw();
	} else {
		console.log("Canvas not supported!");
	}
});

function reset() {
	app.tick = 0;
	app.speed = 30;
	app.pop = 0;
	app.paused = true;
	for (i = 0; i < app.width * app.height; i++)
		app.grid[i] = false;
	draw();
}

function tick() {
	gridCopy = [];
	for (var i = 0; i < app.width*app.height; i++)
		gridCopy.push(false);
	for (var i = 0; i < app.width*app.height; i++) {
		var x = i%app.width, 
			y = (i-x)/app.width,
			n = neighbors(x,y);
		if (app.grid[i] && (n < 2 || n > 3)) {
			erase(x,y, gridCopy);
		} else if (!app.grid[i] && n==3) {
			fill(x,y, gridCopy);
		} else {
			gridCopy[i] = app.grid[i];
		}
	}
	app.grid = gridCopy;
	app.tick++;
	updateStatus();
}

function neighbors(x,y) {
	var c = 0, 
		i = y*app.width+x, 
		h = app.height-1;
	if (x > 0) {
		c += app.grid[i - 1] +
		(y > 0 ? +app.grid[i-app.width - 1] : 0) +
		(y < h ? +app.grid[i+app.width - 1] : 0);

	} if (x < app.width - 1) {
		c += app.grid[i + 1] +
		(y > 0 ? +app.grid[i-app.width + 1] : 0) +
		(y < h ? +app.grid[i+app.width + 1] : 0);

	} 
	c += (y > 0 ? +app.grid[i-app.width] : 0) +
		 (y < h ? +app.grid[i+app.width] : 0);
	return c;
}

loop = function(start) {
  _loop = function() {
    tick();
    if (!app.paused)
      window.setTimeout(_loop, app.speed);
  }
  if (start)
    _loop();
}
  
function draw() {
	app.ctx.clearRect(0, 0, canvas.width, canvas.height);
	var x = 0, y = 0;
	for (i = 0; i < app.grid.length; i++) {
		var c = Math.floor(app.grid[i] ? 64 : 196);
		app.ctx.fillStyle = "rgb(" + c + "," + c + "," + c + ")";
		x = i % app.width;
		y = (i - x) / app.width;
        app.ctx.fillRect(x * app.pixelWidth + 1, y * app.pixelWidth + 1, app.pixelWidth - 1, app.pixelWidth - 1);
	}
	updateStatus();
}

function keyDown(event) {
	console.log(event.which + " pressed");
	switch (event.which) {
		case 32: // Space
			event.preventDefault();
			tick();
			updateStatus();
			break;
		case 13: 
			event.preventDefault();
			app.paused = !app.paused;
			loop(!app.paused);
			break;
	}
}

var mouse = {
	held: false, 
	down: function(event) {
		event.preventDefault();
		mouse.held = true;
		put(event.which);
	}, 
	up: function(event) {
		event.preventDefault();
		mouse.held = false;
	}, 
	move: function(event) {
		event.preventDefault();
		if (mouse.held) {
			put(event.which);
		}
	}
}

function put(w) {
	var x = Math.floor((event.offsetX || event.clientX - canvas.offsetLeft) / app.pixelWidth),
		y = Math.floor((event.offsetY || event.clientY - canvas.offsetTop) / app.pixelWidth);

	if (w==2) {
		console.log([x,y].toString() + "\t" + neighbors(x,y));
		return;
	}
	var v = app.grid[y*app.width+x];
	if (v && w==3)
		erase(x,y);
	else if (!v && w!=3)
		fill(x,y);
	updateStatus();
}

function fill(x, y, grid) {
	if (x < 0 || y < 0 || x >= app.width || y >= app.height)
		return;
	if (!app.grid[y*app.width+x]) {
		app.pop++;
		app.ctx.fillStyle = "rgb(64,64,64)";
		app.ctx.fillRect(x*app.pixelWidth+1, y*app.pixelWidth+1, app.pixelWidth-1, app.pixelWidth-1);
		(grid ? grid : app.grid)[y*app.width+x] = true;
	}
}

function erase(x, y, grid) {
	if (x < 0 || y < 0 || x >= app.width || y >= app.height)
		return;
	if (app.grid[y*app.width+x]) {
		app.pop--;
		app.ctx.fillStyle = "rgb(196,196,196)";
		app.ctx.fillRect(x*app.pixelWidth+1, y*app.pixelWidth+1, app.pixelWidth-1, app.pixelWidth-1);
		(grid ? grid : app.grid)[y*app.width+x] = false;
	}
}

function updateStatus() {
	$("#gen").text(app.tick);
	$("#pop").text(app.pop);
	$("#speed").text(app.speed);
	$("#dimensions").text(app.width + " / " + app.height);
}

function changeSpeed(speed) {
	app.speed = speed;
	updateStatus();
}