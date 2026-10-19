/*

1. Extensions - sounds, platforms, enemies
Game works fine on Chrome. Slow on Firefox.
Character should be standing below the platform to jump up onto it.

2. Difficult bits -
* Constraining character's x position when falling down canyon
* Drawing bricks onto the platform for any given size

3. Skills learnt - factory pattern, constructor functions, a few basics of audio production

4. Notes and credits
Background Music:
	* levelcomplete.wav - Sound from plasterbrain from Freesound.org
	* gameoversound.wav - Create by Mativve from Freesound.org
	* Other audio was made using royalty free sound loops.
	* Royalty free audio loops from 
		* https://www.humblebundle.com/software/mega-sound-designer-loop-crate-vol-2-software
	* Software Used : Audacity (freeware), Mixcraft 8 Home Studio (from humblebundle.com)

Sound effects for actions:
	* This was generated using sfxr software (http://www.drpetter.se/project_sfxr.html, freeware).
	* Soundfile for JumpSound was taken from coursework.


----------------
GAME CONTROLS
----------------
	* Move forward -> right arrow key
	* Move backward -> left arrow key
	* Jump up -> space bar

----------------
HOW TO PLAY
----------------
	* Keep moving forward, collecting coins, until you reach the flagpole at the end
	* Jump over canyons and enemies
	* Jump up onto platforms to cross larger canyons

----------------
GAME RULES
----------------
	* Character must be under a platform to jump up onto it
	* Player loses a life if character collides with an enemy character
	* Player loses a life if character falls into a canyon
	* Player has 3 lives - game is over when all 3 lives are lost
	* Game is over when player has reached the flag at the end
	* Score is increased by 1 point for each coin collected
*/


var gameChar_x;
var gameChar_y;
var floorPos_y;
var scrollPos;
var gameChar_world_x;

var isLeft;
var isRight;
var isFalling;
var isPlummeting;

var grassWidths;
var grassHeights;

var jumpSound;
var coinSound;
var fallingSound;
var hitEnemySound;
var backgroundMusic;
var gameOverSound;
var levelCompletedSound;
var gameEndSoundPlayed;

var trees_x;
var clouds;
var collectables;

var backMountains;
var middleMountains;
var frontMountains;

var canyons;
var bubbleX;
var caughtCanyon;

var flagpole;
var lives;

var platforms;
var enemies;

var game_score;
var startedPlaying;


function preload()
{
	soundFormats('wav');
	// Load sounds and set volume
	jumpSound = loadSound('assets/jump.wav');
	jumpSound.setVolume(0.1);
	coinSound = loadSound('assets/coin.wav');
	coinSound.setVolume(0.1);
	fallingSound = loadSound('assets/fall.wav');
	fallingSound.setVolume(0.1);
	hitEnemySound = loadSound('assets/hitenemy.wav');
	hitEnemySound.setVolume(0.5);
	backgroundMusic = loadSound('assets/backgroundmusic.wav');
	backgroundMusic.setVolume(0.05);
	gameOverSound = loadSound('assets/gameoversound.wav');
	gameOverSound.setVolume(0.1);
	levelCompletedSound = loadSound('assets/levelcomplete.wav');
	levelCompletedSound.setVolume(0.5);
}


function setup()
{
	createCanvas(1024, 576);
	frameRate(60);
	startedPlaying = false;
	lives = 3;
	gameEndSoundPlayed = false;
	startGame();
}


function draw()
{
	// Fill the sky blue
	background(100, 192, 241);
	noStroke();
	drawGround(); // Draw ground

	// Draw mountain layers and implementing scrolling
	push();
	translate(scrollPos * 0.45, 0);
	drawBackMountains();
	pop();
	push();
	translate(scrollPos * 0.6, 0);
	drawMiddleMountains();
	pop();
	push();
	translate(scrollPos * 0.75, 0);
	drawFrontMountains();
	pop();

	// Implementing scrolling
	push();
	translate(scrollPos, 0);

	// Draw grass, clouds, trees.
	drawGrass();
	drawClouds();
	drawTrees();

	// Draw platforms
	for (var i = 0; i < platforms.length; i++)
	{
		platforms[i].draw();
	}

	// Draw collectable items.
	for (var i = 0; i < collectables.length; i++)
	{
		if (!collectables[i].isFound)
		{
			drawCollectable(collectables[i]);
			checkCollectable(collectables[i]);
		}
	}

	// Draw canyons.
	for (var i = 0; i < canyons.length; i++)
	{
		drawCanyon(canyons[i]);
		checkCanyon(canyons[i]);
	}

	// Draw flagpole
	renderFlagpole();
	
	// Draw enemies
	for (var i = 0; i < enemies.length; i++)
	{
		enemies[i].draw();
		
		var isEnemyContact = enemies[i].checkEnemyContact(
			gameChar_world_x, gameChar_y
		);
		
		if (isEnemyContact)
		{
			if (lives > 0)
			{
				hitEnemySound.play();
				lives -= 1;
				startGame();
				break;
			}
		}
	}

	pop();

	// Draw game character.
	drawGameChar();

	// Draw game score text on screen
	fill(255);
	noStroke();
	textSize(25);
	text("Score: " + game_score, 25, 25);

	// Draw life tokens for lives remaining
	for (var i = 0; i < lives; i++)
	{
		drawLifeTokens(i * 50 + 850, 80);
	}

	// Draw Game Over screen
	if (lives < 1)
	{
		drawGameOverScreen();
		if (!gameEndSoundPlayed)
		{
			backgroundMusic.stop();
			gameOverSound.play();
			gameEndSoundPlayed = true;
		}
	}

	// Draw Level Complete screen
	if (flagpole.isReached)
	{
		drawLevelCompleteScreen();
		if (!gameEndSoundPlayed)
		{
			backgroundMusic.stop();
			levelCompletedSound.play();
			gameEndSoundPlayed = true;
		}
	}

	// Draw start up screen
	if (!startedPlaying)
	{
		drawStartupScreen();
	}

	// Logic to make the game character move or the background scroll.
	if (isLeft)
	{
		if (gameChar_x > width * 0.2)
		{
			gameChar_x -= 5;
		}
		else
		{
			scrollPos += 5;
		}
	}

	if (isRight)
	{
		if (gameChar_x < width * 0.8)
		{
			gameChar_x  += 5;
		}
		else
		{
			scrollPos -= 5; // Negative for moving against the background
		}
	}

	// Logic to make the game character rise and fall.
	// Adding gravity
	if (gameChar_y < floorPos_y)
	{
		var isContact = false;
		for (var i = 0; i < platforms.length; i++)
		{
			if (platforms[i].checkContact(gameChar_world_x, gameChar_y))
			{
				isContact = true;
				break;
			}
		}
		if (!isContact)
		{
			isFalling = true;
			gameChar_y += 2;
		}
		else 
		{
			isPlummeting = false;
			isFalling = false;
		}
	}	
	else
	{
		isFalling = false;
	}

	if (isPlummeting)
	{
		gameChar_y += 4;
	}


	// Logic for checking flagpole
	if (!flagpole.isReached)
	{
		checkFlagpole();
	}

	// Logic for counting player lives
	checkPlayerDie();

	// Update real position of gameChar for collision detection.
	gameChar_world_x = gameChar_x - scrollPos;
	
	// If Plummeting, change game char X to be constrained inside canyon
	// This ensures character falls inside canyon
	if (isPlummeting)
	{
		// Constrain world position inside canyon
		var constrainedGameWorldX = constrain(gameChar_world_x,
			caughtCanyon.x_pos + 30, caughtCanyon.x_pos + caughtCanyon.width - 30);
		// Difference between current game character in world vs constrained in world
		var diff = gameChar_world_x - constrainedGameWorldX;
		// Change game character position according to the difference
		// So character is constrained inside canyon
		gameChar_x -= diff;
	}
}


