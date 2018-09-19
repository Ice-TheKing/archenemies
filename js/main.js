"use strict";

var app = app || {};

app.main = {
    WIDTH : 1200, 
    HEIGHT: 600,
    gameState: undefined,
    canvas: undefined,
    ctx: undefined,
    animationID: 0,
    lastTime: 0,
    deltaTime: 0,
    paused: false,
    Emitter: undefined,
    sound: undefined,
    sparkle: undefined,
    
    numArcherSquads: 3,
    archerXOffset: 100,
    archersPerSquad: 5,
    archerSpacing: 18,
    squadSpacing: 120,
    archerVertSpacing: 7,
    activeSquad: -1, // -1 if no squad is active
    
    archerHealth: 2.5,
    
    archerSquads: [], // an array that holds the squads of archers (an array of archer arrays)
    
    bowIcons: [],
    bowIconRadius: 20,
    bowVector: [],
    bowCooldown: 5,
    
    arrows: [],
    arrowSpeed: 9,
    
    deadArrows: [],
    
    collisionRadius: 6,
    
    gravity: -0.08,
    
    // swordsman variables
    swordsmen: [],
    swordsmanSpeed: 1,
    spawnTimer: 3,
    spawnRate: 5,
    spawnAmountPerWave: 4,
    
    // mouse variables
    mouseDrag: false,
    originx: 0,
    originy: 0,
    mousex: 0,
    mousey: 0,
    
    backgroundImg: new Image(),
    bowImg: new Image(),
    bowReadyImg: new Image(),
    archerImg: new Image(),
    swordsmanImg: new Image(),
    arrowImg: new Image(),
    
    // sound variables
    bowSound: "bowSound.mp3",
    hitSound: "hitSound1.mp3",
    
    // copied variables
    spawnRateCopy:0,
    swordsmanSpeedcopy:0,
    bowCooldowncopy:0,
    
    GAME_STATE: Object.freeze({ // fake enum
        MAIN_MENU: 0,
        PLAY_GAME: 1,
        INSTRUCTIONS: 2,
        GAME_OVER: 3,
    }),
    
	init : function() {
        this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
        
        this.canvas.onmousedown = this.mouseDown.bind(this);
        this.canvas.onmousemove = this.mouseMove.bind(this);
        this.canvas.onmouseup = this.mouseUp.bind(this);
        this.canvas.onmouseout = this.mouseOut.bind(this);
        
        // set up variable copies
        this.spawnRateCopy = this.spawnRate;
        this.swordsmanSpeedcopy = this.swordsmanSpeed;
        this.bowCooldowncopy = this.bowCooldown;
        
        // setup images and particles
        this.setupParticles();
        this.imgSetup();
        
        this.gameState = this.GAME_STATE.MAIN_MENU;
        this.setMenu();
        
        // start update
        this.update();
        
        // start audio
        // this.sound.playSound("backgroundMusic.mp3");
        this.sound.playBGAudio();
    },
    
    imgSetup: function() {
        this.backgroundImg.src = 'media/background.png';
        this.bowImg.src = 'media/bow.png';
        this.bowReadyImg.src = 'media/bowReady.png';
        this.archerImg.src = 'media/hero.png';
        this.swordsmanImg.src = 'media/enemy.png';
        this.arrowImg.src = 'media/arrow.png'
    },
    
    update : function() {
        //requestAnimationFrame(this.update);
        this.animationID = requestAnimationFrame(this.update.bind(this));
        
        // find deltatime
        var dt = this.calculateDeltaTime();
        this.deltaTime = dt;
        
        // clear the canvas
		this.ctx.clearRect(0,0,this.WIDTH,this.HEIGHT);
        
        // always draw these for every menu
        this.drawBackground();
        // if this is the menu draw particles. I do it here instead of in menu update so particles draw behind everything
        if(this.gameState == this.GAME_STATE.MAIN_MENU)
            this.sparkle.updateAndDraw(this.ctx, {x:850,y:160});
        this.drawDeadArrows();
        this.drawArchers();
        this.drawSwordsmen();
        this.drawBowIcons();
        this.drawBowLines();
        this.drawArrows();
        if(!this.paused){
            this.updateArrows();
            this.updateSwordsmen();
        }
        
        if(this.gameState == this.GAME_STATE.MAIN_MENU) {
            this.menuUpdate();
        }
        else if (this.gameState == this.GAME_STATE.PLAY_GAME) {
            this.gameUpdate();
        }
        if(this.gameState == this.GAME_STATE.GAME_OVER) {
            this.gameOverUpdate();
        }
    },
    
    gameUpdate: function() {
        this.spawnUpdate();
        
        // check for cheats
        this.cheats();
        
        var archersAlive = false;
        for(var i = 0; i < this.archerSquads.length; i++) {
            for(var j = 0; j < this.archerSquads[i].length; j++) {
                if(this.archerSquads[i][j].draw != undefined)
                    archersAlive = true;
                // basically if any single one archer is alive, then we keep playing
            }
        }
        
        if(archersAlive == false) {
            // not a single archer is alive
            this.gameState = this.GAME_STATE.GAME_OVER;
            // make the bow radius really big so you click anywhere and it restarts game
            this.bowIconRadius = 1000;
        }
        
        if(this.paused) {
            this.ctx.save();
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            DrawText(this.ctx, "~ Paused ~", this.WIDTH/2 + 20, this.HEIGHT/2, "72pt Chicle", "black");
            this.ctx.restore();
        }
    },
    
    gameOverUpdate: function() {
        this.ctx.save();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        
        DrawText(this.ctx, "You let everyone die", this.WIDTH/2, this.HEIGHT/2, "36pt Chicle", "black");
        DrawText(this.ctx, "Click to restart game", this.WIDTH/2, this.HEIGHT/2 + 50, "16pt Chicle", "black");
        
        this.ctx.restore();
        
        if(this.mouseDrag) {
            this.mouseDrag = false;
            // reset to main menu
            this.gameState = this.GAME_STATE.MAIN_MENU;
            this.setMenu();
            this.bowIconRadius = 20;
        }
    },
    
    menuUpdate: function () {
        // draw the menus
        this.ctx.save();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        
        if(this.swordsmen[0].deathTimer == undefined) {
            DrawText(this.ctx, "Shoot The Swordsman To Begin...", this.WIDTH/2+20, this.HEIGHT/2, "30pt Chicle", "black");
            DrawText(this.ctx, "Click and drag the glowing bow", this.WIDTH/2, this.HEIGHT/2 + 50, "16pt Chicle", "black");
        }
        
        this.ctx.restore();
        
        if(false) {
            this.gameState = this.GAME_STATE.PLAY_GAME;
            this.setGame();
        }
    },
    
    setMenu: function() {
        // reset array
        this.archerSquads = [];
        this.bowIcons = [];
        this.swordsmen = [];
        this.arrows = [];
        this.deadArrows = [];
        
        /* MAKE A NEW ARCHER FOR MENU */
        var menuArcherSquad = []; // Need this based on how archersquads is set up. Just an array of one archer
        var menuArcher = {};
        menuArcher.x = 950;
        menuArcher.y = 200;
        menuArcher.draw = function() {
            /*app.main.ctx.save();
            app.main.ctx.fillStyle = "purple";
            app.main.ctx.fillRect(this.x, this.y, 160, 300);
            app.main.ctx.restore();*/
            app.main.ctx.drawImage(app.main.archerImg, this.x-110, this.y-60, 360, 360);
        };
        menuArcher.fire = function() {
            var newArrow = {};
            newArrow.x = this.x;
            newArrow.y = this.y;
            newArrow.xVelocity = app.main.bowVector[0] * app.main.arrowSpeed * 4; // 5 times as fast since we're zoomed in in menu
            newArrow.yVelocity = app.main.bowVector[1] * app.main.arrowSpeed * 4; 
            
            // randomize xVelocity and yVelocity a little bit
            newArrow.xVelocity += Random(-0.5, 1);
            newArrow.yVelocity += Random(-0.25, 0.5);
            
            // set the spot where the arrow will hit the groun
            newArrow.endY = 9000;
            
            newArrow.draw = function() {
                /*app.main.ctx.save();
                app.main.ctx.fillStyle = "black";
                app.main.ctx.fillRect(this.x, this.y + 70, 10, 10);
                app.main.ctx.restore();*/
                
                app.main.ctx.drawImage(app.main.arrowImg, this.x-8, this.y+40, 64, 64);
            };
            
            newArrow.checkCollision = function() {
                // see if arrow is in the box
                var xMin = 100;
                var xMax = 260;
                var yMin = 100;
                var yMax = 400;
                
                if(this.x < xMax && this.x+10 > xMin && this.y < yMax && this.y > yMin) {
                    // colliding
                    menuSwordsman.death();
                    
                    // delete the arrow. Problem is, the arrows don't know what they are in the array. So let's just
                    // disable the draw and collision methods, so they still remove themselves once they hit the bottom of the screen
                    // but aren't drawn or collide
                    this.checkCollision = function() {};
                    this.draw = function() {};
                }
            };
            
            app.main.arrows.push(newArrow);
            
            // play sound effect
            app.main.sound.playSound(app.main.bowSound);
        };
        
        menuArcherSquad.push(menuArcher);
        this.archerSquads.push(menuArcherSquad);
        
        /* MAKE A NEW BOW ICON FOR MENU */
        var newBow = {};
        newBow.x = 840;
        newBow.y = 150;
        newBow.cooldownTimer = this.bowCooldown;
        this.bowIcons.push(newBow);
        
        /* MAKE A SWORDSMAN FOR MENU */
        var menuSwordsman = {};
        menuSwordsman.x = 100;
        menuSwordsman.y = 200;
        menuSwordsman.animating = false;
        menuSwordsman.frameCounter = 0;
        menuSwordsman.frames = {
            frame0: new Image(),
            frame1: new Image(),
            frame2: new Image(),
            frame3: new Image(),
            frame4: new Image(),
            frame5: new Image(),
            frame6: new Image(),
            frame7: new Image()
        };
        
        menuSwordsman.draw = function() {
            // setup first image since we need it before dude dies
            if(this.frames.frame0.src == '')
                this.frames.frame0.src = 'media/anim/0.png';
                
            
            /*app.main.ctx.save();
            app.main.ctx.fillStyle = "blue";
            if(this.deathTimer != undefined) {
                app.main.ctx.fillStyle = "red";
            }
            app.main.ctx.fillRect(this.x, this.y, 160, 300);
            app.main.ctx.restore();*/
            if(!this.animating)
                app.main.ctx.drawImage(this.frames.frame0, this.x-160, this.y-50, 400, 400);
            else {
                // pick the right frame
                // if statement galore. Will find a better way to do this later
                if(this.deathTimer < 0.3125)
                    app.main.ctx.drawImage(this.frames.frame1, this.x-160, this.y-50, 400, 400);
                else if(this.deathTimer < (0.3125 * 2))
                    app.main.ctx.drawImage(this.frames.frame2, this.x-160, this.y-50, 400, 400);
                else if(this.deathTimer < (0.3125 * 3))
                    app.main.ctx.drawImage(this.frames.frame3, this.x-160, this.y-50, 400, 400);
                else if(this.deathTimer < (0.3125 * 4))
                    app.main.ctx.drawImage(this.frames.frame4, this.x-160, this.y-50, 400, 400);
                else if(this.deathTimer < (0.3125 * 5))
                    app.main.ctx.drawImage(this.frames.frame5, this.x-160, this.y-50, 400, 400);
                else if(this.deathTimer < (0.3125 * 6))
                    app.main.ctx.drawImage(this.frames.frame6, this.x-160, this.y-50, 400, 400);
                else if(this.deathTimer < (0.3125 * 7))
                    app.main.ctx.drawImage(this.frames.frame7, this.x-160, this.y-50, 400, 400);
                else
                    app.main.ctx.drawImage(this.frames.frame7, this.x-160, this.y-50, 400, 400);
            }
        };
        menuSwordsman.death = function() {
            // set timer
            if(this.deathTimer == undefined) this.deathTimer = 0;
            
            // play the hit sound
            app.main.sound.playSound(app.main.hitSound);
            
            // set up src
            this.frames.frame0.src = 'media/anim/0.png';
            this.frames.frame1.src = 'media/anim/1.png';
            this.frames.frame2.src = 'media/anim/2.png';
            this.frames.frame3.src = 'media/anim/3.png';
            this.frames.frame4.src = 'media/anim/4.png';
            this.frames.frame5.src = 'media/anim/5.png';
            this.frames.frame6.src = 'media/anim/6.png';
            this.frames.frame7.src = 'media/anim/7.png';
            // gotta change images every 0.3125 seconds
            this.animating = true;
        };
        menuSwordsman.update = function() {
            // don't move for the menu swordsman
            if(this.deathTimer != undefined) {
                this.deathTimer += app.main.deltaTime;
                
                if(this.deathTimer > 2.5) {
                    app.main.mouseDrag = false;
                    app.main.setGame();
                    app.main.gameState = app.main.GAME_STATE.PLAY_GAME;
                }
            }
        };
        
        this.swordsmen.push(menuSwordsman);
    },
    
    setGame : function() {
        // reset copied variables
        this.spawnRate = this.spawnRateCopy;
        this.swordsmanSpeed = this.swordsmanSpeedcopy;
        this.bowCooldown = this.bowCooldowncopy;
        
        // set everything based on the user's settings
        this.spawnRate = document.getElementById('spawnRate').value;
        
        if(document.getElementById('squadsNum2').checked) {
            this.numArcherSquads = 2;
        }
        else if(document.getElementById('squadsNum3').checked) {
            this.numArcherSquads = 3;
        }
        else if(document.getElementById('squadsNum4').checked) {
            this.numArcherSquads = 4;
        }
        
        if(document.getElementById('archerNum4').checked) {
            this.archersPerSquad = 4;
        }
        else if(document.getElementById('archerNum5').checked) {
            this.archersPerSquad = 5;
        }
        else if(document.getElementById('archerNum6').checked) {
            this.archersPerSquad = 6;
        }
        
        this.gameState = this.GAME_STATE.MAIN_MENU;
        this.archerSquads = [];
        this.bowIcons = [];
        this.swordsmen = [];
        this.arrows = [];
        
        this.setArchers(); // set the archers up
        this.setBowIcons();
    },
    
    setArchers : function() {
        this.ctx.fillStyle = "green";
        this.ctx.strokeStyle = "green";
        
        // for each squad we're supposed to make
        for(var i = 0; i < this.numArcherSquads; i++) {
            // create an empty array to hold all the archer objects we are about to create
            var currentArcherSquad = [];
            
            for(var j = 0; j < this.archersPerSquad; j++) {
                // make a new archer
                var currentArcher = {};
                currentArcher.x = (
                    750 + /* Base Pos */
                    -this.archerXOffset +/* offset */
                    (i*this.squadSpacing) + /* Squad Seperation */
                    (j*this.archerSpacing) /* Archer Seperation */
                );
                
                currentArcher.y = (
                    470 + /* Base Pos */
                    (j*this.archerVertSpacing) /* Vertical Seperation */
                );
                
                currentArcher.health = this.archerHealth;
                
                currentArcher.draw = function() {
                    /*app.main.ctx.save();
                    app.main.ctx.fillStyle = "purple";
                    app.main.ctx.fillRect(this.x, this.y, 12, 32);
                    app.main.ctx.restore();*/
                    
                    app.main.ctx.drawImage(app.main.archerImg, this.x-2, this.y-9, 48, 48);
                };
                
                currentArcher.fire = function() {
                    var newArrow = {};
                    newArrow.x = this.x;
                    newArrow.y = this.y+10;
                    newArrow.xVelocity = app.main.bowVector[0] * app.main.arrowSpeed;
                    newArrow.yVelocity = app.main.bowVector[1] * app.main.arrowSpeed;
                    
                    // randomize xVelocity and yVelocity a little bit
                    newArrow.xVelocity += Random(-0.5, 1);
                    newArrow.yVelocity += Random(-0.25, 0.5);
                    
                    newArrow.endY = this.y - Random(30, -50);
                    
                    newArrow.draw = function() {
                        /*app.main.ctx.save();
                        app.main.ctx.beginPath();
                        app.main.ctx.fillStyle = "black";
                        app.main.ctx.arc(this.x, this.y, app.main.collisionRadius / 2.5, 2 * Math.PI, false);
                        app.main.ctx.fill();
                        app.main.ctx.closePath();
                        app.main.ctx.restore();*/
                        
                        // find the angle its at
                        var rad = Math.atan2(this.xVelocity, this.yVelocity);
                        rad = -rad;
                        rad -= Math.PI/2;
                        app.main.ctx.translate(this.x, this.y); // move it to the center
                        app.main.ctx.rotate(rad);
                        app.main.ctx.drawImage(app.main.arrowImg, -2, -9, 16, 16);
                        app.main.ctx.rotate(-rad);
                        app.main.ctx.translate(-(this.x), -(this.y));
                        
                        // draw arrow
                        // app.main.ctx.drawImage(app.main.arrowImg, this.x-2, this.y-9, 16, 16);
                    };
                    
                    newArrow.checkCollision = function() {
                        for(var i = 0; i < app.main.swordsmen.length; i++) {
                            var swordsman = app.main.swordsmen[i]; // shorthand
                            // check distance
                            // we add to swordsman height and width because we want to center the collision
                            var distanceVector = findVector(this.x, this.y, swordsman.x + 6, swordsman.y + 16);
                            var magnitude = Magnitude(distanceVector[0], distanceVector[1]);
                            if(magnitude < app.main.collisionRadius * 2) { // 2 times the collision radius to account for the swordsmen hitbox
                                // colliding
                                // set both draws to undefined, so they are cleaned up in update
                                swordsman.draw = undefined;
                                this.draw = undefined;
                            }
                        }
                    };
                    
                    app.main.arrows.push(newArrow);
                    
                    // play sound effect
                    app.main.sound.playSound(app.main.bowSound);
                };
                
                // add archer to current array
                currentArcherSquad.push(currentArcher);
                
            } // end archersPerSquad
            
            // add the current array to the array of archers
            this.archerSquads.push(currentArcherSquad);
            
        } // end archerSquads
        
    }, // end drawArchers
    
    setBowIcons: function() {
        for(var i = 0; i < this.archerSquads.length; i++) {
            // find average x pos
            var averagex = 0;
            var archersInSquad = 0;
            for(var j = 0; j < this.archerSquads[i].length; j++) {
                averagex += this.archerSquads[i][j].x;
                archersInSquad += 1;
            }
            averagex /= archersInSquad;
            
            // make a new object for the bow
            var newBow = {};
            newBow.x = averagex;
            newBow.y = 450;
            newBow.cooldownTimer = this.bowCooldown;
            // add cooldown timers and stuff here
            
            // add to array of bow icons
            this.bowIcons.push(newBow);
        }
    },
    
    drawBackground: function() {
        this.ctx.drawImage(this.backgroundImg, 0, 0, this.WIDTH, this.HEIGHT);
    },
    
    drawArchers: function() {
        for(var i = 0; i < this.archerSquads.length; i++) { // loop through each squad
            for(var j = 0; j < this.archerSquads[i].length; j++) { // loop through each archer in i squad
                var thisArcher = this.archerSquads[i][j]; // shorthand
                // check if archer is dead
                if(thisArcher.health < 0) {
                    thisArcher.draw = undefined; // this is death
                }
                
                // if draw is undefined, archer is dead
                if(thisArcher.draw == undefined) {
                    this.archerSquads[i].splice(j, 1);
                    j--;
                    continue;
                }
                   
                thisArcher.draw();
            }
        }
    },
    
    drawSwordsmen: function() {
        for(var i = 0; i < this.swordsmen.length; i++) { // loop through each swordsman
            this.swordsmen[i].draw();
        }
    },
    
    drawBowIcons: function() {
        for(var i = 0; i < this.bowIcons.length; i++) {
            // draw icon
            var icon = new Image();
            
            if(this.bowIcons[i].cooldownTimer > this.bowCooldown) { // ready to fire
                icon.src = this.bowReadyImg.src;
            }
            else { // not ready
                icon.src = this.bowImg.src;
            }
            
            // only draw if there's archers left in that squad
            if(this.archerSquads[i].length != 0)
                this.ctx.drawImage(icon, this.bowIcons[i].x-36, this.bowIcons[i].y-30, 64, 64);
            
            // incriment the bow timer if not paused
            if(!this.paused)
                this.bowIcons[i].cooldownTimer += this.deltaTime;
        }
    },
    
    drawBowLines: function() {
        if(this.mouseDrag) {
            this.ctx.beginPath();
            this.ctx.save();
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 2;
            
            this.ctx.moveTo(this.originx, this.originy);
            this.ctx.lineTo(this.mousex, this.mousey);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    },
    
    drawArrows: function() {
        for(var i = 0; i < this.arrows.length; i++) {
            if(this.arrows[i].draw == undefined) {
                this.arrows.splice(i, 1);
                i--;
                continue;
            }
            this.arrows[i].draw();
        }
    },
    
    drawDeadArrows: function() {
        for(var i = 0; i < this.deadArrows.length; i++) {
            this.deadArrows[i].draw();
        }
    },
    
    fireArrows: function() {
        var squadNum = this.activeSquad;
        
        for(var i = 0; i < this.archerSquads[squadNum].length; i++) {
            this.archerSquads[squadNum][i].fire();
        }
        
        // no squad is active any more
        this.activeSquad = -1;
    },
    
    updateArrows: function() {
        for(var i = 0; i < this.arrows.length; i++) {
            // check to see if arrow is undefined
            if(this.arrows[i].draw == undefined) {
                this.arrows.splice(i, 1);
                i--;
                continue;
            }
            
            // check to see if the current arrow is at its lowest point
            if(this.arrows[i].y > this.arrows[i].endY) {
                // add arrow to the dead arrows
                this.deadArrows.push(this.arrows[i]);
                
                // remove it from live arrows
                this.arrows.splice(i, 1);
                i--;
                continue;
            }
            
            // move arrow
            this.arrows[i].x += this.arrows[i].xVelocity * this.deltaTime * 60;
            this.arrows[i].y += this.arrows[i].yVelocity * this.deltaTime * 60;
            // subtract gravity from the arrow
            this.arrows[i].yVelocity -= this.gravity * this.deltaTime * 60;
            
            // check for collisions
            this.arrows[i].checkCollision();
            
            
            if(this.arrows[i].y > 1000) { // remove arrow once its gone
                this.arrows.splice(i, 1);
                i--; // loop through the same index again since we just spliced
            }
        }
    },
    
    updateSwordsmen: function() {
        for(var i = 0; i < this.swordsmen.length; i++) {
            // check if the swordsman is dead
            if(this.swordsmen[i].draw == undefined) {
                this.swordsmen.splice(i, 1);
                i--;
                
                // play death sound
                app.main.sound.playSound(app.main.hitSound);
                
                continue;
            }
            this.swordsmen[i].update();
        }
    },
    
    spawnUpdate: function() {
        // incriment spawn timer if not paused
        if(!this.paused)
            this.spawnTimer += this.deltaTime;
        
        if(this.spawnTimer > this.spawnRate) {
            for(var i = 0; i < this.spawnAmountPerWave; i++) {
                // spawn a swordsman off the screen to the left and randomize it's x and y a bit
                var newSwordsman = {};
                newSwordsman.x = -200;
                newSwordsman.y = 465;
                
                newSwordsman.speed = this.swordsmanSpeed;
                
                newSwordsman.x += Random(-100, 120);
                newSwordsman.y += Random(0, 60);
                newSwordsman.colliding = false;
                
                newSwordsman.draw = function() {
                    /*app.main.ctx.save();
                    app.main.ctx.fillStyle = "blue";
                    app.main.ctx.fillRect(this.x, this.y, 12, 32);
                    app.main.ctx.restore();*/
                    
                    app.main.ctx.drawImage(app.main.swordsmanImg, this.x-20, this.y-9, 48, 48);
                }
                
                newSwordsman.death = function() {
                    // don't draw anymore. Will get cleaned up by updateswordsmen call
                    // can't remove it from array cause we don't know where this is in the array
                    this.draw = undefined;
                    
                }
                
                newSwordsman.update = function() {
                    if(!this.colliding) {
                        this.x += this.speed * app.main.deltaTime * 60;
                    }
                    
                    // reset colliding to check again
                    this.colliding = false;
                    
                    // check if you are colliding with an archer
                    for(var i = 0; i < app.main.archerSquads.length; i++) {
                        for(var j = 0; j < app.main.archerSquads[i].length; j++) {
                            var currentArcher = app.main.archerSquads[i][j]; // shorthand
                            if(Math.abs(this.x - currentArcher.x) < 10) {
                                // colliding
                                this.colliding = true;
                                
                                // decrease the health of the archer
                                currentArcher.health -= app.main.deltaTime;
                            }
                        }
                    }
                }
                
                this.swordsmen.push(newSwordsman);
            }
            
            // reset timer
            this.spawnTimer = 0;
        }
    },
    
    mouseDown: function(e) {
        // check if user is clicking on a bow icon
        this.mouseDrag = false;
        var mouse = getMouse(e);
        
        for(var i = 0; i < this.bowIcons.length; i++) {
            // find distance between mouse and current icon center
            var distance = Math.sqrt( (Math.pow((this.mousex - this.bowIcons[i].x), 2)) + Math.pow((this.mousey - this.bowIcons[i].y), 2) );
            if(distance <= this.bowIconRadius) {
                // in the circle
                this.mouseDrag = true;
                this.activeSquad = i; // set active squad to the position in the squad array that we're at
            }
        }
        
        if(this.mouseDrag) {
            this.originx = this.mousex;
            this.originy = this.mousey;
        }        
    },
    
    mouseMove: function(e) {        
        if(!this.mouseDrag)
            return;
        
        var mouse = getMouse(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.originx, this.originy);
        this.ctx.lineTo(this.mousex, this.mousey);
        this.ctx.stroke();
    },
    
    mouseUp: function(e) {
        if(!this.mouseDrag) { // if we're not actually mouse dragging return from function
            return;
        }
        
        // no longer dragging
        this.mouseDrag = false;

        // save vector and fire arrows in that squad'
        
        // vector is an array ~ [xComponent, yComponent]
        var vector = findVector(this.originx, this.originy, this.mousex, this.mousey);
        
        vector = Normalize(vector);
        
        this.bowVector = vector;
        
        if(this.bowIcons[this.activeSquad].cooldownTimer > this.bowCooldown) {
            var num = this.activeSquad;
            this.fireArrows();
            this.bowIcons[num].cooldownTimer = 0; // reset timer
        }
    },
    
    mouseOut: function(e) {
        if(!this.mouseDrag) {
            return;
        }
        
        this.mouseDrag = false;
    },
    
    findOriginMouseVector() {
        var xComponent = this.mousex - this.originx;
        var yComponent = this.mousey - this.originy;
        // var magnitude = Math.sqrt((xComponent * xComponent) + (yComponent * yComponent));
        var magnitude = Magnitude(xComponent, yComponent);
        
        // in case
        if(magnitude == 0)
            return [0,0];
        
        xComponent /= magnitude;
        yComponent /= magnitude;
        
        return [xComponent, yComponent];
    },
    
    calculateDeltaTime: function(){
		var now,fps;
		now = performance.now(); 
		fps = 1000 / (now - this.lastTime);
		fps = Math.max(12, Math.min(60, fps));
		this.lastTime = now; 
		return 1/fps;
	},
    
    cheats: function() {
        if(myKeys.keydown[17] && myKeys.keydown[32]) { // 17 is ctrl and 32 is space
            // activate cheats
            this.spawnRate = 1;
            this.swordsmanSpeed = 4;
            this.bowCooldown = 0;
        }
    },
    
    setupParticles: function() {
        this.sparkle = new this.Emitter();
        this.sparkle.red = 255;
        this.sparkle.blue = 255;
        this.sparkle.green = 255;
        this.sparkle.minXspeed = this.sparkle.minYspeed = -0.25;
        this.sparkle.maxXspeed = this.sparkle.maxYspeed = 0.25;
        this.sparkle.lifetime = 500;
        this.sparkle.expansionRate = 0.1;
        this.sparkle.numParticles = 400;
        this.sparkle.xRange=1;
        this.sparkle.yRange=1;
        this.sparkle.useCircles = false;
        this.sparkle.useSquares = true;
        this.sparkle.createParticles({x:0,y:-1000}); // make them offscreen so they dont just appear randomly on the screen
    },
    
    pauseGame: function() {
        this.paused = true;
        cancelAnimationFrame(this.animationID);
        this.update();
    },
    
    resumeGame: function() {
        this.paused = false;
        cancelAnimationFrame(this.animationID);
        
        this.update();
    },
}; // end app.main