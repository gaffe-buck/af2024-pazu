// title:   Pat Pat The Pretty Girl
// author:  gaffe
// desc:    a cute dog petting simulator
// site:    artfight.net
// license: MIT License (change this to your license of choice)
// version: 0.1
// script:  js

const SCREEN_W = 240
const SCREEN_H = 136

const LETTERBOX_COLOR = 7
const BACKGROUND_COLOR = 5
const TEXT_COLOR = 1
const TEXT_BORDER_COLOR = 7

let initialized = false
let game = null

class Tween {
	frameCounter = 0
	frameCounterIncrement = 1
	delayCompleted = false
	done = false
	repeatCounter = 0
	paused = false

	config = {
		target: {},
		durationFrames: 0,
		delayFrames: 0,
		repeat: 0,
		yoyo: false,
		easing: (t) => t,
		startX: 0,
		startY: 0,
		endX: 0,
		endY: 0,
		callback: () => { },
	}

	constructor(config) {
		this.config = {
			...config,
			delayFrames: config.delayFrames ?? this.config.delayFrames,
			repeat: config.repeat ?? this.config.repeat,
			yoyo: config.yoyo ?? this.config.yoyo,
			easing: config.easing ?? this.config.easing,
			callback: config.callback ?? this.config.callback,
		}
	}

	getAbsoluteProgress() {
		let progress = this.frameCounter / this.config.durationFrames
		progress = Math.min(progress, 1)
		progress = Math.max(progress, 0)

		return progress
	}

	getEasedProgress() {
		const absoluteProgress = this.getAbsoluteProgress()
		const easedProgress = this.config.easing(absoluteProgress)

		return easedProgress
	}

	setPaused(paused) {
		this.paused = paused
	}

	TIC() {
		if (this.done) return
		if (this.paused) return


		if (!this.delayCompleted && this.frameCounter >= this.config.delayFrames) {
			this.delayCompleted = true
			this.frameCounter = 0
		}

		if (this.delayCompleted) {
			const absoluteProgress = this.getAbsoluteProgress()
			const easedProgress = this.getEasedProgress()

			if (this.config.startX !== undefined && this.config.endX !== undefined) {
				this.config.target.x = lerp(this.config.startX, this.config.endX, easedProgress)
			}
			if (this.config.startY !== undefined && this.config.endY !== undefined) {
				this.config.target.y = lerp(this.config.startY, this.config.endY, easedProgress)
			}

			if (this.frameCounterIncrement > 0 && absoluteProgress === 1) {
				if (this.config.yoyo) {
					this.frameCounterIncrement = -1
				} else {
					this.repeatCounter++
					this.frameCounter = 0
				}
			} else if (this.frameCounterIncrement < 0 && absoluteProgress === 0) {
				this.repeatCounter++
				this.frameCounterIncrement = 1
			}

			if (this.config.repeat >= 0 && this.repeatCounter > this.config.repeat) {
				this.config.callback()
				this.done = true
			}
		}

		this.frameCounter += this.frameCounterIncrement
	}
}

class Timer {
	triggerAfterFrames = 0
	triggered = false
	paused = true
	frames = 0
	callback = () => { }

	constructor(framesUntilTriggered, callback, paused) {
		this.triggerAfterFrames = framesUntilTriggered
		this.callback = callback
		this.paused = !!paused
	}

	start() {
		this.paused = false
	}

	stop() {
		this.paused = true
	}

	reset() {
		this.paused = true
		this.frames = 0
		this.triggered = false
	}

	getProgress() {
		return 1 - ((this.triggerAfterFrames - this.frames) / this.triggerAfterFrames)
	}

	TIC() {
		if (!this.paused) {
			if (this.frames < this.triggerAfterFrames) this.frames++

			if (this.frames === this.triggerAfterFrames && !this.triggered) {
				this.triggered = true
				this.callback()
			}
		}
	}
}

class Puppy {
	x = 32
	y = 64
	bodySprite = 48
	boobSprite = 0
	boobs = {
		x: 32,
		y: 64 + 18
	}

	headSprite = 8
	head = {
		x: 32,
		y: 64 - 39
	}

