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

			// Set targetScore based on level
			config.targetScore = 1000 + (computed.level - 1) * computed.stepTargetScore;

			console.log('Initializing game. Level:', computed.level, 'Target Score:', config.targetScore);
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
				// If won, increase level & target
				computed.level += 1;
				config.targetScore += computed.stepTargetScore;
				localStorage.setItem('starCrushLevel', computed.level);
				console.log('Level up! New Level:', computed.level, 'New Target Score:', config.targetScore);
			} else {
				// Save current level even if lost
				localStorage.setItem('starCrushLevel', computed.level);
				console.log('Retrying Level:', computed.level, 'Target Score:', config.targetScore);
			}

			new Utils(config.scoreTarget, config.targetScore, config.targetScore).start();
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
						console.log("Level complete. Score:", computed.totalScore, "Target:", config.targetScore);
						self.gameover('win');
						setTimeout(() => self.clear(), 2000);
						computed.flag = true;
						computed.win = true;
					} else if (self.isFinish()) {
						console.log("No more moves. Game over.");
						self.gameover('lose');
						setTimeout(() => self.clear(), 2000);
						computed.flag = true;
						computed.win = false;
					} else {
						choose = [];
						computed.flag = true;
						self.mouseOver(computed.tempStar);
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
			var next = winOrLose === 'win' ? 'Loading next level' : 'Try again!';

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
			const el = config.el;
			const temp = [];
			const starSet = config.starSet;

			let gameover = document.getElementById('gameover');
			if (gameover) gameover.remove();

			for (let row of starSet) {
				for (let star of row) {
					if (star) {
						temp.push(star);
					}
				}
			}

			for (let k = 0; k < temp.length; k++) {
				setTimeout(() => {
					el.removeChild(temp[k]);
					if (k >= temp.length - 1) {
						setTimeout(() => {
							new CrushGame();
							const event = new CustomEvent("restart", { detail: "Restart Game" });
							document.dispatchEvent(event);
						}, 500);
					}
				}, k * 50);
			}
		},

		isFinish: function () {
			const starSet = config.starSet;
			for (let row of starSet) {
				for (let star of row) {
					let temp = [];
					this.checkLink(star, temp);
					if (temp.length > 1) return false;
				}
			}
			return true;
		},

		move: function () {
			const rows = config.tableRows, starSet = config.starSet;

			for (let i = 0; i < rows; i++) {
				let pointer = 0;
				for (let j = 0; j < rows; j++) {
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

			for (let i = 0; i < starSet[0].length;) {
				if (starSet[0][i] == null) {
					for (let j = 0; j < rows; j++) {
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
			if (choose.length <= 1) return;
			this.flicker(choose);
			this.computeScore(choose);
		},

		computeScore: function (arr) {
			let score = 0;
			for (let i = 0; i < arr.length; i++) {
				score += config.baseScore + i * config.stepScore;
			}
			if (score <= 0) return;
			computed.score = score;
			config.scoreSelect.style.opacity = '1';
			config.scoreSelect.innerHTML = `Crush ${arr.length} stars to get ${score} points`;
		},

		clearFlicker: function () {
			for (let row of config.starSet) {
				for (let div of row) {
					if (div) div.classList.remove("scale");
				}
			}
		},

		flicker: function (arr) {
			for (let div of arr) {
				div.classList.add("scale");
			}
		},

		checkLink: function (obj, arr) {
			if (!obj) return;
			arr.push(obj);
			const starSet = config.starSet;

			const dirs = [
				[0, -1], [0, 1],
				[1, 0], [-1, 0]
			];

			for (let [dx, dy] of dirs) {
				let r = obj.row + dx, c = obj.col + dy;
				if (r >= 0 && r < config.tableRows && c >= 0 && c < config.tableRows) {
					const neighbor = starSet[r][c];
					if (neighbor && neighbor.number === obj.number && !arr.includes(neighbor)) {
						this.checkLink(neighbor, arr);
					}
				}
			}
		},

		initStarSet: function () {
			const rows = config.tableRows;
			config.starSet = Array.from({ length: rows }, () => Array(rows).fill(null));
		},

		initBlockStars: function () {
			const el = config.el;
			computed.flag = true;

			for (let i = 0; i < config.tableRows; i++) {
				for (let j = 0; j < config.tableRows; j++) {
					const star = this.createBlockStar(Math.floor(Math.random() * 5), i, j);
					star.onmouseover = () => this.mouseOver(star);
					star.onclick = () => this.mouseClick();
					config.starSet[i][j] = star;
					el.appendChild(star);
				}
			}
			this.refresh();
		},

		refresh: function () {
			for (let i = 0; i < config.starSet.length; i++) {
				for (let j = 0; j < config.starSet[i].length; j++) {
					let star = config.starSet[i][j];
					if (!star) continue;
					star.row = i;
					star.col = j;
					star.style.left = `${j * config.starWidth}rem`;
					star.style.bottom = `${i * config.starHeight}rem`;
					star.style.backgroundImage = `url('/StarCrush/images/photo/${star.number}.png')`;
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

	const resetBtn = document.getElementById('resetGameBtn');
	if (resetBtn) {
		resetBtn.addEventListener('click', () => {
			if (confirm('Are you sure you want to reset the game to level 1?')) {
				localStorage.setItem('starCrushLevel', 1);
				location.reload();
			}
		});
	}
})();
