var GAME_WIDTH = 450;
var GAME_HEIGHT = 700;

//Game Variables
var ship;
var lasers;
var mouseTouchDown = false;

// Create a Phaser game instance
var game = new Phaser.Game(
	GAME_WIDTH,
	GAME_HEIGHT,
	Phaser.AUTO,
	'container',
	{ preload: preload, create: create, update: update, init: init, render: render }
);

// Preload assets
function preload() {
	var dir = 'static/img/assets/';
	game.load.spritesheet('ship', dir + 'star-ship.png',64,64);
	game.load.spritesheet('enemy_1', dir + 'enemy_1.png',64,64);
	game.load.spritesheet('enemy_1_explosion', dir + 'enemy_1_explosion.png',64,64);
	game.load.image('laser', dir + 'laserBlue02.png');
}

// Init
function init() {
	// Listen to space & enter keys
	var keys = [Phaser.KeyCode.SPACEBAR, Phaser.KeyCode.ENTER];
	var mkeys = [Phaser.KeyCode.LEFT, Phaser.KeyCode.RIGHT];
	// Create Phaser.Key objects for listening to the state
	phaserKeys = game.input.keyboard.addKeys(keys);
	movementKeys = game.input.keyboard.addKeys(mkeys);
	// Capture these keys to stop the browser from receiving this event
	game.input.keyboard.addKeyCapture(keys);
	game.input.keyboard.addKeyCapture(mkeys);
}

// Assets are available in create
function create() {
		
	aliens = game.add.group();
  aliens.enableBody = true;
  aliens.physicsBodyType = Phaser.Physics.ARCADE;
	createAliens();

	// Create the group using the group factory
	lasers = game.add.group();
	// To move the sprites later on, we have to enable the body
	lasers.enableBody = true;
	// We're going to set the body type to the ARCADE physics, since we don't need any advanced physics
	lasers.physicsBodyType = Phaser.Physics.ARCADE;
	/*

		This will create 20 sprites and add it to the stage. They're inactive and invisible, but they're there for later use.
		We only have 20 laser bullets available, and will 'clean' and reset they're off the screen.
		This way we save on precious resources by not constantly adding & removing new sprites to the stage

	*/
	lasers.createMultiple(20, 'laser');
	
	//  An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(30, 'enemy_1_explosion');
    explosions.forEach(setupInvader, this);

	/*
		Create a ship using the sprite factory
		game.add is an instance of Phaser.GameObjectFactory, and helps us to quickly create common game objects.
		The sprite is already added to the stage
	*/
	ship = game.add.sprite(game.world.centerX, game.world.height, 'ship');
	ship.animations.add('fly', [ 0, 1, 2, 3 ], 12, true);
	ship.play('fly');
	// Set the anchorpoint to the middle
	ship.anchor.setTo(.5,1);

	/*

		Behind the scenes, this will call the following function on all lasers:
			- events.onOutOfBounds.add(resetLaser)
		Every sprite has an 'events' property, where you can add callbacks to specific events.
		Instead of looping over every sprite in the group manually, this function will do it for us.

	*/
	lasers.callAll('events.onOutOfBounds.add', 'events.onOutOfBounds', resetLaser);
	// Same as above, set the anchor of every sprite to 0.5, 1.0
	lasers.callAll('anchor.setTo', 'anchor', 0.5, 1.0);

	// This will set 'checkWorldBounds' to true on all sprites in the group
	lasers.setAll('checkWorldBounds', true);
}

function createAliens () {

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 8; x++)
        {
            var enemy = aliens.create(x * 48, y * 50, 'enemy_1');
            enemy.anchor.setTo(0.5, 0.5);
            enemy.animations.add('fly', [ 0, 1, 2, 3 ], 6, true);
            enemy.play('fly');
            enemy.body.moves = false;
        }
    }

    aliens.x = 20;
    aliens.y = 50;

    //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
    var tween = game.add.tween(aliens).to( { x: 90 }, 1000, Phaser.Easing.Linear.None, true, 0, -1, true);
		var tween = game.add.tween(aliens).to( { y: 400 }, 5000, Phaser.Easing.Linear.None, true, 0, -1, true);

    //  When the tween loops it calls descend
    tween.onLoop.add(descend, this);
}
function setupInvader (invader) {

    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('enemy_1_explosion');

}

function descend() {

    aliens.y += 10;

}

function resetLaser(laser) {
	laser.kill();
}

// Update
function update() {
	
	for (var idx in movementKeys) {
		var key = movementKeys[idx];
		// game.debug.text(Object.keys(key)[12],10, 80);
		// game.debug.text(Object.keys(key),10, 80);
		// game.debug.text(key.isLeft,10, 80);
		// game.debug.text(JSON.stringify(key.keyCode),10, 80);
		// game.debug.text(JSON.stringify(ship.x),10, 100);

		if (key.isDown) {
			if(key.keyCode === 37){
				if (ship.x > 50) {
					ship.x -= 5;
				}
			}
			if(key.keyCode === 39){
				if (ship.x < 400) {;
					ship.x += 5;
				}
			}
		}
	}

	// Loop over the keys
	for (var index in phaserKeys) {
		// Save a reference to the current key
		var key = phaserKeys[index];
		// If the key was just pressed, fire a laser
		if (key.justDown) {
			fireLaser();
		}
	}

	// Game.input.activePointer is either the first finger touched, or the mouse
	if (game.input.activePointer.isDown) {
		// We'll manually keep track if the pointer wasn't already down
		if (!mouseTouchDown) {
			touchDown();
		}
	} else {
		if (mouseTouchDown) {
			touchUp();
		}
	}
	
	game.physics.arcade.overlap(lasers, aliens, collisionHandler, null, this);

}

function touchDown() {
	// Set touchDown to true, so we only trigger this once
	mouseTouchDown = true;
	fireLaser();
}

function touchUp() {
	// Set touchDown to false, so we can trigger touchDown on the next click
	mouseTouchDown = false;
}

function fireLaser() {
	// Get the first laser that's inactive, by passing 'false' as a parameter
	var laser = lasers.getFirstExists(false);
	if (laser) {
		// If we have a laser, set it to the starting position
		laser.reset(ship.x, ship.y - 20);
		// Give it a velocity of -500 so it starts shooting
		laser.body.velocity.y = -500;
	}

}

function collisionHandler (bullet, alien) {

    //  When a bullet hits an alien we kill them both
    bullet.kill();
    alien.kill();

    //  And create an explosion :)
    var explosion = explosions.getFirstExists(false);
    explosion.reset(alien.body.x+32, alien.body.y+32);
		explosion.anchor.x = 0.5;
    explosion.anchor.y = 0.5;
    explosion.play('enemy_1_explosion', 30, false, true);


}

// Render some debug text on screen
function render() {
	
}