	tweens = [
		new Tween({
			target: this,
			durationFrames: 60,
			startY: SCREEN_H + 39,
			endY: SCREEN_H + 2 - 20,
			easing: easeOutQuad,
		}),
		new Tween({
			target: this.boobs,
			durationFrames: 60,
			startY: SCREEN_H + 18 + 30,
			endY: SCREEN_H + 2 - 20 + 18,
			easing: easeOutQuad,
		}),
		new Tween({
			target: this.head,
			durationFrames: 60,
			startY: SCREEN_H - 39 + 39,
			endY: SCREEN_H + 2 - 39,
			easing: easeOutQuad,
		}),
		new Tween({
			target: this,
			durationFrames: 60,
			delayFrames: 90,
			startY: SCREEN_H + 2 - 20,
			endY: SCREEN_H - 40,
			easing: easeOutElastic,
		}),
		new Tween({
			target: this.boobs,
			durationFrames: 70,
			delayFrames: 92,
			startY: SCREEN_H + 2 - 20 + 18,
			endY: SCREEN_H - 40 + 18,
			easing: easeOutElastic,
		}),
		new Tween({
			target: this.head,
			durationFrames: 60,
			delayFrames: 90,
			startY: SCREEN_H + 2 - 20 - 39,
			endY: SCREEN_H - 40 - 39,
			easing: easeOutElastic,
		})
	]

	timers = [
		new Timer(0, () => { game.hud.disableButtons(true) }),
		new Timer(150, () => { game.hud.disableButtons(false) })
	]

	TIC() {
		for (const tween of this.tweens) {
			tween.TIC()
		}
		this.tweens = this.tweens.filter(t => !t.done)

		for (const timer of this.timers) {
			timer.TIC()
		}
		this.timers = this.timers.filter(t => !t.triggered)

		// draw the dog
		spr(this.bodySprite, this.x, this.y, 0, 1, 0, 0, 8, 8)
		spr(this.boobSprite, this.boobs.x, this.boobs.y, 0, 1, 0, 0, 8, 3)
		spr(this.headSprite, this.head.x, this.head.y, 0, 1, 0, 0, 8, 7)
	}
}

class LetterBox {
	TIC() {
		vbank(1)
		rect(0, 0, SCREEN_W / 2 - 64, SCREEN_H, LETTERBOX_COLOR)
		rect(SCREEN_W / 2 + 64, 0, SCREEN_W, SCREEN_H, LETTERBOX_COLOR)
		vbank(0)
	}
}

class Button {
	text = ""
	x = 0
	y = 0
	w = 0
	callback = () => { }

	bgColor = 1
	textColor = 6
	mouseDownBgColor = 3
	mouseDownTextColor = 7

	mouseDown = false
	disabled = false

	constructor(text, x, y, callback) {
		this.text = text
		this.x = x
		this.y = y
		this.callback = callback

		clip(0, 0, 0, 0)
		this.w = print(text, 0, 0, 1, false, 1, true)
		clip()
	}

	TIC() {
		let [mouseX, mouseY, left] = `${mouse()}`.split(",")
		mouseX = Number(mouseX)
		mouseY = Number(mouseY)
		left = left === "true"

		if (
			this.x - this.w / 2 - 2 <= mouseX
			&& mouseX <= this.x + this.w / 2 + 2
			&& mouseY >= this.y - 1
			&& mouseY <= this.y + 7
			&& !this.disabled
		) {
			if (left) {
				this.mouseDown = true
			}
			else {
				if (this.mouseDown === true) this.callback()
				this.mouseDown = false
			}
		}
		else {
			this.mouseDown = false
		}

		vbank(1)
		rect(
			this.x - this.w / 2 - 1,
			this.y - 1,
			this.w + 2,
			8,
			this.mouseDown || this.disabled ? this.mouseDownBgColor : this.bgColor)
		rect(
			this.x - this.w / 2 - 2,
			this.y,
			this.w + 4,
			6,
			this.mouseDown || this.disabled ? this.mouseDownBgColor : this.bgColor)
		print(this.text, this.x - this.w / 2, this.y, this.mouseDown ? this.mouseDownTextColor : this.textColor, false, 1, true)
		vbank(0)
	}
}

class Hud {
	headpatButton = new Button("headpat", (SCREEN_W - 128) / 2 / 2, SCREEN_H - 16, () => { trace("pat!") })
	kissButton = new Button("kiss", SCREEN_W - (SCREEN_W - 128) / 2 / 2, SCREEN_H - 16, () => { trace("kiss!") })

	buttons = [this.headpatButton, this.kissButton]

	disableButtons(disabled) {
		for (const button of this.buttons) button.disabled = disabled
	}

	TIC() {
		this.headpatButton.TIC()
		this.kissButton.TIC()
	}
}