// ---------------------
// Key control functions
// ---------------------

function keyPressed()
{
	if (!startedPlaying)
	{
		// Set background music
		if (!backgroundMusic.isPlaying())
		{
			backgroundMusic.loop();
		}
		startedPlaying = true;
		return;
	}

	// Reload the game
	if ((lives < 1 || flagpole.isReached) && key == ' ')
	{
		lives = 3;
		gameEndSoundPlayed = false;
		startedPlaying = false;
		if (!backgroundMusic.isPlaying())
		{
			backgroundMusic.loop();
		}
		startGame();
		return;
	}

	// Ignore key presses when the character is plummeting or game over
	if (isPlummeting || lives < 1 || flagpole.isReached)
	{
		return;
	}

	if (key == 'a' || keyCode == 37)
	{
		isLeft = true;
	}

	if (key == 'd' || keyCode == 39)
	{
		isRight = true;
	}

	if (key == ' ' || key == "w")
	{
		if (!isFalling)
		{
			gameChar_y -= 100;
			jumpSound.play();
		}
	}
}


function keyReleased()
{
	if (key == 'a' || keyCode == 37)
	{
		isLeft = false;
	}

	if (key == 'd' || keyCode == 39)
	{
		isRight = false;
	}
}


// ------------------------------
// Game character render functions
// ------------------------------

