(function() { 
	var config = {
		starWidth: .75,
		starHeight: .75,
		starSet: [],
		//tableRows: 10,
		tableRows: 8,
		tableCols: 18,
		baseScore: 10,
		stepScore: 20,
		targetScore: 1000,
		el: document.querySelector('#starList'),
		scoreLevel: document.querySelector('#scoreLevel'),
		scoreTarget: document.querySelector('#scoreTarget'),
		scoreCurrent: document.querySelector('#scoreCurrent'),
		scoreSelect: document.querySelector('#scoreSelect'),
	}; 
	
	var computed = {
		flag: true,
		timer: null,
		tempStar: null,
		choose: [],
		level: parseInt(localStorage.getItem("star_match_level") || "1"),
		score: 0,	
		totalScore: 0,
		stepTargetScore: 500,	
		win: false
	};

	function BlockStar(number, row, col) {
		var star = document.createElement('li');
		star.width = config.starWidth;
		star.height = config.starHeight;
		star.number = number;
		star.row = row;
		star.col = col;
		return star;
	} 

	function CrushGame() {
		return new CrushGame.prototype.init();
	}

	CrushGame.prototype = {
		init: function() {
			this.initTable();
		},
		
		initTable: function() {
			this.initScore();
			this.initStarSet();
			this.initBlockStars();
		},

		initScore: function() {
			new Utils(config.scoreCurrent, computed.totalScore, 0).start();
			if (computed.win) {
				new Utils(config.scoreTarget, config.targetScore, config.targetScore += computed.stepTargetScore).start();
				new Utils(config.scoreLevel, computed.level, computed.level += 1).start();
			} else {
				new Utils(config.scoreTarget, config.targetScore, config.targetScore).start();
				new Utils(config.scoreLevel, computed.level, computed.level).start();
			}
			computed.totalScore = 0;
		},
		
		mouseClick: function() {
			var starSet = config.starSet,
				choose = computed.choose,
				baseScore = config.baseScore,
				stepScore = config.stepScore,
				el = config.el,
				self = this,
				len = choose.length;
			if (!computed.flag || len <= 1) {
				return;
			}
			else{
				config.scoreSelect.style.opacity = '0';
				computed.flag = false;
				computed.tempStar = null;
				var score = 0;
				for (var i = 0; i < len; i++) {
					score += baseScore + i * stepScore; 
				}

				new Utils(config.scoreCurrent, computed.totalScore, computed.totalScore += score).start();
				for (var i = 0; i < len; i++) {
					setTimeout(function(i) {
						starSet[choose[i].row][choose[i].col] = null;
						el.removeChild(choose[i]);
					}, i * 100, i);
				}
				setTimeout(function() {
					self.move();
					setTimeout(function() {
						if (computed.totalScore >= config.targetScore) {	
							self.gameover('win')
							setTimeout(function() {
								self.clear();
							}, 2000);
							computed.flag = true;
							computed.win = true;
						} else {
							if (self.isFinish()) {	
								self.gameover('lose')	
								setTimeout(function() {
									self.clear();
								}, 2000);
								computed.flag = true;
								computed.win = false;
							} else {
							    choose = [];
								computed.flag = true;
								self.mouseOver(computed.tempStar);
							}
						}
					}, 400 + choose.length * 150);
				}, choose.length * 100);
		    }
		},

        gameover: function(winOrLose){
        	var div = document.createElement('div');
        	div.id = 'gameover';
        	div.class = 'gameover';
        	document.getElementById('starCrush').appendChild(div);

        	var msg, next;
        	if(winOrLose == 'win'){
        		msg = 'You Win!';
        		next = 'Loading next level';
        	}else{
        		msg = 'You Loss :(';
        		next = 'Continue with current level';
        	}
        	var p = document.createElement('p');
        	p.id = 'msg';
        	var text = document.createTextNode(msg);
        	p.appendChild(text);
        	document.getElementById('gameover').appendChild(p);	
        	p = document.createElement('p');
        	p.id = 'next';
        	text = document.createTextNode(next);
        	p.appendChild(text);
        	document.getElementById('gameover').appendChild(p);	
        },
		
		clear: function() {
			var starSet = config.starSet,
				rows = starSet.length,
				el = config.el,
				self = this; 
			var temp = [];

			var gameover = document.querySelector('#gameover');
			if (gameover != null) {
				var elGameover = document.getElementById('gameover');
				elGameover.parentNode.removeChild(elGameover);
			}

			for (var i = rows - 1; i >= 0; i--) {
				for (var j = starSet[i].length - 1; j >= 0; j--) {
					if (starSet[i][j] === null) {
						continue;
					}
					temp.push(starSet[i][j])
					starSet[i][j] = null;
				}
			}
			for (var k = 0; k < temp.length; k++) {
				setTimeout(function(k) { 
					el.removeChild(temp[k]);	
						if(k>=temp.length-1){
							setTimeout(function(k) {
								// Save level to localStorage
localStorage.setItem("star_match_level", computed.level);
new CrushGame();
								var event = new CustomEvent("restart", { "detail": "Restart Game" });
        						document.dispatchEvent(event);
							},500) 
						}
				//}, k * 50, k);
				}, k * 20, k);
			}
		},

		/**
		 * @returns {boolean}
		 */
		isFinish: function() {
			var starSet = config.starSet,
				rows = starSet.length;
			for (var i = 0; i < rows; i++) {
				var row = starSet[i].length;
				for (var j = 0; j < row; j++) {
					var temp = [];
					this.checkLink(starSet[i][j], temp);
					if (temp.length > 1) {
						return false;
					}
				}
			}
			return true;
		},
		
		move: function() {
			var rows = config.tableRows,
			    cols = config.tableCols,
				starSet = config.starSet;
				console.log('move starSet: ',starSet)
			//for (var i = 0; i < rows; i++) {
			for (var i = 0; i < cols; i++) {
				var pointer = 0;
				for (var j = 0; j < rows; j++) {
				//for (var j = 0; j < cols; j++) {
					if (starSet[j][i] != null) {
						if (j !== pointer) {
							starSet[pointer][i] = starSet[j][i];
							starSet[j][i].row = pointer;
							starSet[j][i] = null;
						}
						pointer++;
					}
				}
			}
			
			for (var i = 0; i < starSet[0].length;) {
				if (starSet[0][i] == null) {
					for (var j = 0; j < rows; j++) {
					//for (var j = 0; j < cols; j++) {
						starSet[j].splice(i, 1);
					}
					continue;
				}
				i++;
			}
			this.refresh()
		},

		/**
		 * @param obj
		 */
		mouseOver: function(obj) {
			if (!computed.flag) {
				computed.tempStar = obj;
				return;
			}
			this.clearFlicker();
			var choose = [];
			this.checkLink(obj, choose);
			computed.choose = choose;
			if (choose.length <= 1) {
				choose = [];
				return;
			}
			this.flicker(choose);
			this.computeScore(choose);
		},

		/**
		 * @param arr
		 */
		computeScore: function(arr) {
			var score = 0,
				len = arr.length,
				baseScore = config.baseScore,
				stepScore = config.stepScore;
			for (var i = 0; i < len; i++) {
				score += baseScore + i * stepScore
			}
			if (score <= 0) {
				return;
			}
			computed.score = score;
			config.scoreSelect.style.opacity = '1';
			config.scoreSelect.innerHTML = "Crush " + arr.length + " stars to get " + score + " points";
		},
		
		clearFlicker: function() {
			var starSet = config.starSet;
			for (var i = 0; i < starSet.length; i++) {
				for (var j = 0; j < starSet[i].length; j++) {
					var div = starSet[i][j];
					if (div === null) {
						continue;
					}
					div.classList.remove("scale");
				}
			}
		},

		/**
		 * @param arr
		 */
		flicker: function(arr) {
			for (var i = 0; i < arr.length; i++) {
				var div = arr[i];
				div.classList.add("scale");
			}
		},

		/**
		 * @param obj star
		 * @param arr choose
		 */
		checkLink: function(obj, arr) {
			if (obj === null) {
				return;
			}
			arr.push(obj);
			var starSet = config.starSet,
				rows = config.tableRows,
				cols = config.tableCols;
			if (obj.col > 0 && starSet[obj.row][obj.col - 1] && starSet[obj.row][obj.col - 1].number === obj.number && arr.indexOf(
					starSet[obj.row][obj.col - 1]) === -1) {
				this.checkLink(starSet[obj.row][obj.col - 1], arr);
			}
			//if (obj.col < rows - 1 && starSet[obj.row][obj.col + 1] && starSet[obj.row][obj.col + 1].number === obj.number && arr.indexOf(starSet[obj.row][obj.col + 1]) === -1) {
			if (obj.col < cols - 1 && starSet[obj.row][obj.col + 1] && starSet[obj.row][obj.col + 1].number === obj.number &&
				arr.indexOf(starSet[obj.row][obj.col + 1]) === -1) {
				this.checkLink(starSet[obj.row][obj.col + 1], arr);
			}
			if (obj.row < rows - 1 && starSet[obj.row + 1][obj.col] && starSet[obj.row + 1][obj.col].number === obj.number &&
				arr.indexOf(starSet[obj.row + 1][obj.col]) === -1) {
				this.checkLink(starSet[obj.row + 1][obj.col], arr);
			}
			if (obj.row > 0 && starSet[obj.row - 1][obj.col] && starSet[obj.row - 1][obj.col].number === obj.number && arr.indexOf(
					starSet[obj.row - 1][obj.col]) === -1) {
				this.checkLink(starSet[obj.row - 1][obj.col], arr);
			}
		},
		
		initStarSet: function() {
			var rows = config.tableRows,
				arr = config.starSet;
			for (var i = 0; i < rows; i++) {
				arr[i] = [];
				//for (var j = 0; j < rows; j++) {
				for (var j = 0; j < config.tableCols; j++) {
					arr[i][j] = [];
				}
			}
		},
		
		initBlockStars: function() {
			var starSet = config.starSet,
				self = this,
				el = config.el,
				cols = starSet.length;
			computed.flag = true;
			for (var i = 0; i < cols; i++) {
				var rows = starSet[i].length;
				for (var j = 0; j < rows; j++) {
					var star = this.createBlockStar(Math.floor(Math.random() * 5), i, j);
					star.onmouseover = function() {
						self.mouseOver(this)
					};
					star.onclick = function() {
						self.mouseClick();
					};
					 
					starSet[i][j] = star;
					el.appendChild(star);
				}
			}
			this.refresh()
		},
		
		refresh: function() {
			var starSet = config.starSet;
			for (var i = 0; i < starSet.length; i++) {
				var row = starSet[i].length;
				for (var j = 0; j < row; j++) {
					var star = starSet[i][j];
					if (star == null) {
						continue;
					}
					star.row = i;
					star.col = j; 
					star.style.left = Math.floor(starSet[i][j].col * config.starWidth * 53.333333) + "px";
					star.style.bottom = Math.floor(starSet[i][j].row * config.starHeight * 53.333333) + "px";
					star.style.backgroundImage = "url('images/" + starSet[i][j].number + ".png')";
				}
			}
		},
		
		/**
		 * @param number
		 * @param row
		 * @param col
		 * @returns {HTMLElement}
		 */
		createBlockStar: function(number, row, col) {
			return new BlockStar(number, row, col);
		},

	};
	CrushGame.prototype.init.prototype = CrushGame.prototype;
	window.CrushGame = CrushGame;


})();

(function() {
	new CrushGame()
})();
