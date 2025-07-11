(function () {
	var config = {
		starWidth: .75,
		starHeight: .75,
		starSet: [],
		tableRows: 10,
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
		level: 1,
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
		init: function () {
			const savedLevel = localStorage.getItem('starCrushLevel');
			computed.level = savedLevel ? parseInt(savedLevel, 10) : 1;
			console.log("Loaded level:", computed.level);
			this.initTable();
		},

		initTable: function () {
			this.initScore();
			this.initStarSet();
			this.initBlockStars();
		},

		initScore: function () {
			console.log("Initializing Score...");
			// Calculate targetScore from level
			config.targetScore = 1000 + (computed.level - 1) * computed.stepTargetScore;
			console.log("Target Score set to:", config.targetScore);

			new Utils(config.scoreCurrent, computed.totalScore, 0).start();
			new Utils(config.scoreTarget, 0, config.targetScore).start();
			new Utils(config.scoreLevel, computed.level, computed.level).start();

			computed.totalScore = 0;
		},

		mouseClick: function () {
			var starSet = config.starSet,
				choose = computed.choose,
				baseScore = config.baseScore,
				stepScore = config.stepScore,
				el = config.el,
				self = this,
				len = choose.length;

			if (!computed.flag || len <= 1) return;

			config.scoreSelect.style.opacity = '0';
			computed.flag = false;
			computed.tempStar = null;
			var score = 0;
			for (var i = 0; i < len; i++) {
				score += baseScore + i * stepScore;
			}
			new Utils(config.scoreCurrent, computed.totalScore, computed.totalScore += score).start();

			for (var i = 0; i < len; i++) {
				setTimeout(function (i) {
					starSet[choose[i].row][choose[i].col] = null;
					el.removeChild(choose[i]);
				}, i * 100, i);
			}

			setTimeout(function () {
				self.move();
				setTimeout(function () {
					if (computed.totalScore >= config.targetScore) {
						console.log("Level completed! Advancing to next level.");
						computed.win = true;
						computed.level += 1;
						localStorage.setItem('starCrushLevel', computed.level);
						self.gameover('win');
						setTimeout(function () {
							self.clear();
						}, 2000);
						computed.flag = true;
					} else {
						if (self.isFinish()) {
							console.log("No more moves. Game over.");
							self.gameover('lose');
							setTimeout(function () {
								self.clear();
							}, 2000);
							computed.flag = true;
							computed.win = false;
							computed.level = 1;
							localStorage.setItem('starCrushLevel', computed.level);
						} else {
							choose = [];
							computed.flag = true;
							self.mouseOver(computed.tempStar);
						}
					}
				}, 400 + choose.length * 150);
			}, choose.length * 100);
		},

		gameover: function (winOrLose) {
			var div = document.createElement('div');
			div.id = 'gameover';
			div.class = 'gameover';
			document.getElementById('starCrush').appendChild(div);

			var msg = winOrLose === 'win' ? 'You Win!' : 'You Lose :(';
			var next = winOrLose === 'win' ? 'Loading next level' : 'Continue with current level';

			var p = document.createElement('p');
			p.id = 'msg';
			p.textContent = msg;
			div.appendChild(p);

			p = document.createElement('p');
			p.id = 'next';
			p.textContent = next;
			div.appendChild(p);
		},

		clear: function () {
			var starSet = config.starSet,
				rows = starSet.length,
				el = config.el,
				self = this;
			var temp = [];

			var gameover = document.querySelector('#gameover');
			if (gameover != null) {
				gameover.remove();
			}

			for (var i = rows - 1; i >= 0; i--) {
				for (var j = starSet[i].length - 1; j >= 0; j--) {
					if (starSet[i][j] !== null) {
						temp.push(starSet[i][j]);
						starSet[i][j] = null;
					}
				}
			}

			for (let k = 0; k < temp.length; k++) {
				setTimeout(function (k) {
					el.removeChild(temp[k]);
					if (k >= temp.length - 1) {
						setTimeout(function () {
							new CrushGame();
							document.dispatchEvent(new CustomEvent("restart", { detail: "Restart Game" }));
						}, 500);
					}
				}, k * 50, k);
			}
		},

		isFinish: function () {
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

		move: function () {
			var rows = config.tableRows,
				starSet = config.starSet;

			for (var i = 0; i < rows; i++) {
				var pointer = 0;
				for (var j = 0; j < rows; j++) {
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
						starSet[j].splice(i, 1);
					}
					continue;
				}
				i++;
			}
			this.refresh();
		},

		mouseOver: function (obj) {
			if (!computed.flag) {
				computed.tempStar = obj;
				return;
			}
			this.clearFlicker();
			var choose = [];
			this.checkLink(obj, choose);
			computed.choose = choose;
			if (choose.length <= 1) return;
			this.flicker(choose);
			this.computeScore(choose);
		},

		computeScore: function (arr) {
			var score = 0,
				len = arr.length,
				baseScore = config.baseScore,
				stepScore = config.stepScore;
			for (var i = 0; i < len; i++) {
				score += baseScore + i * stepScore;
			}
			if (score <= 0) return;
			computed.score = score;
			config.scoreSelect.style.opacity = '1';
			config.scoreSelect.innerHTML = `Crush ${arr.length} stars to get ${score} points`;
		},

		clearFlicker: function () {
			var starSet = config.starSet;
			for (var i = 0; i < starSet.length; i++) {
				for (var j = 0; j < starSet[i].length; j++) {
					var div = starSet[i][j];
					if (div !== null) {
						div.classList.remove("scale");
					}
				}
			}
		},

		flicker: function (arr) {
			for (var i = 0; i < arr.length; i++) {
				arr[i].classList.add("scale");
			}
		},

		checkLink: function (obj, arr) {
			if (obj === null) return;
			arr.push(obj);
			var starSet = config.starSet,
				rows = config.tableRows;
			const { row, col, number } = obj;

			[[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
				const newRow = row + dx;
				const newCol = col + dy;
				if (
					newRow >= 0 &&
					newRow < rows &&
					newCol >= 0 &&
					newCol < rows &&
					starSet[newRow][newCol] &&
					starSet[newRow][newCol].number === number &&
					arr.indexOf(starSet[newRow][newCol]) === -1
				) {
					this.checkLink(starSet[newRow][newCol], arr);
				}
			});
		},

		initStarSet: function () {
			var rows = config.tableRows;
			config.starSet = Array.from({ length: rows }, () => []);
		},

		initBlockStars: function () {
			var starSet = config.starSet,
				self = this,
				el = config.el,
				cols = starSet.length;
			computed.flag = true;
			for (var i = 0; i < cols; i++) {
				for (var j = 0; j < config.tableRows; j++) {
					var star = this.createBlockStar(Math.floor(Math.random() * 5), i, j);
					star.onmouseover = function () {
						self.mouseOver(this);
					};
					star.onclick = function () {
						self.mouseClick();
					};
					starSet[i][j] = star;
					el.appendChild(star);
				}
			}
			this.refresh();
		},

		refresh: function () {
			var starSet = config.starSet;
			for (var i = 0; i < starSet.length; i++) {
				for (var j = 0; j < starSet[i].length; j++) {
					var star = starSet[i][j];
					if (star === null) continue;
					star.row = i;
					star.col = j;
					star.style.left = star.col * config.starWidth + "rem";
					star.style.bottom = star.row * config.starHeight + "rem";
					star.style.backgroundImage = `url('/StarCrush/images/photo/${star.number}.png')`;
				}
			}
		},

		createBlockStar: function (number, row, col) {
			return new BlockStar(number, row, col);
		},
	};

	CrushGame.prototype.init.prototype = CrushGame.prototype;
	window.CrushGame = CrushGame;
})();

(function () {
	new CrushGame();

	const resetBtn = document.getElementById('resetGameBtn');
	if (resetBtn) {
		resetBtn.addEventListener('click', function () {
			if (confirm('Are you sure you want to reset the game to level 1?')) {
				localStorage.setItem('starCrushLevel', 1);
				location.reload();
			}
		});
	}
})();