// Function to draw the game character.
function drawGameChar()
{
	// Draw game character
	if (isLeft && isFalling)
	{
		// Add your jumping-left code
		// Right ear
		fill(57, 63, 71);
		ellipse(gameChar_x - 2, gameChar_y - 45, 8, 12);
		// Body
		fill(255, 184, 248);
		ellipse(gameChar_x, gameChar_y - 28, 30, 30);
		// Left ear
		fill(0);
		ellipse(gameChar_x + 2, gameChar_y - 45, 8, 20);
		// Eyes
		fill(0)
		ellipse(gameChar_x - 8, gameChar_y - 28, 5, 8);
		fill(255);
		ellipse(gameChar_x - 8, gameChar_y - 27, 2, 4);
		// Nose
		fill(0);
		ellipse(gameChar_x - 13, gameChar_y - 20, 3, 3);
		// Wings
		triangle(gameChar_x + 8, gameChar_y - 27,
			gameChar_x + 18, gameChar_y - 19,
			gameChar_x + 22, gameChar_y - 22);
	}
	else if (isRight && isFalling)
	{
		// Add your jumping-right code
		// Left ear
		fill(57, 63, 71);
		ellipse(gameChar_x + 2, gameChar_y - 45, 8, 12);
		// Body
		fill(255, 184, 248);
		ellipse(gameChar_x, gameChar_y - 28, 30, 30);
		// Right ear
		fill(0);
		ellipse(gameChar_x - 2, gameChar_y - 45, 8, 20);
		// Eyes
		fill(0)
		ellipse(gameChar_x + 8, gameChar_y - 28, 5, 8);
		fill(255);
		ellipse(gameChar_x + 8, gameChar_y - 27, 2, 4);
		// Nose
		fill(0);
		ellipse(gameChar_x + 13, gameChar_y - 20, 3, 3);
		// Wings
		triangle(gameChar_x - 8, gameChar_y - 27,
			gameChar_x - 18, gameChar_y - 19,
			gameChar_x - 22, gameChar_y - 22);
	}
	else if (isLeft)
	{
		// Add your walking left code
		// Right ear
		fill(57, 63, 71);
		ellipse(gameChar_x - 2, gameChar_y - 35, 8, 12);
		// Body
		fill(255, 184, 248);
		ellipse(gameChar_x, gameChar_y - 18, 30, 30);
		// Left ear
		fill(0);
		ellipse(gameChar_x + 2, gameChar_y - 35, 8, 20);
		// Eyes
		fill(0)
		ellipse(gameChar_x - 8, gameChar_y - 18, 5, 8);
		fill(255);
		ellipse(gameChar_x - 8, gameChar_y - 17, 2, 4);
		// Nose
		fill(0);
		ellipse(gameChar_x - 13, gameChar_y - 10, 3, 3);
		// Wings
		triangle(gameChar_x + 8, gameChar_y - 17,
			gameChar_x + 18, gameChar_y - 35,
			gameChar_x + 20, gameChar_y - 30);
	}
	else if (isRight)
	{
		// Add your walking right code
		// Left ear
		fill(57, 63, 71);
		ellipse(gameChar_x + 2, gameChar_y - 35, 8, 12);
		// Body
		fill(255, 184, 248);
		ellipse(gameChar_x, gameChar_y - 18, 30, 30);
		// Right ear
		fill(0);
		ellipse(gameChar_x - 2, gameChar_y - 35, 8, 20);
		// Eyes
		fill(0)
		ellipse(gameChar_x + 8, gameChar_y - 18, 5, 8);
		fill(255);
		ellipse(gameChar_x + 8, gameChar_y - 17, 2, 4);
		// Nose
		fill(0);
		ellipse(gameChar_x + 13, gameChar_y - 10, 3, 3);
		// Wings
		triangle(gameChar_x - 8, gameChar_y - 17,
			gameChar_x - 18, gameChar_y - 35,
			gameChar_x - 20, gameChar_y - 30);
	}
	else if (isFalling || isPlummeting)
	{
		// Add your jumping facing forwards code
		// Ears
		fill(0);
		ellipse(gameChar_x - 8, gameChar_y - 45, 8, 20);
		ellipse(gameChar_x + 8, gameChar_y - 45, 8, 20);
		// Wings
		triangle(gameChar_x - 8, gameChar_y - 27,
			gameChar_x - 18, gameChar_y - 19,
			gameChar_x - 22, gameChar_y - 22);
		triangle(gameChar_x + 8, gameChar_y - 27,
			gameChar_x + 18, gameChar_y - 19,
			gameChar_x + 22, gameChar_y - 22);
		// Body
		fill(255, 184, 248);
		ellipse(gameChar_x, gameChar_y - 28, 30, 30);
		// Eyes
		fill(0)
		ellipse(gameChar_x - 8, gameChar_y - 28, 5, 8);
		ellipse(gameChar_x + 8, gameChar_y - 28, 5, 8);
		fill(255);
		ellipse(gameChar_x - 8, gameChar_y - 27, 2, 4);
		ellipse(gameChar_x + 8, gameChar_y - 27, 2, 4);
		// Nose
		fill(0);
		ellipse(gameChar_x, gameChar_y - 20, 4, 4);
	}
	else
	{
		// Add your standing front facing code
		drawFrontFacingChar(gameChar_x, gameChar_y);
	}
}


// Function to draw standing front facing character
function drawFrontFacingChar(charXPos, charYPos)
{
	// Ears
	fill(0);
	ellipse(charXPos - 8, charYPos - 35, 8, 20);
	ellipse(charXPos + 8, charYPos - 35, 8, 20);
	// Wings
	triangle(charXPos - 8, charYPos - 17,
		charXPos - 18, charYPos - 35,
		charXPos - 20, charYPos - 30);
	triangle(charXPos + 8, charYPos - 17,
		charXPos + 18, charYPos - 35,
		charXPos + 20, charYPos - 30);
	// Body
	fill(255, 184, 248);
	ellipse(charXPos, charYPos - 18, 30, 30);
	// Eyes
	fill(0)
	ellipse(charXPos - 8, charYPos - 18, 5, 8);
	ellipse(charXPos + 8, charYPos - 18, 5, 8);
	fill(255);
	ellipse(charXPos - 8, charYPos - 17, 2, 4);
	ellipse(charXPos + 8, charYPos - 17, 2, 4);
	// Nose
	fill(0);
	ellipse(charXPos, charYPos - 10, 4, 4);
}


// ---------------------------
// Functions for ground and grass
// ---------------------------

// Function to draw ground
function drawGround()
{
	// Coffee brown ground
	fill(199, 166, 121);
	rect(0, floorPos_y + 5, width, height / 4);
	// Green top ground
	fill(0, 255, 0);
	rect(0, floorPos_y, width, 5);
	// Stripes in ground
	fill(237, 207, 166);
	rect(0, height - 90, width, 4);
	rect(0, height - 40, width, 4);
}


// Function to draw grass
function drawGrass()
{
	// Draw grass
	var grassWidthRemainder = flagpole.x_pos + 500; // Bigger value than flagpole
	var grassCurrentX = 0;
	var n = 1;
	// Simulate randomness using pre configured heights and widths of grass
	// Modulus operator was used to map grass count (n) to a suitable height and width
	var grassWidth = grassWidths[n % grassWidths.length];
	var grassHeight;
	while (grassWidthRemainder > 0)
	{
		fill(0, 255, 0);
		grassHeight = grassHeights[n % grassHeights.length];
		triangle(grassCurrentX, floorPos_y + 5,
			grassCurrentX + grassWidth, floorPos_y + 5,
			grassCurrentX + grassWidth, floorPos_y + 5 + grassHeight);
		grassWidthRemainder -= grassWidth;
		grassCurrentX += grassWidth;
		grassWidth = grassWidths[n % grassWidths.length];
		n += 1;
	}
}


// ---------------------------------
// Functions for cloud objects
// ---------------------------------

// Function to draw a single cloud
function drawSingleCloud(cloudX, cloudY, cloudSize)
{
	fill(192, 192, 192);
	push();
	translate(cloudX, cloudY);
	scale(cloudSize);
	ellipse(0, 0, 80, 80);
	ellipse(-40, 10, 50, 50);
	ellipse(45, 8, 55, 55);
	fill(255);
	ellipse(5, -5, 80, 80);
	ellipse(-35, 5, 50, 50);
	ellipse(50, 3, 55, 55);
	pop();
}