class Title {
	TIC() {
		printWithBorder("SPOIL THE", 64, 2, TEXT_COLOR, TEXT_BORDER_COLOR, false, 1, false, true)
		printWithBorder("PUPPY PRINCESS", 64, 10, TEXT_COLOR, TEXT_BORDER_COLOR, false, 2, true, true)
		printWithBorder("art fight 2024 - by gaffe for pazu", 64, 22, TEXT_BORDER_COLOR, null, false, 1, true, true)
	}
}

class Game {
	letterBox = new LetterBox()
	title = new Title()
	hud = new Hud()
	puppy = new Puppy()

	TIC() {
		cls(BACKGROUND_COLOR)
		poke(0x3FF9, -SCREEN_W / 2 + 64)

		this.puppy.TIC()

		this.title.TIC()
		this.letterBox.TIC()
		this.hud.TIC()
	}
}

function init() {
	initialized = true
	game = new Game()
}

function TIC() {
	if (!initialized) init()

	game.TIC()
}

// util
function pal(c0, c1) {
	if (arguments.length == 2)
		poke4(0x3ff0 * 2 + c0, c1)
	else
		for (var i = 0; i < 16; i++)
			poke4(0x3ff0 * 2 + i, i)
}

function printWithBorder(text, x, y, color, bgColor, fixed, scale, smallFont, centered) {
	let xOffset = 0
	let w = 0
	if (centered) {
		clip(0, 0, 0, 0)
		w = print(text, 0, 0, color, fixed, scale, smallFont)
		clip()

		xOffset = -w / 2
	}

	if (bgColor !== null) {
		print(text, x + xOffset - 1, y, bgColor, fixed, scale, smallFont)
		print(text, x + xOffset + 1, y, bgColor, fixed, scale, smallFont)
		print(text, x + xOffset, y - 1, bgColor, fixed, scale, smallFont)
		print(text, x + xOffset, y + 1, bgColor, fixed, scale, smallFont)
	}

	return print(text, x + xOffset, y, color, fixed, scale, smallFont)
}

function spriteWithBorder(sprite, x, y, colorKey, scale, flip, rotate, w, h, borderColor) {
	const palette = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
	const colorsToSwap = palette.filter(c => c !== colorKey && c !== borderColor)
	for (let color of colorsToSwap) {
		pal(color, borderColor)
	}
	spr(sprite, x + 1, y, colorKey, scale, flip, rotate, w, h)
	spr(sprite, x - 1, y, colorKey, scale, flip, rotate, w, h)
	spr(sprite, x, y + 1, colorKey, scale, flip, rotate, w, h)
	spr(sprite, x, y - 1, colorKey, scale, flip, rotate, w, h)
	pal()
	spr(sprite, x, y, colorKey, scale, flip, rotate, w, h)
}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function actionButton() {
	return btnp(4) || btnp(5) || btnp(6) || btnp(7)
}

function lerp(a, b, t) {
	return a + (b - a) * t
}

function invLerp(a, b, v) {
	return (v - a) / (b - a)
}

function easeOutElastic(t) {
	if (t == 1) return 1
	return 1 - 2 ** (-10 * t) * turnCos(2 * t)
}

function easeInElastic(t) {
	if (t == 0) return 0
	return 2 ** (10 * t - 10) * turnsSin(2 * t - 2)
}

function easeInOvershoot(t) {
	return 2.7 * t * t * t - 1.7 * t * t
}

function easeOutOvershoot(t) {
	t -= 1
	return 1 + 2.7 * t * t * t + 1.7 * t * t
}

function easeInBounce(t) {
	t = 1 - t
	const n1 = 7.5625
	const d1 = 2.75

	if (t < 1 / d1) {
		return 1 - n1 * t * t;
	}
	else if (t < 2 / d1) {
		t -= 1.5 / d1
		return 1 - n1 * t * t - .75;
	}
	else if (t < 2.5 / d1) {
		t -= 2.25 / d1
		return 1 - n1 * t * t - .9375;
	}
	else {
		t -= 2.625 / d1
		return 1 - n1 * t * t - .984375;
	}
}

function easeOutBounce(t) {
	const n1 = 7.5625
	const d1 = 2.75

	if (t < 1 / d1) return n1 * t * t
	else if (t < 2 / d1) {
		t -= 1.5 / d1
		return n1 * t * t + .75;
	}
	else if (t < 2.5 / d1) {
		t -= 2.25 / d1
		return n1 * t * t + .9375;
	}
	else {
		t -= 2.625 / d1
		return n1 * t * t + .984375;
	}
}

