// Main IIFE (Immediately Invoked Function Expression) wrapping the game logic
(function (window) {
    // Game object to hold all game-related functions and variables
    var Game = {
      // Initialization function, sets up the canvas, game state, and entities
      init: function () {
        this.c = document.getElementById("game"); // Reference to the canvas element
        this.c.width = this.c.width; // Reset canvas width
        this.c.height = this.c.height; // Reset canvas height
        this.ctx = this.c.getContext("2d"); // Get canvas context for drawing
        this.color = "rgba(20,20,20,.7)"; // Background color for clearing canvas
        
        // Game state variables
        this.bullets = []; // Player bullets
        this.enemyBullets = []; // Enemy bullets
        this.enemies = []; // Enemies
        this.particles = []; // Explosion particles
        this.bulletIndex = 0; // Index for tracking player bullets
        this.enemyBulletIndex = 0; // Index for tracking enemy bullets
        this.enemyIndex = 0; // Index for tracking enemies
        this.particleIndex = 0; // Index for tracking particles
        this.maxParticles = 10; // Maximum particles per explosion
        this.maxEnemies = 6; // Maximum enemies on screen
        this.enemiesAlive = 0; // Count of active enemies
        this.currentFrame = 0; // Frame counter for animations
        this.maxLives = 3; // Maximum player lives
        this.life = 0; // Current life count
  
        // Input and game state bindings
        this.binding();
  
        // Create player instance
        this.player = new Player();
        this.score = 0; // Player score
        this.paused = false; // Pause state
        this.shooting = false; // Shooting state
        this.oneShot = false; // Prevent holding spacebar to spam bullets
        this.isGameOver = false; // Game over state
  
        // Setup requestAnimationFrame for smooth animations
        this.requestAnimationFrame =
          window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame;
  
        // Spawn initial enemies
        for (var i = 0; i < this.maxEnemies; i++) {
          new Enemy();
          this.enemiesAlive++;
        }
  
        // Activate invincibility mode for player briefly at start
        this.invincibleMode(2000);
  
        // Start the game loop
        this.loop();
      },
  
      // Binds keyboard and mouse input events to game actions
      binding: function () {
        window.addEventListener("keydown", this.buttonDown);
        window.addEventListener("keyup", this.buttonUp);
        window.addEventListener("keypress", this.keyPressed);
        this.c.addEventListener("click", this.clicked);
      },
  
      // Handles canvas click event (pause and restart logic)
      clicked: function () {
        if (!Game.paused) {
          Game.pause();
        } else {
          if (Game.isGameOver) {
            Game.init(); // Restart the game
          } else {
            Game.unPause();
            Game.loop();
            Game.invincibleMode(1000); // Brief invincibility after unpause
          }
        }
      },
  
      // Handles spacebar press for shooting or restarting game
      keyPressed: function (e) {
        if (e.keyCode === 32) { // Spacebar
          if (!Game.player.invincible && !Game.oneShot) {
            Game.player.shoot();
            Game.oneShot = true;
          }
          if (Game.isGameOver) {
            Game.init();
          }
          e.preventDefault();
        }
      },
  
      // Handles key release for stopping movement/shooting
      buttonUp: function (e) {
        if (e.keyCode === 32) {
          Game.shooting = false;
          Game.oneShot = false;
          e.preventDefault();
        }
        if (e.keyCode === 37 || e.keyCode === 65) { // Left arrow or A
          Game.player.movingLeft = false;
        }
        if (e.keyCode === 39 || e.keyCode === 68) { // Right arrow or D
          Game.player.movingRight = false;
        }
      },
  
      // Handles key press for initiating movement or shooting
      buttonDown: function (e) {
        if (e.keyCode === 32) {
          Game.shooting = true;
        }
        if (e.keyCode === 37 || e.keyCode === 65) {
          Game.player.movingLeft = true;
        }
        if (e.keyCode === 39 || e.keyCode === 68) {
          Game.player.movingRight = true;
        }
      },
  
      // Generates a random number between min and max
      random: function (min, max) {
        return Math.floor(Math.random() * (max - min) + min);
      },
  
      // Enables player invincibility for a specified duration
      invincibleMode: function (s) {
        this.player.invincible = true;
        setTimeout(function () {
          Game.player.invincible = false;
        }, s);
      },
  
      // Checks for collision between two rectangular objects
      collision: function (a, b) {
        return !(
          a.y + a.height < b.y ||
          a.y > b.y + b.height ||
          a.x + a.width < b.x ||
          a.x > b.x + b.width
        );
      },
  
      // Clears the canvas
      clear: function () {
        this.ctx.fillStyle = Game.color;
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);
      },
  
      // Pauses the game
      pause: function () {
        this.paused = true;
      },
  
      // Resumes the game
      unPause: function () {
        this.paused = false;
      },
  
      // Handles game over logic, displays the game over screen
      gameOver: function () {
        this.isGameOver = true;
        this.clear();
        var message = "Game Over";
        var message2 = "Score: " + Game.score;
        var message3 = "Click or press Spacebar to Play Again";
        this.pause();
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 30px Lato, sans-serif";
        this.ctx.fillText(
          message,
          this.c.width / 2 - this.ctx.measureText(message).width / 2,
          this.c.height / 2 - 50
        );
        this.ctx.fillText(
          message2,
          this.c.width / 2 - this.ctx.measureText(message2).width / 2,
          this.c.height / 2 - 5
        );
        this.ctx.font = "bold 16px Lato, sans-serif";
        this.ctx.fillText(
          message3,
          this.c.width / 2 - this.ctx.measureText(message3).width / 2,
          this.c.height / 2 + 30
        );
      },
  
      // Updates the player's score and lives on the canvas
      updateScore: function () {
        this.ctx.fillStyle = "white";
        this.ctx.font = "16px Lato, sans-serif";
        this.ctx.fillText("Score: " + this.score, 8, 20);
        this.ctx.fillText("Lives: " + (this.maxLives - this.life), 8, 40);
      },
  
      // Main game loop, handles updates and rendering
      loop: function () {
        if (!Game.paused) {
          Game.clear();
  
          // Update and draw enemies
          for (var i in Game.enemies) {
            var currentEnemy = Game.enemies[i];
            currentEnemy.draw();
            currentEnemy.update();
            if (Game.currentFrame % currentEnemy.shootingSpeed === 0) {
              currentEnemy.shoot();
            }
          }
  
          // Update and draw enemy bullets
          for (var x in Game.enemyBullets) {
            Game.enemyBullets[x].draw();
            Game.enemyBullets[x].update();
          }
  
          // Update and draw player bullets
          for (var z in Game.bullets) {
            Game.bullets[z].draw();
            Game.bullets[z].update();
          }
  
          // Handle player drawing and invincibility blinking
          if (Game.player.invincible) {
            if (Game.currentFrame % 20 === 0) {
              Game.player.draw();
            }
          } else {
            Game.player.draw();
          }
  
          // Update and draw particles (explosions)
          for (var i in Game.particles) {
            Game.particles[i].draw();
          }
  
          // Update player state and score display
          Game.player.update();
          Game.updateScore();
          Game.currentFrame = Game.requestAnimationFrame.call(window, Game.loop);
        }
      },
    };
  
    // Player class representing the player character
    var Player = function () {
      this.width = 60;
      this.height = 20;
      this.x = Game.c.width / 2 - this.width / 2;
      this.y = Game.c.height - this.height;
      this.movingLeft = false;
      this.movingRight = false;
      this.speed = 8;
      this.invincible = false;
      this.color = "white";
    };
  
    // Player's die method, handles losing lives and game over
    Player.prototype.die = function () {
      if (Game.life < Game.maxLives) {
        Game.invincibleMode(2000); // Brief invincibility after losing a life
        Game.life++;
      } else {
        Game.pause();
        Game.gameOver();
      }
    };
  
    // Draws the player on the canvas
    Player.prototype.draw = function () {
      Game.ctx.fillStyle = this.color;
      Game.ctx.fillRect(this.x, this.y, this.width, this.height);
    };
  
    // Updates the player's position and handles collisions
    Player.prototype.update = function () {
      if (this.movingLeft && this.x > 0) {
        this.x -= this.speed;
      }
      if (this.movingRight && this.x + this.width < Game.c.width) {
        this.x += this.speed;
      }
      if (Game.shooting && Game.currentFrame % 10 === 0) {
        this.shoot();
      }
      for (var i in Game.enemyBullets) {
        var currentBullet = Game.enemyBullets[i];
        if (Game.collision(currentBullet, this) && !Game.player.invincible) {
          this.die();
          delete Game.enemyBullets[i];
        }
      }
    };
  
    // Handles player shooting
    Player.prototype.shoot = function () {
      Game.bullets[Game.bulletIndex] = new Bullet(this.x + this.width / 2);
      Game.bulletIndex++;
    };
  
    // Bullet class representing player bullets
    var Bullet = function (x) {
      this.width = 8;
      this.height = 20;
      this.x = x;
      this.y = Game.c.height - 10;
      this.vy = 8;
      this.index = Game.bulletIndex;
      this.active = true;
      this.color = "white";
    };
  
    // Draws the bullet on the canvas
    Bullet.prototype.draw = function () {
      Game.ctx.fillStyle = this.color;
      Game.ctx.fillRect(this.x, this.y, this.width, this.height);
    };
  
    // Updates the bullet's position
    Bullet.prototype.update = function () {
      this.y -= this.vy;
      if (this.y < 0) {
        delete Game.bullets[this.index];
      }
    };
  
    // Enemy class representing enemies
    var Enemy = function () {
      this.width = 60;
      this.height = 20;
      this.x = Game.random(0, Game.c.width - this.width);
      this.y = Game.random(10, 40);
      this.vy = Game.random(1, 3) * 0.1;
      this.index = Game.enemyIndex;
      Game.enemies[Game.enemyIndex] = this;
      Game.enemyIndex++;
      this.speed = Game.random(2, 3);
      this.shootingSpeed = Game.random(30, 80);
      this.movingLeft = Math.random() < 0.5 ? true : false;
      this.color = "hsl(" + Game.random(0, 360) + ", 60%, 50%)";
    };
  
    // Draws the enemy on the canvas
    Enemy.prototype.draw = function () {
      Game.ctx.fillStyle = this.color;
      Game.ctx.fillRect(this.x, this.y, this.width, this.height);
    };
  
    // Updates enemy position and handles bullet collisions
    Enemy.prototype.update = function () {
      if (this.movingLeft) {
        if (this.x > 0) {
          this.x -= this.speed;
          this.y += this.vy;
        } else {
          this.movingLeft = false;
        }
      } else {
        if (this.x + this.width < Game.c.width) {
          this.x += this.speed;
          this.y += this.vy;
        } else {
          this.movingLeft = true;
        }
      }
  
      for (var i in Game.bullets) {
        var currentBullet = Game.bullets[i];
        if (Game.collision(currentBullet, this)) {
          this.die();
          delete Game.bullets[i];
        }
      }
    };
  
    // Handles enemy death and explosion
    Enemy.prototype.die = function () {
      this.explode();
      delete Game.enemies[this.index];
      Game.score += 15;
      Game.enemiesAlive = Game.enemiesAlive > 1 ? Game.enemiesAlive - 1 : 0;
      if (Game.enemiesAlive < Game.maxEnemies) {
        Game.enemiesAlive++;
        setTimeout(function () {
          new Enemy();
        }, 2000);
      }
    };
  
    // Creates explosion effect for enemy death
    Enemy.prototype.explode = function () {
      for (var i = 0; i < Game.maxParticles; i++) {
        new Particle(this.x + this.width / 2, this.y, this.color);
      }
    };
  
    // Enemy shooting logic
    Enemy.prototype.shoot = function () {
      new EnemyBullet(this.x + this.width / 2, this.y, this.color);
    };
  
    // EnemyBullet class representing bullets fired by enemies
    var EnemyBullet = function (x, y, color) {
      this.width = 8;
      this.height = 20;
      this.x = x;
      this.y = y;
      this.vy = 6;
      this.color = color;
      this.index = Game.enemyBulletIndex;
      Game.enemyBullets[Game.enemyBulletIndex] = this;
      Game.enemyBulletIndex++;
    };
  
    // Draws the enemy bullet on the canvas
    EnemyBullet.prototype.draw = function () {
      Game.ctx.fillStyle = this.color;
      Game.ctx.fillRect(this.x, this.y, this.width, this.height);
    };
  
    // Updates enemy bullet position
    EnemyBullet.prototype.update = function () {
      this.y += this.vy;
      if (this.y > Game.c.height) {
        delete Game.enemyBullets[this.index];
      }
    };
  
    // Particle class for explosion effects
    var Particle = function (x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = Game.random(-5, 5);
      this.vy = Game.random(-5, 5);
      this.color = color || "orange";
      Game.particles[Game.particleIndex] = this;
      this.id = Game.particleIndex;
      Game.particleIndex++;
      this.life = 0;
      this.gravity = 0.05;
      this.size = 40;
      this.maxlife = 100;
    };
  
    // Draws and updates particle position
    Particle.prototype.draw = function () {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.size *= 0.89;
      Game.ctx.fillStyle = this.color;
      Game.ctx.fillRect(this.x, this.y, this.size, this.size);
      this.life++;
      if (this.life >= this.maxlife) {
        delete Game.particles[this.id];
      }
    };
  
    // Start the game
    Game.init();
  })(window);  