// Function to draw cloud objects.
function drawClouds()
{
	for (var i = 0; i < clouds.length; i++)
	{
		// Cloud - translate function has been used here to scale cloud
		var n = Math.floor(frameCount * 0.5) % 7900;
		var cloudXPos = clouds[i].x_pos + (n * clouds[i].speed);
		if (cloudXPos < -500)
		{
			cloudXPos = 7200 + cloudXPos;
		}
		else if (cloudXPos > 7200)
		{
			cloudXPos = cloudXPos - 7200 - 520;
		}
		drawSingleCloud(cloudXPos, clouds[i].y_pos, clouds[i].size);
	}
}


// ---------------------------------
// Functions for back, middle and front mountains
// ---------------------------------

// Function to draw a single back mountain
function drawSingleBackMountain(mtX, mtY, mtScale)
{
	fill(103, 115, 131);
	push();
	translate(mtX, mtY);
	scale(mtScale);
	// Dark grey triangle
	triangle(0, 0, 150, -232, 270, 0);
	// Lighter shades
	fill(109, 125, 148);
	beginShape();
	vertex(150, -232);
	vertex(0, 0);
	vertex(130, 0);
	vertex(190, -35);
	vertex(100, -60);
	vertex(160, -200);
	vertex(150, -232);
	endShape();
	// Light grey
	fill(131, 148, 174);
	beginShape();
	vertex(150, -232);
	vertex(51, -80);
	vertex(150, -100);
	vertex(130, -130);
	vertex(160, -180);
	vertex(150, -232);
	endShape();
	// Snow on top of mountain
	beginShape();
	fill(255);
	vertex(150, -232);
	vertex(130, -202);
	vertex(147, -212);
	vertex(155, -197);
	vertex(172, -192);
	vertex(150, -232);
	endShape();
	pop();
}


// Function to draw a single middle mountain
function drawSingleMiddleMountain(mtX, mtY, mtScale)
{
	fill(148, 114, 96);
	push();
	translate(mtX, mtY);
	scale(mtScale);
	triangle(0, 0, 150, -232, 300, 0);
	fill(168, 134, 117);
	beginShape();
	vertex(150, -232);
	vertex(0, 0);
	vertex(150, 0);
	vertex(150, -232);
	endShape();
	// Snow on top of mountain
	beginShape();
	fill(242, 233, 229);
	vertex(150, -232);
	vertex(119, -185);
	vertex(140, -200);
	vertex(150, -182);
	vertex(155, -197);
	vertex(176, -192);
	vertex(150, -232);
	endShape();
	pop();
}


// Function to draw a single front mountain
function drawSingleFrontMountain(mtX, mtY, mtScale)
{
	fill(152, 237, 196);
	push();
	translate(mtX, mtY);
	scale(mtScale);
	triangle(0, 0, 150, -232, 300, 0);
	fill(218, 245, 231);
	beginShape();
	vertex(150, -232);
	vertex(0, 0);
	vertex(110, 0);
	vertex(150, -232);
	endShape();
	fill(103, 203, 128);
	beginShape();
	vertex(0, 0);
	vertex(22, -35);
	vertex(80, -70);
	vertex(118, -35);
	vertex(115, 0);
	vertex(0, 0);
	endShape();
	fill(51, 149, 76);
	beginShape();
	vertex(115, 0);
	vertex(118, -35);
	vertex(180, -67);
	vertex(250, -20);
	vertex(265, -55);
	vertex(300, 0);
	vertex(0, 0);
	endShape();
	// Snow on top of mountain
	beginShape();
	fill(255);
	vertex(150, -232);
	vertex(130, -202);
	vertex(147, -212);
	vertex(155, -197);
	vertex(176, -192);
	vertex(150, -232);
	endShape();
	pop();
}


// Function to draw all back mountains
function drawBackMountains()
{
	for (var i = 0; i < backMountains.length; i++)
	{
		drawSingleBackMountain(backMountains[i].x_pos, backMountains[i].y_pos,
		backMountains[i].size);
	}
}


// Function to draw all middle brown mountains
function drawMiddleMountains()
{
	for (var i = 0; i < middleMountains.length; i++)
	{
		drawSingleMiddleMountain(middleMountains[i].x_pos, middleMountains[i].y_pos,
		middleMountains[i].size);
	}
}


// Function to draw all front mountains
function drawFrontMountains()
{
	for (var i = 0; i < frontMountains.length; i++)
	{
		drawSingleFrontMountain(frontMountains[i].x_pos, frontMountains[i].y_pos,
		frontMountains[i].size);
	}
}


// ---------------------------------
// Functions for trees and flowers
// ---------------------------------

// Function to draw a flower
function drawFlower(flowerX, flowerY, scaleVal)
{
	push();
	translate(flowerX, flowerY);
	scale(scaleVal);
	noStroke();
	for (let f = 0; f < 10; f ++)
	{
		ellipse(0, 30, 20, 80);
		rotate(PI / 5);
	}
	pop();
}


// Function to draw a single tree
function drawSingleTree(treeX)
{
	// Tree trunk
	fill(118, 42, 29);
	rect(treeX - 10, 340, 30, 92);
	// Tree base layer
	fill(229, 26, 56);
	beginShape();
	bezier(treeX - 20, 340,
	treeX - 120, 440,
	treeX + 135, 440,
	treeX + 35, 340);
	endShape();
	// Tree top layer
	fill(250, 98, 123);
	ellipse(treeX + 7.5, 342, 53, 20);
	beginShape();
	bezier(treeX - 20, 340,
	treeX - 100, 420,
	treeX + 115, 420,
	treeX + 35, 340);
	endShape();
	// Flower 1
	fill(238, 221, 96);
	drawFlower(treeX - 22, 372, 0.18);
	// Flower 2
	fill(255, 241, 142);
	drawFlower(treeX + 6, 335, 0.11);
	// Flower 3
	fill(255, 255, 0);
	drawFlower(treeX + 24, 355, 0.13);
	// Flower 4
	fill(251, 222, 178);
	drawFlower(treeX + 53, 369, 0.10);
	// Flower 5
	fill(235, 229, 140);
	drawFlower(treeX - 7, 395, 0.12);
	// Flower 6
	fill(255, 198, 13);
	drawFlower(treeX + 30, 385, 0.14);
}


