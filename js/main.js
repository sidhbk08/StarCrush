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
			config.targetScore = getTargetScoreForLevel(computed.level);
			this.initTable();
		},

		initTable: function () {
			this.initScore();
			this.initStarSet();
			this.initBlockStars();
		},

		initScore: function () {
			new Utils(config.scoreCurrent, computed.totalScore, 0).start();
			if (computed.win) {
				computed.level += 1;
				config.targetScore = getTargetScoreForLevel(computed.level);
				new Utils(config.scoreTarget, config.targetScore - computed.level * 500, config.targetScore).start();
				new Utils(config.scoreLevel, computed.level - 1, computed.level).start();
				localStorage.setItem('starCrushLevel', computed.level);
			} else {
				new Utils(config.scoreTarget, config.targetScore, config.targetScore).start();
				new Utils(config.scoreLevel, computed.level, computed.level).start();
			}
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

			for (let i = 0; i < len; i++) {
				setTimeout(function (i) {
					starSet[choose[i].row][choose[i].col] = null;
					el.removeChild(choose[i]);
				}, i * 100, i);
			}

			setTimeout(function () {
				self.move();
				setTimeout(function () {
					if (computed.totalScore >= config.targetScore) {
						computed.win = true;
						self.gameover('win');
						setTimeout(function () {
							self.clear();
						}, 2000);
					} else if (self.isFinish()) {
						computed.win = false;
						self.gameover('lose');
						setTimeout(function () {
							computed.level = 1;
							localStorage.setItem('starCrushLevel', computed.level);
							self.clear();
						}, 2000);
					} else {
						computed.choose = [];
						computed.flag = true;
						self.mouseOver(computed.tempStar);
					}
				}, 400 + choose.length * 150);
			}, choose.length * 100);
		},

		gameover: function (winOrLose) {
			var div = document.createElement('div');
			div.id = 'gameover';
			div.className = 'gameover';
			document.getElementById('starCrush').appendChild(div);

			var msg = document.createElement('p');
			msg.id = 'msg';
			msg.textContent = winOrLose === 'win' ? 'You Win!' : 'You Lose :(';

			var next = document.createElement('p');
			next.id = 'next';
			next.textContent = winOrLose === 'win' ? 'Loading next level...' : 'Restarting from level 1...';

			div.appendChild(msg);
			div.appendChild(next);
		},

		clear: function () {
			var starSet = config.starSet,
				el = config.el,
				temp = [];

			var gameover = document.querySelector('#gameover');
			if (gameover) gameover.remove();

			for (let i = starSet.length - 1; i >= 0; i--) {
				for (let j = starSet[i].length - 1; j >= 0; j--) {
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
			var starSet = config.starSet;
			for (let i = 0; i < starSet.length; i++) {
				for (let j = 0; j < starSet[i].length; j++) {
					let temp = [];
					this.checkLink(starSet[i][j], temp);
					if (temp.length > 1) return false;
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
			let choose = [];
			this.checkLink(obj, choose);
			computed.choose = choose;

			if (choose.length <= 1) {
				choose = [];
				return;
			}

			this.flicker(choose);
			this.computeScore(choose);
		},

		computeScore: function (arr) {
			var score = 0;
			for (var i = 0; i < arr.length; i++) {
				score += config.baseScore + i * config.stepScore;
			}
			if (score <= 0) return;

			computed.score = score;
			config.scoreSelect.style.opacity = '1';
			config.scoreSelect.innerHTML = "Crush " + arr.length + " stars to get " + score + " points";
		},

		clearFlicker: function () {
			var starSet = config.starSet;
			for (let i = 0; i < starSet.length; i++) {
				for (let j = 0; j < starSet[i].length; j++) {
					let div = starSet[i][j];
					if (div !== null) div.classList.remove("scale");
				}
			}
		},

		flicker: function (arr) {
			arr.forEach(div => div.classList.add("scale"));
		},

		checkLink: function (obj, arr) {
			if (obj === null) return;
			arr.push(obj);
			let row = obj.row, col = obj.col, starSet = config.starSet;
			[
				[-1, 0], [1, 0], [0, -1], [0, 1]
			].forEach(([dr, dc]) => {
				let r = row + dr, c = col + dc;
				if (r >= 0 && r < config.tableRows && c >= 0 && c < config.tableRows) {
					let neighbor = starSet[r][c];
					if (neighbor && neighbor.number === obj.number && !arr.includes(neighbor)) {
						this.checkLink(neighbor, arr);
					}
				}
			});
		},

		initStarSet: function () {
			for (let i = 0; i < config.tableRows; i++) {
				config.starSet[i] = [];
			}
		},

		initBlockStars: function () {
			var starSet = config.starSet,
				el = config.el,
				self = this;

			computed.flag = true;

			for (let i = 0; i < config.tableRows; i++) {
				for (let j = 0; j < config.tableRows; j++) {
					let star = this.createBlockStar(Math.floor(Math.random() * 5), i, j);
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
			for (let i = 0; i < starSet.length; i++) {
				for (let j = 0; j < starSet[i].length; j++) {
					let star = starSet[i][j];
					if (!star) continue;
					star.row = i;
					star.col = j;
					star.style.left = star.col * config.starWidth + "rem";
					star.style.bottom = star.row * config.starHeight + "rem";
					star.style.backgroundImage = "url('/StarCrush/images/photo/" + star.number + ".png')";
				}
			}
		},

		createBlockStar: function (number, row, col) {
			return new BlockStar(number, row, col);
		}
	};

	CrushGame.prototype.init.prototype = CrushGame.prototype;
	window.CrushGame = CrushGame;
})();

(function () {
	new CrushGame();

	// ✅ Reset button with confirmation
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
