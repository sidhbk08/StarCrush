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
		level: parseInt(localStorage.getItem('starCrushLevel') || '1'), // Restore saved level
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
				new Utils(config.scoreTarget, config.targetScore, config.targetScore += computed.stepTargetScore).start();
				new Utils(config.scoreLevel, computed.level, ++computed.level).start();
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
						self.gameover('win');
						setTimeout(function () {
							self.clear();
							localStorage.setItem('starCrushLevel', computed.level); // Save new level
						}, 2000);
						computed.flag = true;
						computed.win = true;
					} else if (self.isFinish()) {
						self.gameover('lose');
						setTimeout(function () {
							self.clear();
						}, 2000);
						computed.flag = true;
						computed.win = false;
					} else {
						computed.flag = true;
						self.mouseOver(computed.tempStar);
					}
				}, 400 + choose.length * 150);
			}, choose.length * 100);
		},

		gameover: function (result) {
			var div = document.createElement('div');
			div.id = 'gameover';
			div.class = 'gameover';
			document.getElementById('starCrush').appendChild(div);

			var msg = result === 'win' ? 'You Win!' : 'You Lost :(';
			var next = result === 'win' ? 'Loading next level' : 'Continue with current level';

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
				temp = [];

			var gameover = document.querySelector('#gameover');
			if (gameover) gameover.remove();

			for (let i = rows - 1; i >= 0; i--) {
				for (let j = starSet[i].length - 1; j >= 0; j--) {
					if (starSet[i][j] != null) {
						temp.push(starSet[i][j]);
						starSet[i][j] = null;
					}
				}
			}

			for (let k = 0; k < temp.length; k++) {
				setTimeout(function () {
					el.removeChild(temp[k]);
					if (k >= temp.length - 1) {
						setTimeout(function () {
							new CrushGame();
							document.dispatchEvent(new CustomEvent("restart", { detail: "Restart Game" }));
						}, 500);
					}
				}, k * 50);
			}
		},

		isFinish: function () {
			var starSet = config.starSet;
			for (var i = 0; i < starSet.length; i++) {
				for (var j = 0; j < starSet[i].length; j++) {
					var temp = [];
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
							starSet[pointer][i].row = pointer;
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
			var score = 0;
			for (var i = 0; i < arr.length; i++) {
				score += config.baseScore + i * config.stepScore;
			}
			computed.score = score;
			config.scoreSelect.style.opacity = '1';
			config.scoreSelect.innerHTML = "Crush " + arr.length + " stars to get " + score + " points";
		},

		clearFlicker: function () {
			var starSet = config.starSet;
			for (var i = 0; i < starSet.length; i++) {
				for (var j = 0; j < starSet[i].length; j++) {
					var div = starSet[i][j];
					if (div) div.classList.remove("scale");
				}
			}
		},

		flicker: function (arr) {
			for (var i = 0; i < arr.length; i++) {
				arr[i].classList.add("scale");
			}
		},

		checkLink: function (obj, arr) {
			if (!obj || arr.includes(obj)) return;
			arr.push(obj);
			const { row, col, number } = obj;
			const s = config.starSet;
			if (col > 0) this.checkLink(s[row][col - 1], arr);
			if (col < config.tableRows - 1) this.checkLink(s[row][col + 1], arr);
			if (row > 0) this.checkLink(s[row - 1][col], arr);
			if (row < config.tableRows - 1) this.checkLink(s[row + 1][col], arr);
		},

		initStarSet: function () {
			for (var i = 0; i < config.tableRows; i++) {
				config.starSet[i] = [];
			}
		},

		initBlockStars: function () {
			var el = config.el;
			computed.flag = true;
			for (var i = 0; i < config.tableRows; i++) {
				for (var j = 0; j < config.tableRows; j++) {
					var star = this.createBlockStar(Math.floor(Math.random() * 5), i, j);
					star.onmouseover = () => this.mouseOver(star);
					star.onclick = () => this.mouseClick();
					config.starSet[i][j] = star;
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
					if (star == null) continue;
					star.row = i;
					star.col = j;
					star.style.left = j * config.starWidth + "rem";
					star.style.bottom = i * config.starHeight + "rem";
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
})();




// Footer
var pdnum = 27;
var pdmax = 3;
var pgnum = Math.ceil(pdnum / pdmax);
var pgid = randomInt(0, pgnum - 1);
var pdrelease = document.getElementById('releases');
var pgnext = document.getElementById('nextpg');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function getReleases(){
    let prodNames = [
        'Color Snake', 'Num Snake', 'Puppy Snake', 
        'Blocker Snake', 'Apple Snake', 'Fruit Collect', 
        'Space Fighter', 'Pong Game', 'Drag Maze', 
        'Barcode Maze', 'Level Maze', 'Blocker Maze',
        'Letter Swap', 'Math Flashcard', 'Card Match', 
        'Memory Card', 'Brick Break', 'Wall Smash',
        'Balloon Pop', 'Balloon Defense', 'Word Scramble',
        'Word Search', 'Tic-Tac-Toe', 'Triangle Hunt',
        'Triangle Match', '2048 Game', 'Minesweeper' 
    ];
    let prodLinks = [
        'color-snake-game/pnncdeicbofogmklheappebjeaipgjfc', 'number-snake-game/nmemfbohjppeagfjiibhhcjjaidkblbe', 'puppy-snake-game/dljfiignakpaalgogccjiceagdakejmk',
        'snake-vs-block-game/gfimhhnghaeemolpihbejepoklogamcl', 'apple-snake-game/jdfgnfoncpdcebhcnfjnfmbecppdiicl', 'fruit-collect-game/boifejgmdmjnngkddcmgagijknfahkdo', 
        'space-fighter-game/fjgchmhpnpfnmicleekhoknicopcihco', 'pong/iibmocmonpccjkjpdgngimgdgpaeheje', 'drag-maze/mpekdelojgbomfnlgbakjjokngoidjhl',
        'barcode-maze/jipngfhdlkeofjpinamebmcbdimgnfjm', 'level-maze/jbnboceikbdhfinjlebidbhhlplagahc', 'maze-blocker-game/hbalpiedginlkffbehlemkhdaoelegnh',       
        'letter-swap-game/mlggpfoffidogjdniajdikhpgldkkdln', 'math-flashcard-game/cjfmbgdalchbgnfhejdmggefmpmaklhk', 'motion-card-match-game/mnhidgoophfkfjmgedocidmimieecanh',
        'memory-card-game/ackehcmjoiepafdfnigbgmlpifjemcaa', 'brick-break-game/elfhjnoikdaaahliajecbhbnkahpaocf', 'wall-smash-game/kneehnmmfiinncdaeekgaaljnppeeobc', 
        'balloon-pop-game/pbgdnjghdgdfbnbkjfoifioalopjgakp', 'balloon-defense-game/dpgoaocjleopffhnmibecijibcnajghd', 'word-scramble-game/kenapidglechhkgphplibhcjacaapghd', 
        'word-search-game/pfekbcjkadkkanahofmindneikbdfbll', 'tic-tac-toe-game/ojphegfghpacfphdjogjfonakeemcpcf', 'unique-triangle-hunt-game/cilmialfmpdohhenkpadkgengcapciap',
        'triangle-match-game/dlbjchffggckhkkgfkkalhnadfmlbalj', '2048-game/gekanafgchokbnoomokmmifkbnckkajk', 'minesweeper-game/ajncfhhlmbappdikagkajjaflholpepd'                
    ];
    let releases = '';
    for(i = 0; i < pdmax; i++){
        releases += '<div class="release' + (i < pdmax - 1 ? '' : ' last') + '"><a href="https://chromewebstore.google.com/detail/'+ prodLinks[pgid * pdmax + i] 
        + '" target=_blank>' + prodNames[pgid * pdmax + i] + '</a></div>';
    }
    return releases;
}

document.addEventListener("DOMContentLoaded", () => {
   pdrelease.innerHTML = getReleases();
   pgnext.addEventListener("click", function(){
        pgid++;
        pgid = pgid % pgnum;
        pdrelease.innerHTML = getReleases()
    });
});