// Function to draw all trees
function drawTrees()
{
	for (var i = 0; i < trees_x.length; i++)
	{
		drawSingleTree(trees_x[i]);
	}
}


// ---------------------------------
// Canyon render and check functions
// ---------------------------------

// Function to draw canyon objects.
function drawCanyon(t_canyon)
{
	// Alpha values of moving sections of waterfall
	var shades = [70, 50, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	// Base rectangles of waterfall
	fill(156, 242, 255);
	rect(t_canyon.x_pos, floorPos_y, t_canyon.width, floorPos_y);
	fill(32, 150, 206, 20);
	rect((t_canyon.x_pos + t_canyon.width / 4 * 3), floorPos_y, t_canyon.width / 4, floorPos_y);

	// Portioning waterfall height into 20 sections
	var sectionSize = floorPos_y / 20;
	// Outputs value from 0 to 19 - position in the "shades" cycle
	var j = Math.floor((frameCount % 100) / 5);

	// Drawing sections of the waterfall
	for (var i = 0; i < floorPos_y; i += sectionSize)
	{
		j--; // Makes the white section appear to move down the waterfall
		if (j < 0)
		{
			j = shades.length - 1;
		}
		var opacity = shades[j % shades.length];
		fill(255, 255, 255, opacity);
		rect(t_canyon.x_pos, floorPos_y + i, t_canyon.width, sectionSize);
	}

	// Drawing foam bubbles at the base of the waterfall
	fill(255, 255, 255, 100);

	// Random values from 0 to 1 to generate unique random values based on frame count
	var bubbleY = [0.8, 0.2, 0.6, 0.1, 0.5, 0.7, 0.3, 0.6, 0.1, 0.4, 0.7, 0.6, 0.3];
	var bubbleSize = [10, 30, 10, 20, 10, 10, 20];

	// Picks a random value from bubbleX and bubbleY every 10 frames
	var everyTenFrames = Math.floor(frameCount / 10);

	// Draw bubbles - bubble count depends on width of canyon
	for (var bubble = 0; bubble < t_canyon.width / 6; bubble++)
	{
		var random1 = bubbleX[(everyTenFrames + bubble) % bubbleX.length];
		var random2 = bubbleY[(everyTenFrames + bubble) % bubbleY.length];
		var randomSize = bubbleSize[(everyTenFrames + bubble) % bubbleSize.length];
		// Calculate bubble's x position and y position based on random1 and random 2
		var bubbleXPos = Math.floor(random1 * t_canyon.width);
		var bubbleYPos = Math.floor(random2 * (height - floorPos_y) / 5);
		ellipse(t_canyon.x_pos + bubbleXPos, height - bubbleYPos, randomSize, randomSize);
	}

}


// Function to check if character is over a canyon.
function checkCanyon(t_canyon)
{
	// Plummeting
	if ((gameChar_world_x > t_canyon.x_pos)
		&& (gameChar_world_x < t_canyon.x_pos + t_canyon.width)
		&& (gameChar_y >= floorPos_y))
	{
		isPlummeting = true;
		// caughtCanyon is used to constrain the plummeting x position
		caughtCanyon = t_canyon;
	}
}


// ---------------------------------
// Functions for drawing, rendering and checking flagpole
// ---------------------------------

function renderFlagpole()
{
	push();
	strokeWeight(5);
	stroke(100);
	line(flagpole.x_pos, floorPos_y, flagpole.x_pos, floorPos_y - 250);

	if (flagpole.isReached)
	{
		drawFlag(flagpole.x_pos, floorPos_y - 250);
	}
	else
	{
		drawFlag(flagpole.x_pos, floorPos_y - 50);
	}
	pop();
}


function checkFlagpole()
{
	var d = abs(gameChar_world_x - flagpole.x_pos);
	if (d < 15)
	{
		flagpole.isReached = true;
	}
}


function drawFlag(x, y)
{
	fill(255, 79, 135);
	noStroke();
	rect(x, y, 50, 50);
	// heart drawings
	fill(200, 20, 80);
	ellipse(x + 11, y + 10, 15);
	ellipse(x + 24, y + 10, 15);
	triangle(x + 4, y + 14, x + 30, y + 15, x + 18, y + 26);
	fill(60, 60, 240);
	ellipse(x + 27, y + 30, 15);
	ellipse(x + 40, y + 30, 15);
	triangle(x + 20, y + 34, x + 46, y + 35, x + 34, y + 46);
}


// ---------------------------------
// Platforms functions
// ---------------------------------

// Function to create platforms
function createPlatforms(x, y, length)
{
	var platformObject = {
		x: x,
		y: y,
		length: length,
		draw: function() 
		{
			drawPlatform(this.x, this.y, this.length);
		},
		checkContact: function(gc_x, gc_y)
		{
			if (gc_x > this.x && gc_x < this.x + this.length)
			{
				var d = this.y - gc_y;
				if (d == 0)
				{
					return true;
				}
			}
			return false;
		}
	}
	return platformObject;
}


// Function to draw platforms
function drawPlatform(platform_x, platform_y, platform_length)
{
	fill(162, 66, 0);
	rect(platform_x, platform_y, platform_length, 30);
	var internalPlatformLength = platform_length - 10;
	// Below is the size of a brick except for the last brick
	var brickSize = 25;
	// Function parseInt was used to convert the number of boxes to a usable integer
	var boxes = Math.ceil(internalPlatformLength / brickSize);
	for (var i = 0; i < boxes; i++)
	{
		// 2 different coloured bricks
		if (i % 2 == 0)
		{
			fill(194, 147, 85);
		}
		else
		{
			fill(212, 175, 88);
		}
		// The last brick is of a different length
		// So bricks for a platform of any size can be created
		if (i == boxes - 1) 
		{ // Checks if this is the last brick
			var finalBrickWidth = internalPlatformLength - (i * brickSize);
			rect(platform_x + 5 + (i * brickSize), platform_y + 5, finalBrickWidth, 20);
		}
		else
		{
			rect(platform_x + 5 + (i * brickSize), platform_y + 5, brickSize, 20);
		}
	}
}


// ---------------------------------
// Functions for enemies
// ---------------------------------

// Function to create enemies
function Enemy(x, y, range)
{
	this.x = x;
	this.y = y;
	this.range = range;
	this.currentX = x;
	this.incrementor = 1;

	this.update = function()
	{
		this.currentX += this.incrementor;
		
		if (this.currentX >= this.x + this.range)
		{
			this.incrementor = -1;
		}
		else if (this.currentX < this.x)
		{
			this.incrementor = 1;
		}
	}

	this.draw = function()
	{
		this.update();
		drawEnemy(this.x, this.currentX, this.y - 4, this.range);
	}

	this.checkEnemyContact = function(gc_x, gc_y)
	{
		// Compare distance between game character and enemy
		var d = dist(gc_x, gc_y - 10, this.currentX + 10, this.y);
		return (d < 44);
	}
}


// Function to draw enemy
function drawEnemy(enemyStartX, enemyX, enemyY, enemyRange)
{
	// Distance travelled by enemy from its start position
	var enemy_dist = enemyX - enemyStartX;
	// Dividing distance travelled by enemy into blocks
	var block_num = Math.ceil(enemy_dist / 20);

	// Animating legs with if statement
	if (block_num % 2 == 0 && block_num != 0)
	{
		// Left leg
		fill(255, 190, 0);
		ellipse(enemyX + 5, enemyY, 5, 10);
		// Right leg
		ellipse(enemyX + 15, enemyY, 5, 10);
	}
	else
	{
		// Left leg
		fill(255, 190, 0);
		ellipse(enemyX, enemyY, 5, 10);
		// Right leg
		ellipse(enemyX + 20, enemyY, 5, 10);
	}

	// Animating claws with if statement
	if (block_num % 2 == 0 && block_num != 0)
	{
		// Left claw
		ellipse(enemyX - 5, enemyY - 25, 15, 15);
		// Right claw
		ellipse(enemyX + 25, enemyY - 25, 15, 15);
	}
	else
	{
		// Left claw
		arc(enemyX - 5, enemyY - 25, 20, 20, 0 - QUARTER_PI, PI, PIE);
		// Right claw
		arc(enemyX + 25, enemyY - 25, 20, 20, 0, PI + QUARTER_PI, PIE);
	}

	// Body
	fill(241, 148, 87);
	ellipse(enemyX + 10, enemyY - 10, 40, 25);
	// Left eye
	fill(255, 255, 255);
	ellipse(enemyX, enemyY - 20, 6, 6);
	fill(255, 0, 0);
	ellipse(enemyX, enemyY - 21, 3, 3);
	// Right eye
	fill(255, 255, 255);
	ellipse(enemyX + 20, enemyY - 20, 6, 6);
	fill(255, 0, 0);
	ellipse(enemyX + 20, enemyY - 21, 3, 3);
}


// ----------------------------------
// Collectable items render and check functions
// ----------------------------------

function drawCollectable(t_collectable)
{
	strokeWeight(3);
	stroke(240, 181, 92);
	fill(255);
	ellipse(t_collectable.x_pos, t_collectable.y_pos,
		30 * t_collectable.size, 30 * t_collectable.size);
	fill(161, 150, 120);
	noStroke();
	ellipse(t_collectable.x_pos, t_collectable.y_pos,
		22 * t_collectable.size, 22 * t_collectable.size);
	fill(245, 206, 147);
	ellipse(t_collectable.x_pos, t_collectable.y_pos,
		12 * t_collectable.size, 12 * t_collectable.size);
}


// Function to check character has collected an item.
function checkCollectable(t_collectable)
{
	// Make coin disappear on contact
	if (dist(gameChar_world_x, gameChar_y - 18, t_collectable.x_pos, t_collectable.y_pos) < 38)
	{
		t_collectable.isFound = true;
		coinSound.play();
		game_score += 1;
	}
}


// ---------------------------------
// Life tokens and character death functions
// ---------------------------------

// Function to draw life tokens
function drawLifeTokens(x, y)
{
	drawFrontFacingChar(x, y);
	// Token heart
	fill(255, 79, 135);
	ellipse(x + 5, y, 15);
	ellipse(x + 18, y, 15);
	triangle(x - 1, y + 4, x + 24, y + 5, x + 12, y + 16);
}


// Function to check character death
function checkPlayerDie()
{
	if ((gameChar_y - 55 > height) && (lives >= 1))
	{
		fallingSound.play();
		lives -= 1;
		startGame();
	}
}


// ---------------------------------
// Functions for drawing game poster
// Used for game startup, game over and level completed screens
// ---------------------------------

function drawGamePoster()
{
	// Drawing game poster
	drawPosterBackground();
	// Drawing mountains for poster
	drawSingleBackMountain(205, 395, 1.3);
	drawSingleMiddleMountain(360, 395, 0.5);
	drawSingleFrontMountain(480, 395, 0.9);
	// Drawing clouds for poster
	drawSingleCloud(280, 110, 1);
	drawSingleCloud(420, 215, 0.6);
	drawSingleCloud(750, 180, 0.7);
	// Character drawing for poster
	drawPosterCharacter();
	// Drawing ground for poster
	drawPosterGround();
	// Drawing trees for poster
	drawPosterTrees();
	// Drawing collectable items for poster
	drawPosterCollectables();
	// Drawing canyon for poster
	drawPosterCanyon();
	// Drawing platform for poster
	drawPlatform(640, 325, 160);
	// Drawing enemy for poster
	drawEnemy(453, 711, 320, 0);
}


// Function to draw poster background
function drawPosterBackground()
{
	// Black filter
	fill(0, 0, 0, 180);
	rect(0, 0, width, height);
	// Blue screen
	fill(162, 217, 246);
	strokeWeight(10);
	stroke(255, 79, 135);
	rect(200, 50, 624, 476);
	noStroke();
}


// Function to draw character for poster
function drawPosterCharacter()
{
	push();
	translate(500, 390);
	scale(4);
	drawFrontFacingChar(0, 0);
	pop();
}


// Function to draw ground for poster
function drawPosterGround()
{
	fill(199, 166, 121);
	rect(205, 400, 615, 122);
	fill(0, 255, 0);
	rect(205, 395, 615, 5);
}


// Function to draw trees for poster
function drawPosterTrees()
{
	push();
	translate(260, -80);
	scale(1.1);
	drawSingleTree(0);
	translate(90, 130);
	scale(0.7);
	drawSingleTree(0);
	pop();
}


// Function to draw collectables for poster
function drawPosterCollectables()
{
	// Initiating poster collectables
	var posterCollectables =
		[
			{x_pos: 660, y_pos: 265, size: 1.2, isFound: false},
			{x_pos: 720, y_pos: 235, size: 1.6, isFound: false},
			{x_pos: 780, y_pos: 265, size: 1.2, isFound: false},
		];
	// Draw poster collectable items
	for (var i = 0; i < posterCollectables.length; i++)
	{
		drawCollectable(posterCollectables[i]);
	}
}


// Function to draw canyon for poster
function drawPosterCanyon()
{
	fill(156, 242, 255);
	rect(645, 395, 150, 127);
	fill(32, 150, 206, 20);
	rect(757.5, 395, 37.5, 127);
}


// ---------------------------------
// Functions for game startup screen, game over screen
// and level completed screen
// ---------------------------------
function drawStartupScreen()
{
	drawGamePoster();
	// Drawing text box
	fill(0, 0, 0, 200);
	rect(320, 425, 390, 80);
	stroke(255);
	// Adding text
	if ((Math.ceil(frameCount / 30)) % 2 == 0)
	{
		text("Press any key to Start", 390, 470);
	}
	return;
}


function drawGameOverScreen()
{
	// Draw Game Over screen
	drawGamePoster();
	fill(255, 0, 0, 50);
	rect(200, 50, 624, 476);
	// Game Over text
	fill(0, 0, 0, 200);
	rect(320, 425, 390, 80);
	stroke(255);
	text("Game Over!", 440, 460);
	text("Press space to continue", 380, 490);
	return;
}


function drawLevelCompleteScreen()
{
	// Draw Game Over screen
	drawGamePoster();
	fill(0, 255, 0, 20);
	rect(200, 50, 624, 476);
	// Level Complete text
	fill(0, 0, 0, 200);
	rect(320, 425, 390, 80);
	stroke(255);
	text("Level Complete!", 440, 460);
	text("Press space to continue", 380, 490);
	return;
}


// ---------------------------------
// Start game function
// ---------------------------------
function startGame()
{
	floorPos_y = height * 3 / 4;
	gameChar_x = width / 2;
	gameChar_y = floorPos_y;

	// Variable to control the background scrolling.
	scrollPos = 0;

	// Variable to store the real position of the gameChar in the game
	// world. Needed for collision detection.
	gameChar_world_x = gameChar_x - scrollPos;

	// Boolean variables to control the movement of the game character.
	isLeft = false;
	isRight = false;
	isFalling = false;
	isPlummeting = false;

	// Initialise array - trees.
	trees_x = [400, 1400, 1550, 1700, 2500, 3100, 3250, 3975,
	4125, 4900, 6450, 6600];

	// Arrays for drawing grass.
	grassWidths = [25, 25, 30, 20, 15, 30, 22, 21, 24, 31];
	grassHeights = [15, 20, 14, 25, 22, 11];

	// Initialise array - clouds.
	clouds =
		[
			{x_pos: 150, y_pos: 200, size: 0.6, speed: -0.5},
			{x_pos: 550, y_pos: 155, size: 1.1, speed: 0.6},
			{x_pos: 800, y_pos: 100, size: 1, speed: -0.75},
			{x_pos: 1100, y_pos: 210, size: 0.7, speed: 0.68},
			{x_pos: 1350, y_pos: 170, size: 1, speed: 0.8},
			{x_pos: 1800, y_pos: 110, size: 0.9, speed: -0.98},
			{x_pos: 2000, y_pos: 150, size: 1, speed: 0.45},
			{x_pos: 2500, y_pos: 120, size: 0.6, speed: -0.6},
			{x_pos: 2950, y_pos: 200, size: 0.8, speed: -0.78},
			{x_pos: 3250, y_pos: 170, size: 1, speed: -0.55},
			{x_pos: 3470, y_pos: 100, size: 0.5, speed: 0.64},
			{x_pos: 3790, y_pos: 175, size: 0.65, speed: 0.97},
			{x_pos: 4175, y_pos: 95, size: 0.9, speed: -0.85},
			{x_pos: 4400, y_pos: 145, size: 0.6, speed: -0.59},
			{x_pos: 4500, y_pos: 155, size: 0.3, speed: 0.781},
			{x_pos: 4900, y_pos: 210, size: 0.7, speed: -0.669},
			{x_pos: 5007, y_pos: 170, size: 1, speed: 0.775},
			{x_pos: 5320, y_pos: 80, size: 0.9, speed: 0.86},
			{x_pos: 5820, y_pos: 120, size: 0.6, speed: 0.698},
			{x_pos: 6017, y_pos: 200, size: 0.8, speed: -0.94},
			{x_pos: 6197, y_pos: 100, size: 0.5, speed: -0.47},
			{x_pos: 6477, y_pos: 175, size: 0.65, speed: 0.619},
			{x_pos: 6752, y_pos: 155, size: 0.3, speed: -0.5798},
			{x_pos: 6960, y_pos: 95, size: 0.9, speed: -0.6254},
			{x_pos: 7050, y_pos: 100, size: 0.5, speed: 0.5987}
		];

	// Initialise array - mountains.
	backMountains =
		[
			{x_pos: 170, y_pos: 432, size: 1},
			{x_pos: 100, y_pos: 432, size: 0.6},
			{x_pos: 900, y_pos: 432, size: 0.8},
			{x_pos: 980, y_pos: 432, size: 1},
			{x_pos: 1200, y_pos: 432, size: 0.5},
			{x_pos: 1700, y_pos: 432, size: 1.2},
			{x_pos: 2600, y_pos: 432, size: 1.1},
			{x_pos: 2800, y_pos: 432, size: 0.7},
			{x_pos: 3350, y_pos: 432, size: 0.6},
			{x_pos: 3400, y_pos: 432, size: 0.8},
			{x_pos: 3500, y_pos: 432, size: 0.5}
		];

	middleMountains =
		[
			{x_pos: 450, y_pos: 432, size: 0.6},
			{x_pos: 880, y_pos: 432, size: 0.4},
			{x_pos: 1680, y_pos: 432, size: 0.9},
			{x_pos: 2980, y_pos: 432, size: 0.9},
			{x_pos: 3980, y_pos: 432, size: 1}
		];

	frontMountains =
		[
			{x_pos: 600, y_pos: 432, size: 1},
			{x_pos: 1750, y_pos: 432, size: 0.8},
			{x_pos: 1950, y_pos: 432, size: 0.4},
			{x_pos: 3450, y_pos: 432, size: 0.7},
			{x_pos: 3750, y_pos: 432, size: 0.4},
			{x_pos: 4700, y_pos: 432, size: 0.8}
		];

	// Initialise array - collectables.
	collectables =
		[
			{x_pos: 190, y_pos: 380, size: 1.2, isFound: false},
			{x_pos: 250, y_pos: 380, size: 1.2, isFound: false},
			{x_pos: 750, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 810, y_pos: 290, size: 1.5, isFound: false},
			{x_pos: 870, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 1260, y_pos: 360, size: 1.4, isFound: false},
			{x_pos: 1910, y_pos: 360, size: 1.2, isFound: false},
			{x_pos: 1970, y_pos: 340, size: 1.5, isFound: false},
			{x_pos: 2030, y_pos: 360, size: 1.2, isFound: false},

			{x_pos: 2570, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 2630, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 2690, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 2750, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 2810, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 2870, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 2930, y_pos: 300, size: 1.2, isFound: false},

			{x_pos: 3430, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 3490, y_pos: 300, size: 1.4, isFound: false},
			{x_pos: 3550, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 3610, y_pos: 300, size: 1.4, isFound: false},
			{x_pos: 3670, y_pos: 300, size: 1.2, isFound: false},
			{x_pos: 3730, y_pos: 300, size: 1.4, isFound: false},
			{x_pos: 3790, y_pos: 300, size: 1.2, isFound: false},

			{x_pos: 4260, y_pos: 360, size: 1.2, isFound: false},
			{x_pos: 4850, y_pos: 380, size: 1.2, isFound: false},
			{x_pos: 4910, y_pos: 380, size: 1.2, isFound: false},
			{x_pos: 4970, y_pos: 380, size: 1.2, isFound: false},

			{x_pos: 5370, y_pos: 310, size: 1.2, isFound: false},
			{x_pos: 5430, y_pos: 310, size: 1.2, isFound: false},
			{x_pos: 5490, y_pos: 310, size: 1.2, isFound: false},

			{x_pos: 5525, y_pos: 230, size: 1.2, isFound: false},
			{x_pos: 5585, y_pos: 230, size: 1.2, isFound: false},
			{x_pos: 5645, y_pos: 230, size: 1.2, isFound: false},
			{x_pos: 5820, y_pos: 230, size: 1.2, isFound: false},
			{x_pos: 5900, y_pos: 230, size: 1.2, isFound: false},

			{x_pos: 5820, y_pos: 350, size: 1.2, isFound: false},
			{x_pos: 5900, y_pos: 350, size: 1.2, isFound: false},
			{x_pos: 5980, y_pos: 350, size: 1.2, isFound: false},
		];

	// Array for deciding x position of bubbles in canyon
	bubbleX = [];
	for (var i = 0; i <= 100; i++)
	{
		bubbleX.push(Math.random());
	}

	// Initialise array - canyons.
	canyons =
		[
			{x_pos: -450, width: 550},
			{x_pos: 1200, width: 120},
			{x_pos: 1900, width: 150},
			{x_pos: 3480, width: 450},
			{x_pos: 4200, width: 120},
			{x_pos: 5400, width: 500}
		];

	// Add platforms
	platforms = [];
	platforms.push(createPlatforms(720, floorPos_y - 100, 190));
	platforms.push(createPlatforms(2550, floorPos_y - 100, 400));
	platforms.push(createPlatforms(3380, floorPos_y - 100, 420));
	platforms.push(createPlatforms(3750, floorPos_y - 30, 150));
	platforms.push(createPlatforms(5340, floorPos_y - 100, 200));
	platforms.push(createPlatforms(5480, floorPos_y - 180, 450));
	platforms.push(createPlatforms(5800, floorPos_y - 60, 200));

	// Add enemies
	enemies = [];
	enemies.push(new Enemy(900, floorPos_y, 120));
	enemies.push(new Enemy(2750, floorPos_y, 250));
	enemies.push(new Enemy(3750, floorPos_y - 30, 100));
	enemies.push(new Enemy(4630, floorPos_y, 100));
	enemies.push(new Enemy(5050, floorPos_y, 100));
	enemies.push(new Enemy(5650, floorPos_y - 180, 100));

	game_score = 0;
	flagpole = {isReached: false, x_pos: 6800};
}