function easeOutQuad(t) {
	t -= 1
	return 1 - t * t
}

function turnsSin(turns) {
	const rads = turns * (Math.PI * 2)
	const result = -Math.sin(rads)

	return result
}

function turnCos(turns) {
	const rads = turns * (Math.PI * 2)
	const result = Math.cos(rads)

	return result
}

// <TILES>
// 001:0000000000000000000000000000000000000000000000000000000a0000000a
// 002:00009999099999989a9999969a999988a9999966a99999669699988869999888
// 003:6888888088888888888888888888888888888888888888888888888888888888
// 004:0888888988888889888888888888888888888888888888888888888888888888
// 005:9999000099999990999999a9999999a98996699a8886688a8888868888888888
// 006:000000000000000000000000000000000000000000000000a0000000a0000000
// 008:0000000000000000000000000000000b000000b00000000b0000000000000000
// 009:0000000b000000b0000000b0bbbb00b00000b0b000000b0bb0000b0b0b0000bb
// 010:00000000b00000000b0000000b0000000b00000000b0000000b0000000b00000
// 011:0000000000000000000000000000000000000000000000000000000000000700
// 012:0000000000000000000000000000000000000000000000000000000000700000
// 013:000000000000000b000000b0000000b0000000b000000b0000000b0000000b00
// 014:b00000000b0000000b0000000b00bbbb0b0b0000b0b00000b0b0000bbb0000b0
// 015:000000000000000000000000b00000000b000000b00000000000000000000000
// 017:000000a6000000a9000000a9000000a9000000a90000000a0000000000000000
// 018:699998889999988899999888999998889999988899999888a9999888aa999888
// 019:88888888888888888888888888888888888888888888a888888a88888aa88888
// 020:8888888888888888888888888888888888888888888a88888888a88888888aa8
// 021:8888888888888888888888888888888888888888888888888888888a888888aa
// 022:8a0000008a0000008a0000008a0000008a000000a00000000000000000000000
// 024:0000000700000076000007660000766600007666000766760007667600076676
// 025:77bb777b6666b66b66666b66667666bb666766b7666676b7666667b7666666b6
// 026:0b000000bb777777b76666667666666666666666666666666666666666666666
// 027:0000767777007666667776666666766666666666666666666666666666666666
// 028:7767000066670077666777666667666666666666666666666666666666666666
// 029:000000b0777777bb6666667b6666666766666666666666666666666666666666
// 030:b777bb77b66b666666b66666bb6667667b6676667b6766667b7666666b666666
// 031:7000000067000000667000006667000066670000676670006766700067667000
// 034:00aaaaaa00000000000000000000000000000000000000000000000000000000
// 035:a000000000000000000000000000000000000000000000000000000000000000
// 036:0000000a00000000000000000000000000000000000000000000000000000000
// 037:aaaaaa0000000000000000000000000000000000000000000000000000000000
// 040:0007667600076667000076660000076b000000b600000b070000b000000b000b
// 041:6666bb76666b6b767bb6b676b76b677666b676767b776667b766666776666667
// 042:6666666666666677666667666666766676666766766666779766679999767999
// 043:6666666677766666666766676667667166766711777671119917111199111111
// 044:6666666666666777766676661766766611766766111767771111719911111199
// 045:6666666677666666667666666667666666766667776666679976667999976799
// 046:67bb666667b6b666676b6bb76776b67b67676b66766677b77666667b76666667
// 047:676670007666700066670000b67000006b00000070b00000000b0000b000b000
// 050:00000000000000000000000000000000000000000000000a000000a8000000a8
// 051:00000000000aaaaa00a888880a888888a8888888888888888888888888888888
// 052:00000000aaaaa00088888a00888888a08888888a888888888888888888888888
// 053:0000000000000000000000000000000000000000a00000008a0000008a000000
// 056:00b000b000b00b070000b007000b0007000b007600b0007600b000760b000076
// 057:7666666766666667666666676666666766666667666666676666666766666667
// 058:999799999999999c999999cc99999cbc99999cbc9c99cbb199c9cbbb99ccbbbb
// 059:99111111cccc1111c11cc111c11cc111ccccc111ccccc111ccccc111bccbc161
// 060:111111991111cccc111cc11c111cc11c111ccccc116ccccc111ccccc111cbccb
// 061:99997999c9999999cc999999cbc99999cbc999991bbc99c9bbbc9c99bbbbcc99
// 062:7666666776666666766666667666666676666666766666667666666676666666
// 063:0b000b0070b00b00700b00007000b0006700b00067000b0067000b00670000b0
// 065:0000000000000000000000000000000000000000000000000000000a00000aa9
// 066:000000a9000000a900000aa90000a969000a9999aaa999999996699999966999
// 067:8888888888888888888888888888866898886666988866669888866698888866
// 068:8888888888888888888866886688668866688888666888896688888968888889
// 069:8a0000009a0000009aa00000999a00009999a00099999aaa9999999999999999
// 070:000000000000000000000000000000000000000000000000a00000009aa00000
// 072:0b00076600000766000007660000076600007666000076660000766600007666
// 073:6666666766666667666666676666666666666666666666666666666666666666
// 074:9cccbbbb999cbbbb9999cbbb79999ccc79999999799999967999999979999691
// 075:bbbbc111bbbbc111bbbc1161ccc1111199116177961111171111111111111111
// 076:161cbbbb611cbbbb1111cbbb11611ccc77111199711116161111111111111111
// 077:bbbbccc9bbbbc999bbbc9999ccc9999799999997999999979699999719999997
// 078:7666666676666666766666666666666666666666666666666666666666666666
// 079:667000b066700000667000006670000066670000666700006667000066670000
// 080:0000000000000000000000000000000000000000000000000000000a0000000a
// 081:0000a999000a999900a999990a999999a9669699a96699999999999999999999
// 082:9999999999999999999999999999999899999998999999889999998899999988
// 083:9888888688888888888888888888888888888888888888888888888888888888
// 084:8888889988888888888888888888888888888888888888888888888888888888
// 085:9999999999999999999999999999999989999999899999998899999988899999
// 086:999a00009999a00099969a00999999a09999999a9999999a9999999999999969
// 087:000000000000000000000000000000000000000000000000a0000000a0000000
// 088:0000766600000766000007660000076600000766000007660000007600000076
// 089:6666666666666666666666666666666666666666666666666666666666666666
// 090:7999999167999961679999116799991167a99911700aa99170000aaa70000000
// 091:171111111711111711711171111777111111111111111111aa11111100aa1111
// 092:111111717111117117111711117771111111111111111111111111aa1111aa00
// 093:6999999711999976119999761199997611999a76199aa007aaa0000700000007
// 094:6666666666666666666666666666666666666666666666666666666666666666
// 095:6667000066700000667000006670000066700000667000006700000067000000
// 096:000000a800000a8800000a880000a8880000a8860000a8880000a888000a8888
// 097:8999999988889999888888998888889988888899888888996688889966888887
// 098:9999988899999888999998889999988899999888999998889999988899999888
// 099:8888888888888888888888888888888888888888888888888888888888888888
// 100:8888888888888888888888888888888888888888888888888888888888888888
// 101:8888999988889999888899998888999988889999888899998888999988889999
// 102:9899999898888668998886689988888899888888999888889999888879999888
// 103:8a00000088a0000088a00000888a0000888a0000888a0000888a00008868a000
// 104:0000000700000000000000000000000000000000000000000000000000000000
// 105:6666666777666670007777000000000000000000000000000000000000000000
// 107:0000aaaa00000000000000000000000000000000000000000000000000000000
// 108:aaaa000000000000000000000000000000000000000000000000000000000000
// 110:7666666607666677007777000000000000000000000000000000000000000000
// 111:7000000000000000000000000000000000000000000000000000000000000000
// 112:000a88880000a8880000a88800000a8800000076000000760000007600000007
// 113:8888888688886666866666666666666666666666666666666666666677777777
// 114:7999988877999888679998886799988867999888679998887999988879999888
// 115:8888888888888888888888888888888888888888888888888888888888888888
// 116:8888888888888888888888888888888888888888888888888888888888888888
// 117:8888999788899997888999768889997688889976888899768888999788889997
// 118:6999999866669999666666696666666666666666666666666666666677777777
// 119:6688a000668a0000998a000099a0000067000000670000006700000070000000
// </TILES>

// <WAVES>
// 000:00000000ffffffff00000000ffffffff
// 001:0123456789abcdeffedcba9876543210
// 002:0123456789abcdef0123456789abcdef
// </WAVES>

// <SFX>
// 000:000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000304000000000
// </SFX>

// <TRACKS>
// 000:100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// </TRACKS>

// <PALETTE>
// 000:000000f6f4f1413c38a49a8e6f6b62c8f6f1ff9aa7bc505ef9f2dfead1ac705835afc3ff40579a000000000000000000
// </PALETTE>

