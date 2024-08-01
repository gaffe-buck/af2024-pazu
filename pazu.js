// title:   Spoil The Puppy Princess
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

const PUPPY_NEEDS = ["rubs", "scratches", "kisses", "headpats"]

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

			if (this.frames >= this.triggerAfterFrames && !this.triggered) {
				this.triggered = true
				this.callback()
			}
		}
	}
}

// puppy body is "root"
// head y: body - 39
// boobs y: body + 18
const PUP_EYE_UP = 128
const PUP_EYE_SIDE = 132
const PUP_EYE_AHEAD = 192
const PUP_BLINK_HAPPY = 164
const PUP_BLINK_SAD = 160
const PUP_BODY_SPRITE = 48
const PUP_HEAD_SPRITE = 8
const PUP_BOOB_SPRITE = 0
const PUP_MOUTH_HAPPY = 224
const PUP_MOUTH_OPEN = 225
const PUP_MOUTH_SAD = 240
const PUP_MOUTH_SAD_2 = 241

class Puppy {
	x = 32
	y = SCREEN_H
	bodySprite = PUP_BODY_SPRITE
	boobSprite = PUP_BOOB_SPRITE
	boobs = {
		x: 32,
		y: SCREEN_H
	}
	headSprite = PUP_HEAD_SPRITE
	head = {
		x: 32,
		y: SCREEN_H
	}
	eyeSprite = PUP_EYE_AHEAD
	eyeFlip = 0
	mouthSprite = PUP_MOUTH_HAPPY

	happy = true

	tweens = []
	timers = []

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
		spr(this.bodySprite, this.x, this.y, 0, 1, 0, 0, 8, 5)
		spr(this.boobSprite, this.boobs.x, this.boobs.y, 0, 1, 0, 0, 8, 3)
		spr(this.headSprite, this.head.x, this.head.y, 0, 1, 0, 0, 8, 7)
		spr(this.mouthSprite, this.head.x + 24, this.head.y + 36, 0, 1)
		spr(this.mouthSprite, this.head.x + 32, this.head.y + 36, 0, 1, 1)
		spr(this.eyeSprite, this.head.x + 16, this.head.y + 24, 0, 1, this.eyeFlip, 0, 4, 2)

		if (this.needs) {
			printWithBorder(`Pashmina needs`, 64, 54 - 10, TEXT_COLOR, TEXT_BORDER_COLOR, false, 1, false, true)
			printWithBorder(`${this.needs}`, 64, 54 + 7 - 10, TEXT_COLOR, TEXT_BORDER_COLOR, false, 1, false, true)
		}
	}

	makeHappy() {
		this.happy = true
		this.mouthSprite = PUP_MOUTH_HAPPY
		this.needs = null
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
		this.w = print(text, 0, 0, 1, false, 1, false)
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
		print(this.text, this.x - this.w / 2, this.y, this.mouseDown ? this.mouseDownTextColor : this.textColor, false, 1, false)
		vbank(0)
	}
}

const HEADPAT_HAND_1 = 196
const HEADPAT_HAND_2 = 228
class HeadPat {
	x = 48
	y = -16
	sprite = HEADPAT_HAND_1

	timers = []
	tweens = []

	TIC() {
		for (const tween of this.tweens) {
			tween.TIC()
		}
		this.tweens = this.tweens.filter(t => !t.done)

		for (const timer of this.timers) {
			timer.TIC()
		}
		this.timers = this.timers.filter(t => !t.triggered)

		spr(this.sprite, this.x, this.y, 0, 1, 0, 0, 4, 2)
		rect(this.x + 32, this.y + 2, 128, 7, 2)
		rect(this.x + 32, this.y + 3, 128, 5, 3)
		rect(this.x + 32 + 28, this.y + 3, 128, 5, 4)
		rect(this.x + 32, this.y + 4, 29, 3, 3)
	}
}

// in place at 48, 100
class Scratch {
	x = -32
	y = 100
	sprite = HEADPAT_HAND_2

	timers = []
	tweens = []

	TIC() {
		for (const tween of this.tweens) {
			tween.TIC()
		}
		this.tweens = this.tweens.filter(t => !t.done)

		for (const timer of this.timers) {
			timer.TIC()
		}
		this.timers = this.timers.filter(t => !t.triggered)

		spr(this.sprite, this.x, this.y, 0, 1, 3, 0, 4, 2)
		rect(0, this.y + 7, this.x, 7, 2)
		rect(0, this.y + 8, this.x, 5, 3)
		rect(0 - 28, this.y + 8, this.x, 5, 4)
		rect(this.x - 29, this.y + 9, 29, 3, 3)
	}
}

class Rub {
	leftHand = { x: -32, y: SCREEN_H, sprite: HEADPAT_HAND_1 }
	rightHand = { x: 128, y: SCREEN_H, sprite: HEADPAT_HAND_1 }

	timers = [new Timer(0, () => {
		this.nextTimer()
	})]
	tweens = []

	nextTimer() {
		this.leftHand.sprite = this.leftHand.sprite === HEADPAT_HAND_1 ? HEADPAT_HAND_2 : HEADPAT_HAND_1
		this.rightHand.sprite = this.rightHand.sprite === HEADPAT_HAND_1 ? HEADPAT_HAND_2 : HEADPAT_HAND_1
		this.timers.push(new Timer(10, () => { this.nextTimer() }))
	}

	TIC() {
		for (const tween of this.tweens) {
			tween.TIC()
		}
		this.tweens = this.tweens.filter(t => !t.done)

		for (const timer of this.timers) {
			timer.TIC()
		}
		this.timers = this.timers.filter(t => !t.triggered)

		// left hand
		spr(this.leftHand.sprite, this.leftHand.x, this.leftHand.y, 0, 1, 1, 1, 4, 2)
		rect(this.leftHand.x + 2, this.leftHand.y + 32, 7, 128, 2)
		rect(this.leftHand.x + 3, this.leftHand.y + 32, 5, 128, 3)
		rect(this.leftHand.x + 3, this.leftHand.y + 32 + 16, 5, 128, 4)
		rect(this.leftHand.x + 4, this.leftHand.y + 32, 3, 17, 3)

		// right hand
		spr(this.rightHand.sprite, this.rightHand.x, this.rightHand.y, 0, 1, 0, 1, 4, 2)
		rect(this.rightHand.x + 2 + 5, this.rightHand.y + 32, 7, 128, 2)
		rect(this.rightHand.x + 3 + 5, this.rightHand.y + 32, 5, 128, 3)
		rect(this.rightHand.x + 3 + 5, this.rightHand.y + 32 + 16, 5, 128, 4)
		rect(this.rightHand.x + 4 + 5, this.rightHand.y + 32, 3, 17, 3)
	}
}

// meets cheek at 80, 26
const KISS_SPRITE = 256
class Kiss {
	x = 128
	y = 26
	sprite = KISS_SPRITE

	timers = []
	tweens = []

	TIC() {
		for (const tween of this.tweens) {
			tween.TIC()
		}
		this.tweens = this.tweens.filter(t => !t.done)

		for (const timer of this.timers) {
			timer.TIC()
		}
		this.timers = this.timers.filter(t => !t.triggered)

		spr(this.sprite, this.x, this.y, 0, 1, 0, 0, 8, 10)
	}
}

class Hud {
	scratchButton = new Button("scratch", (SCREEN_W - 128) / 2 / 2, SCREEN_H - 48, () => { this.scratchClick() })
	headpatButton = new Button("headpat", (SCREEN_W - 128) / 2 / 2, SCREEN_H - 24, () => { this.headPatClick() })
	rubButton = new Button("rub", SCREEN_W - (SCREEN_W - 128) / 2 / 2, SCREEN_H - 48, () => { this.rubClick() })
	kissButton = new Button("kiss", SCREEN_W - (SCREEN_W - 128) / 2 / 2, SCREEN_H - 24, () => { this.kissClick() })

	buttons = [this.headpatButton, this.kissButton, this.scratchButton, this.rubButton]

	headPatClick() {
		this.disableButtons(true)
		startHeadPat(() => { this.disableButtons(false) })
	}

	kissClick() {
		this.disableButtons(true)
		startKiss(() => { this.disableButtons(false) })
	}

	scratchClick() {
		this.disableButtons(true)
		startScratch(() => { this.disableButtons(false) })
	}

	rubClick() {
		this.disableButtons(true)
		startRub(() => { this.disableButtons(false) })
	}

	disableButtons(disabled) {
		for (const button of this.buttons) button.disabled = disabled
	}

	TIC() {
		this.headpatButton.TIC()
		this.kissButton.TIC()
		this.scratchButton.TIC()
		this.rubButton.TIC()
	}
}

class Title {
	y = 2

	TIC() {
		printWithBorder("SPOIL THE", 64, this.y, TEXT_COLOR, TEXT_BORDER_COLOR, false, 1, false, true)
		printWithBorder("PUPPY PRINCESS", 64, this.y + 8, TEXT_COLOR, TEXT_BORDER_COLOR, false, 2, true, true)
		printWithBorder("art fight 2024 - by gaffe for pazu", 64, this.y + 20, TEXT_BORDER_COLOR, null, false, 1, true, true)
	}
}

class Game {
	letterBox = new LetterBox()
	title = new Title()
	hud = new Hud()
	puppy = new Puppy()
	headPat = new HeadPat()
	kiss = new Kiss()
	scratch = new Scratch()
	rub = new Rub()

	TIC() {
		cls(BACKGROUND_COLOR)
		poke(0x3FF9, -SCREEN_W / 2 + 64)

		this.puppy.TIC()
		this.headPat.TIC()
		this.scratch.TIC()
		this.rub.TIC()
		this.kiss.TIC()

		this.title.TIC()
		this.letterBox.TIC()
		this.hud.TIC()
	}
}

function init() {
	initialized = true
	game = new Game()
	startPuppyJumpAnimation()
}

function TIC() {
	if (!initialized) init()

	game.TIC()
}

// animations
function startRub(callback) {
	if (game.puppy.needs === 'rubs') game.puppy.makeHappy()

	game.rub.tweens.push(new Tween({
		target: game.rub.leftHand,
		startX: game.rub.leftHand.x,
		endX: 1,
		startY: game.rub.leftHand.y,
		endY: 64,
		durationFrames: 20,
		easing: easeOutElastic,
	}))
	game.rub.tweens.push(new Tween({
		target: game.rub.rightHand,
		startX: game.rub.rightHand.x,
		endX: 128 - 17,
		startY: game.rub.rightHand.y,
		endY: 64,
		durationFrames: 20,
		delayFrames: 3,
		easing: easeOutElastic,
		callback: rub2
	}))

	function rub2() {
		let headStartY = game.puppy.head.y
		let bodyStartY = game.puppy.y
		let boobsStartY = game.puppy.boobs.y
		game.puppy.timers = []
		game.puppy.tweens = []
		game.puppy.eyeSprite = PUP_BLINK_HAPPY
		game.puppy.mouthSprite = PUP_MOUTH_OPEN
		rubbies(20, rub3)
		game.puppy.tweens.push(new Tween({
			target: game.puppy.head,
			startY: headStartY,
			endY: headStartY + 6,
			durationFrames: 10,
			delayFrames: 3,
			yoyo: true,
			repeat: 10,
			easing: easeOutQuad,
		}))
		game.puppy.tweens.push(new Tween({
			target: game.puppy,
			startY: bodyStartY,
			endY: bodyStartY + 6,
			durationFrames: 10,
			delayFrames: 5,
			yoyo: true,
			repeat: 10,
			easing: easeOutQuad,
		}))
		game.puppy.tweens.push(new Tween({
			target: game.puppy.boobs,
			startY: boobsStartY,
			endY: boobsStartY + 6,
			durationFrames: 10,
			delayFrames: 8,
			yoyo: true,
			repeat: 10,
			easing: easeOutQuad,
		}))
	}

	function rub3() {
		game.rub.tweens.push(new Tween({
			target: game.rub.leftHand,
			startX: game.rub.leftHand.x,
			endX: 1,
			startY: game.rub.leftHand.y,
			endY: 64,
			durationFrames: 30,
			easing: easeOutElastic,
		}))
		game.rub.tweens.push(new Tween({
			target: game.rub.rightHand,
			startX: game.rub.rightHand.x,
			endX: 128 - 17,
			startY: game.rub.rightHand.y,
			endY: 64,
			durationFrames: 30,
			delayFrames: 8,
			easing: easeOutElastic,
			callback: () => {
				game.puppy.mouthSprite = PUP_MOUTH_HAPPY
				startPuppyBlink()
				rub4()
			}
		}))
	}

	function rub4() {
		game.rub.tweens.push(new Tween({
			target: game.rub.leftHand,
			startX: game.rub.leftHand.x,
			endX: -32,
			startY: game.rub.leftHand.y,
			endY: SCREEN_H,
			durationFrames: 20,
			easing: easeOutElastic,
		}))
		game.rub.tweens.push(new Tween({
			target: game.rub.rightHand,
			startX: game.rub.rightHand.x,
			endX: 128,
			startY: game.rub.rightHand.y,
			endY: SCREEN_H,
			durationFrames: 20,
			delayFrames: 3,
			easing: easeOutElastic,
			callback: () => {
				callback()
			}
		}))
	}

	function rubbies(times, callback) {
		let rubs = 0

		nextRub()

		function nextRub() {
			rubs++
			if (rubs >= times) {
				callback()
			} else {
				let tweenLeft = new Tween({
					target: game.rub.leftHand,
					startX: game.rub.leftHand.x,
					endX: getRandomArbitrary(32, 48),
					startY: game.rub.leftHand.y,
					endY: getRandomArbitrary(56, 128),
					durationFrames: 10,
					//easing: easeOutQuad,
				})
				let tweenRight = new Tween({
					target: game.rub.rightHand,
					startX: game.rub.rightHand.x,
					endX: getRandomArbitrary(64, 80),
					startY: game.rub.rightHand.y,
					endY: getRandomArbitrary(56, 128),
					durationFrames: 10,
					//delayFrames: 4,
					//easing: easeOutQuad,
					callback: () => { nextRub() }
				})

				game.rub.tweens = [tweenLeft, tweenRight]
			}
		}
	}
}

function startScratch(callback) {
	if (game.puppy.needs === 'scratches') game.puppy.makeHappy()

	const headStartX = game.puppy.head.x
	const scratchStartX = game.scratch.x

	game.puppy.timers = []
	game.puppy.tweens = []
	game.puppy.eyeSprite = PUP_EYE_SIDE
	game.puppy.eyeFlip = true

	game.scratch.tweens.push(new Tween({
		target: game.scratch,
		startX: scratchStartX,
		endX: 48,
		startY: 118,
		endY: 100,
		easing: easeOutElastic,
		durationFrames: 30,
		callback: scratch2
	}))

	function scratch2() {
		game.puppy.eyeSprite = PUP_BLINK_HAPPY
		game.puppy.mouthSprite = PUP_MOUTH_OPEN

		function scritchies(times, ms, callback) {
			let timer = new Timer(ms, callback)

			for (let i = 1; i < times; i++) {
				let oldTimer = timer
				timer = new Timer(ms, () => {
					game.scratch.sprite = game.scratch.sprite === HEADPAT_HAND_1 ? HEADPAT_HAND_2 : HEADPAT_HAND_1
					game.scratch.timers.push(oldTimer)
				})
			}

			return timer
		}

		game.scratch.timers = [scritchies(9, 10, scratch3)]
	}

	function scratch3() {
		game.puppy.mouthSprite = PUP_MOUTH_HAPPY
		game.puppy.eyeSprite = PUP_EYE_SIDE
		game.scratch.tweens.push(new Tween({
			target: game.scratch,
			startX: game.scratch.x,
			endX: -32,
			startY: game.scratch.y,
			endY: 118,
			easing: easeInQuad,
			durationFrames: 15,
			callback: () => {
				startPuppyBlink()
				callback()
			}
		}))
	}
}

function startKiss(callback) {
	if (game.puppy.needs === 'kisses') game.puppy.makeHappy()

	const headStartX = game.puppy.head.x

	game.puppy.timers = []
	game.puppy.tweens = []
	game.puppy.eyeSprite = PUP_EYE_SIDE
	game.puppy.eyeFlip = false

	game.kiss.tweens.push(new Tween({
		target: game.kiss,
		startX: 128,
		startY: 16,
		endX: 80,
		endY: 26,
		durationFrames: 20,
		easing: easeOutQuad,
		callback: kiss2,
	}))

	function kiss2() {
		game.puppy.eyeSprite = PUP_BLINK_HAPPY
		game.puppy.mouthSprite = PUP_MOUTH_OPEN
		game.kiss.tweens.push(new Tween({
			target: game.kiss,
			startX: 80,
			endX: 64,
			durationFrames: 10,
			easing: easeOutQuad,
		}))
		game.puppy.tweens.push(new Tween({
			target: game.puppy.head,
			startX: headStartX,
			endX: headStartX - 12,
			durationFrames: 40,
			delayFrames: 3,
			easing: easeOutElastic,
		}))
		game.puppy.tweens.push(new Tween({
			target: game.puppy,
			startX: headStartX,
			endX: headStartX - 12,
			durationFrames: 40,
			delayFrames: 5,
			easing: easeOutElastic,
		}))
		game.puppy.tweens.push(new Tween({
			target: game.puppy.boobs,
			startX: headStartX,
			endX: headStartX - 12,
			durationFrames: 40,
			delayFrames: 8,
			easing: easeOutElastic,
			callback: kiss4
		}))

		function kiss3() {
			game.kiss.timers.push(new Timer(1, kiss4))
		}

		function kiss4() {
			game.puppy.eyeSprite = PUP_EYE_SIDE
			game.puppy.mouthSprite = PUP_MOUTH_HAPPY
			game.kiss.tweens.push(new Tween({
				target: game.kiss,
				endX: 128,
				endY: 16,
				startX: game.kiss.x,
				startY: game.kiss.y,
				durationFrames: 20,
				easing: easeInQuad,
			}))
			game.puppy.tweens.push(new Tween({
				target: game.puppy.head,
				startX: game.puppy.head.x,
				endX: headStartX,
				durationFrames: 40,
				delayFrames: 3,
				easing: easeOutElastic,
			}))
			game.puppy.tweens.push(new Tween({
				target: game.puppy,
				startX: game.puppy.x,
				endX: headStartX,
				durationFrames: 40,
				delayFrames: 5,
				easing: easeOutElastic,
			}))
			game.puppy.tweens.push(new Tween({
				target: game.puppy.boobs,
				startX: game.puppy.boobs.x,
				endX: headStartX,
				durationFrames: 40,
				delayFrames: 8,
				easing: easeOutElastic,
				callback: () => {
					startPuppyBlink()
					callback()
				}
			}))
		}
	}
}

function startHeadPat(callback) {
	if (game.puppy.needs === 'headpats') game.puppy.makeHappy()

	game.puppy.timers = []
	game.puppy.tweens = []
	game.puppy.eyeSprite = PUP_EYE_UP

	game.headPat.tweens.push(new Tween({
		target: game.headPat,
		startY: -16,
		endY: 32,
		durationFrames: 30,
		easing: easeOutElastic,
		callback: pat2
	}))

	function pat2() {
		game.puppy.eyeSprite = PUP_BLINK_HAPPY
		game.puppy.mouthSprite = PUP_MOUTH_OPEN
		game.headPat.tweens.push(new Tween({
			target: game.headPat,
			startY: 32,
			endY: 64,
			yoyo: true,
			repeat: 2,
			durationFrames: 10,
			easing: easeOutQuad,
			callback: pat3,
		}))
		game.puppy.tweens.push(new Tween({
			target: game.puppy.head,
			startY: game.puppy.head.y,
			endY: game.puppy.head.y + 8,
			yoyo: true,
			repeat: 2,
			durationFrames: 10,
			easing: easeInQuad,
		}))
		game.puppy.tweens.push(new Tween({
			target: game.puppy,
			startY: game.puppy.y,
			endY: game.puppy.y + 6,
			yoyo: true,
			repeat: 2,
			delayFrames: 3,
			durationFrames: 10,
			easing: easeInQuad,
		}))
		game.puppy.tweens.push(new Tween({
			target: game.puppy.boobs,
			startY: game.puppy.boobs.y,
			endY: game.puppy.boobs.y + 6,
			yoyo: true,
			repeat: 2,
			delayFrames: 5,
			durationFrames: 10,
			easing: easeInQuad,
		}))
	}

	function pat3() {
		game.puppy.eyeSprite = PUP_BLINK_HAPPY
		game.puppy.mouthSprite = PUP_MOUTH_HAPPY
		startPuppyBlink()
		game.headPat.tweens.push(new Tween({
			target: game.headPat,
			startY: 32,
			endY: -16,
			delayFrames: 15,
			durationFrames: 10,
			callback: callback,
			easing: easeInQuad,
		}))
	}
}

function startPuppyBlink() {
	function puppyOpenEyes() {
		game.puppy.eyeSprite = game.puppy.happy ? PUP_EYE_AHEAD : PUP_EYE_UP
		game.puppy.timers.push(new Timer(60 * getRandomArbitrary(4, 7), puppyCloseEyes))
	}

	function puppyCloseEyes() {
		game.puppy.eyeSprite = game.puppy.happy ? PUP_BLINK_HAPPY : PUP_BLINK_SAD
		if (!game.puppy.happy) {
			game.puppy.mouthSprite = PUP_MOUTH_SAD
		}
		game.puppy.timers.push(new Timer(0.2 * 60, puppyOpenEyes))
	}

	function addSadAnimTimer() {
		if (game.puppy.happy) return
		game.puppy.timers.push(new Timer(15, () => {
			game.puppy.mouthSprite = game.puppy.mouthSprite === PUP_MOUTH_SAD ? PUP_MOUTH_SAD_2 : PUP_MOUTH_SAD
			addSadAnimTimer()
		}))
	}

	if (game.puppy.happy) {
		game.puppy.timers.push(new Timer(getRandomArbitrary(1 * 60, 10 * 60), () => {
			game.puppy.happy = false
			addSadAnimTimer()
			game.puppy.needs = PUPPY_NEEDS[Math.floor(getRandomArbitrary(0, 4))]
			trace(game.puppy.needs)
		}))
	} else {
		addSadAnimTimer()
	}

	puppyCloseEyes()
}

function startPuppyJumpAnimation() {
	game.puppy.timers = []

	game.hud.disableButtons(true)
	game.puppy.eyeSprite = PUP_EYE_UP

	// // DEBUG
	// game.puppy.tweens = [
	// 	new Tween({
	// 		target: game.puppy,
	// 		durationFrames: 10,
	// 		delayFrames: 0,
	// 		startY: SCREEN_H + 2 - 20,
	// 		endY: SCREEN_H - 40,
	// 		easing: easeOutElastic,
	// 	}),
	// 	new Tween({
	// 		target: game.puppy.boobs,
	// 		durationFrames: 10,
	// 		delayFrames: 0,
	// 		startY: SCREEN_H + 2 - 20 + 18,
	// 		endY: SCREEN_H - 40 + 18,
	// 		easing: easeOutElastic,
	// 	}),
	// 	new Tween({
	// 		target: game.puppy.head,
	// 		durationFrames: 10,
	// 		delayFrames: 0,
	// 		startY: SCREEN_H + 2 - 20 - 39,
	// 		endY: SCREEN_H - 40 - 39,
	// 		easing: easeOutElastic,
	// 		callback: () => {
	// 			game.puppy.eyeSprite = 192
	// 			game.puppy.timers.push(new Timer(120, startPuppyBlink))
	// 			game.hud.disableButtons(false)
	// 		}
	// 	})
	// ]

	// return
	// // END DEBUG

	game.puppy.tweens = [
		new Tween({
			target: game.puppy,
			durationFrames: 60,
			startY: SCREEN_H + 39,
			endY: SCREEN_H + 2 - 20,
			delayFrames: 60,
			easing: easeOutQuad,
		}),
		new Tween({
			target: game.puppy.boobs,
			durationFrames: 60,
			startY: SCREEN_H + 18 + 30,
			endY: SCREEN_H + 2 - 20 + 18,
			delayFrames: 60,

			easing: easeOutQuad,
		}),
		new Tween({
			target: game.puppy.head,
			durationFrames: 60,
			delayFrames: 60,
			startY: SCREEN_H - 39 + 39,
			endY: SCREEN_H + 2 - 39,
			easing: easeOutQuad,
			callback: eyeWiggleAnimation
		}),
		new Tween({
			target: game.title,
			startY: 128,
			endY: 2,
			delayFrames: 60,
			durationFrames: 60,
			easing: easeOutBounce,
		})
	]

	function eyeWiggleAnimation() {
		game.puppy.eyeSprite = PUP_EYE_SIDE

		function flipEyes(times, ms, callback) {
			let timer = new Timer(ms, callback)

			for (let i = 1; i < times; i++) {
				let oldTimer = timer
				timer = new Timer(ms, () => {
					game.puppy.eyeFlip = game.puppy.eyeFlip ? 0 : 1
					game.puppy.timers.push(oldTimer)
				})
			}

			return timer
		}

		game.puppy.timers = [flipEyes(4, 30, () => {
			game.puppy.eyeSprite = game.puppy.happy ? PUP_EYE_UP : PUP_EYE_AHEAD
			bounceUpAnimation()
		})]
	}

	function bounceUpAnimation() {
		game.puppy.tweens = [
			new Tween({
				target: game.puppy,
				durationFrames: 60,
				delayFrames: 0,
				startY: SCREEN_H + 2 - 20,
				endY: SCREEN_H - 40,
				easing: easeOutElastic,
			}),
			new Tween({
				target: game.puppy.boobs,
				durationFrames: 70,
				delayFrames: 2,
				startY: SCREEN_H + 2 - 20 + 18,
				endY: SCREEN_H - 40 + 18,
				easing: easeOutElastic,
			}),
			new Tween({
				target: game.puppy.head,
				durationFrames: 60,
				delayFrames: 0,
				startY: SCREEN_H + 2 - 20 - 39,
				endY: SCREEN_H - 40 - 39,
				easing: easeOutElastic,
				callback: () => {
					game.puppy.eyeSprite = 192
					game.puppy.timers.push(new Timer(120, startPuppyBlink))
					game.hud.disableButtons(false)
				}
			})
		]
	}
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

function easeInQuad(t) {
	return t * t
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
// 003:6800000088000000880000008800000088000000880000008800000088000000
// 004:0000008900000089000000880000008800000088000000880000008800000088
// 005:9999000099999990999999a9999999a98996699a8886688a8888868888888888
// 006:000000000000000000000000000000000000000000000000a0000000a0000000
// 009:0000000000000000000000070000777600076666007666660766666676666666
// 010:0000000000000000777000006667000066667000666667006666667066666670
// 011:0000000000000000000000000000000000000000000000000000000000000700
// 012:0000000000000000000000000000000000000000000000000000000000700000
// 013:0000000000000000000007770000766600076666007666660766666607666666
// 014:0000000000000000700000006777000066667000666667006666667066666667
// 017:000000a6000000a9000000a9000000a9000000a90000000a0000000000000000
// 018:699998889999988899999888999998889999988899999888a9999888aa999888
// 019:88000000888000008888000088888888888888888888a888888a88888aa88888
// 020:0000008800000888000088888888888888888888888a88888888a88888888aa8
// 021:8888888888888888888888888888888888888888888888888888888a888888aa
// 022:8a0000008a0000008a0000008a0000008a000000a00000000000000000000000
// 024:0000000000000007000000070000000000000000000000000000000000000bbb
// 025:76666666666666666666666676666666766666677666666776666667b7666667
// 026:6666667766677777677666667666666666666666666666666666666666666666
// 027:0000767777007666667776666666766666666666666666666666666666666666
// 028:7767000066670077666777666667666666666666666666666666666666666666
// 029:7766666677777666666667766666666766666666666666666666666666666666
// 030:666666676666666666666666666666677666666776666667766666677666667b
// 031:00000000700000007000000000000000000000000000000000000000bbb00000
// 034:00aaaaaa00000000000000000000000000000000000000000000000000000000
// 035:a000000000000000000000000000000000000000000000000000000000000000
// 036:0000000a00000000000000000000000000000000000000000000000000000000
// 037:aaaaaa0000000000000000000000000000000000000000000000000000000000
// 040:0000b000000b00000000b00000000bbb000000000000000b000000b000000b00
// 041:0bb66667000b66760000b776000bbb76bbb0bb76000bbb67007bb66607bbb666
// 042:666666666666667766666766666676666666676676666677676667996a767999
// 043:6666666677766666666766676667667166766711777671119917111199111111
// 044:6666666666666777766676661766766611766766111767771111719911111199
// 045:66666666776666666676666666676666667666667766666799766676999767a6
// 046:76666bb06766b000677b000067bbb00067bb0bbb76bbb000666bb700666bbb70
// 047:000b00000000b000000b0000bbb0000000000000b00000000b00000000b00000
// 051:00000000000aaaaa00a888880a9888880a9888880a9888880a9888880a988888
// 052:00000000aaaaa00088888a00888889a0888889a0888889a0888889a0888889a0
// 056:0000b00000000b0b000000b70000000700000076000007660000076600007666
// 057:7bb6b666b6b6b66666b6b6666b66b6666b6b66666b6b666a6b6b666a6b6b666a
// 058:6a979999a9999999a9999999a9999999a9999999999999999999999999999999
// 059:9911111199911111999111119991111199911111999111119991111199911161
// 060:1111119911111999111119991111199911111999116119991111199911111999
// 061:999979a69999999a9999999a9999999a9999999a999999999999999999999999
// 062:666b6bb7666b6b6b666b6b66666b66b66666b6b6a666b6b6a666b6b6a666b6b6
// 063:000b0000b0b000007b0000007000000067000000667000006670000066670000
// 065:0000000000000000000000000000000000000000000000000000000a00000aa9
// 066:0000000000000000000000000000000a000aaaa9aaa999999996699999966999
// 067:0a9888880a888888a98888889888888898888888988888889888866898886666
// 068:888889a0888888a08888669a8888668988888888888888896688888966688889
// 069:000000000000000000000000a00000009aaaa00099999aaa9999999999999999
// 070:000000000000000000000000000000000000000000000000a00000009aa00000
// 072:0000766600076666000766660076666600766666007666660076666600766666
// 073:6b66666a666666a9666666a9666666a966666a9966666a9966666a9966666a99
// 074:9999999999999999999999999999999999999999999999969999999999999691
// 075:9991111199911111999111619991111199116111961111111111111111111111
// 076:1611199961111999111119991161199911111199111116161111111111111111
// 077:9999999999999999999999999999999999999999999999999699999919999999
// 078:a66666b69a6666669a6666669a66666699a6666699a6666699a6666699a66666
// 079:6667000066667000666670006666670066666700666667006666670066666700
// 080:0000000000000000000000000000000000000000000000000000000a0000000a
// 081:0000a999000a999900a999990a999999a9669699a96699999999999999999999
// 082:9999999999999999999999999999999899999998999999889999998899999988
// 083:9888666688888666888888668888888688888888888888888888888888888888
// 084:6668889966888888688888888888888888888888888888888888888888888888
// 085:9999999999999999999999999999999989999999899999998899999988899999
// 086:999a00009999a00099969a00999999a09999999a9999999a9999999999999969
// 087:000000000000000000000000000000000000000000000000a0000000a0000000
// 088:0076666600766666007666660076666600766666007666660007666600076666
// 089:66666a99666666a96666670a6666670066667000666670006667000066700000
// 090:999999919999996199999911aa99991100a99911000aa99100000aaa00000000
// 091:111111111111111111111111111111111111111111111111aa11111100aa1111
// 092:111111111111111111111111111111111111111111111111111111aa1111aa00
// 093:699999991199999911999999119999aa11999a00199aa000aaa0000000000000
// 094:99a666669a666666a07666660076666600076666000766660000766600000766
// 095:6666670066666700666667006666670066666700666667006666700066667000
// 096:000000a800000a8800000a880000a8880000a8860000a8880000a888000a8888
// 097:8999999988889999888888998888889988888899888888996688889966888887
// 098:9999988899999888999998889999988899999888999998889999988899999888
// 099:8888888888888888888888888888888888888888888888888888888888888888
// 100:8888888888888888888888888888888888888888888888888888888888888888
// 101:8888999988889999888899998888999988889999888899998888999988889999
// 102:9899999898888668998886689988888899888888999888889999888879999888
// 103:8a00000088a0000088a00000888a0000888a0000888a0000888a00008868a000
// 104:0000766600000777000000000000000000000000000000000000000000000000
// 105:6700000070000000000000000000000000000000000000000000000000000000
// 107:0000aaaa00000000000000000000000000000000000000000000000000000000
// 108:aaaa000000000000000000000000000000000000000000000000000000000000
// 110:0000007600000007000000000000000000000000000000000000000000000000
// 111:6667000077700000000000000000000000000000000000000000000000000000
// 112:000a88880000a8880000a88800000a8800000076000000760000007600000007
// 113:8888888688886666866666666666666666666666666666666666666677777777
// 114:7999988877999888679998886799988867999888679998887999988879999888
// 115:8888888888888888888888888888888888888888888888888888888888888888
// 116:8888888888888888888888888888888888888888888888888888888888888888
// 117:8888999788899997888999768889997688889976888899768888999788889997
// 118:6999999866669999666666696666666666666666666666666666666677777777
// 119:6688a000668a0000998a000099a0000067000000670000006700000070000000
// 128:0000000c000000cc00000cbc00000cbc0c00cbb100c0cbbb00ccbbbb0cccbbbb
// 129:cccc0000c11cc000c11cc000ccccc000ccccc000ccccc000bccbc000bbbbc000
// 130:0000cccc000cc11c000cc11c000ccccc000ccccc000ccccc000cbccb000cbbbb
// 131:c0000000cc000000cbc00000cbc000001bbc00c0bbbc0c00bbbbcc00bbbbccc0
// 132:0000000c000000cb00000cbb00000cbb0c00cbbb00c0cbbb00ccbbbb0cccbbbb
// 133:cccc0000bbbbc000bcccc000c11cc000c11cc000ccccc000ccccc0001cccc000
// 134:0000cccc000cbbbb000cbbbc000cbbc1000cbbc1000cbbcc000cbbcc000cbbbc
// 135:c0000000bc000000ccc000001cc000001ccc00c0cccc0c00cccccc00cc1cccc0
// 144:000cbbbb0000cbbb00000ccc0000000000000000000000000000000000000000
// 145:bbbbc000bbbc0000ccc000000000000000000000000000000000000000000000
// 146:000cbbbb0000cbbb00000ccc0000000000000000000000000000000000000000
// 147:bbbbc000bbbc0000ccc000000000000000000000000000000000000000000000
// 148:000cbbbb0000cbbb00000ccc0000000000000000000000000000000000000000
// 149:bbccc000bbbc0000ccc000000000000000000000000000000000000000000000
// 150:000cbbbb0000cbbb00000ccc0000000000000000000000000000000000000000
// 151:ccccc000bbbc0000ccc000000000000000000000000000000000000000000000
// 160:00000000000000000000000000000000000000000c00000000c000000ccc0000
// 161:000000000000000000000000000000000000000000000000000000000000c000
// 162:00000000000000000000000000000000000000000000000000000000000c0000
// 163:0000000000000000000000000000000000000000000000c000000c000000ccc0
// 164:0000000000000000000000000000000000000ccc0c00c00000cc00000cc00000
// 165:000000000000000000000000ccc00000000cc000000000000000000000000000
// 166:00000000000000000000000000000ccc000cc000000000000000000000000000
// 167:00000000000000000000000000000000ccc00000000c00c00000cc0000000cc0
// 176:0000c00000000ccc000000000000000000000000000000000000000000000000
// 177:000c0000ccc00000000000000000000000000000000000000000000000000000
// 178:0000c00000000ccc000000000000000000000000000000000000000000000000
// 179:000c0000ccc00000000000000000000000000000000000000000000000000000
// 192:0000000c000000cb00000cbb00000cbb0c00cbbb00c0cbbc00ccbbcc0cccbbcc
// 193:cccc0000bbbbc000bbbbc000bccbc000ccccc00011ccc00011ccc000ccccc000
// 194:0000cccc000cbbbb000cbbbb000cbccb000ccccc000ccc11000ccc11000ccccc
// 195:c0000000bc000000bbc00000bbc00000bbbc00c0cbbc0c00ccbbcc00ccbbccc0
// 196:0000000000000000000000000000000000000000000000020000002300000232
// 197:0000000000000000000002220022233302333333233333333333333332333333
// 198:0000000022222222333333333333333333333333333333333333333333333333
// 199:0000000000000000222222223333333333333333333333333333333333333333
// 208:000cbb1c0000cbcc00000ccc0000000000000000000000000000000000000000
// 209:ccccc000cccc0000ccc000000000000000000000000000000000000000000000
// 210:000ccccc0000cccc00000ccc0000000000000000000000000000000000000000
// 211:c1bbc000ccbc0000ccc000000000000000000000000000000000000000000000
// 212:0000232300023232000232320002232300002323000002230000002200000000
// 213:2333323333332333333233333323333333233332223333200233320000222000
// 214:3333333333322333322002332000023300000233000000220000000000000000
// 215:3332222233200000332000003320000032000000200000000000000000000000
// 224:0000007700000007000000000000000007000000070000070070007000077700
// 225:0000007700000007000000000000000000d0000d000ddddd0000dddd00000ddd
// 228:0000000000000000000000000000000002222222233223322323322302332333
// 229:0000000000000000000002220022233322333333233333333333323333222333
// 230:0000000022222222333333333333333333333333333333333333333333333333
// 231:0000000000000000222222223333333333333333333333333333333333333333
// 240:0000007700000007000000000000000000000000000000070000007000000700
// 241:0000007700000007000000000000000000000007000000700000070000000000
// 244:0022333302333332233332230233233300222333000023330000022200000000
// 245:2233333333333333333333323333222032220000200000000000000000000000
// 246:3333333333222333222002330000002300000002000000000000000000000000
// 247:3333222233220000333200003332000033320000222000000000000000000000
// </TILES>

// <SPRITES>
// 006:0000000a000000a9000000a9000000a90000000a000000000000000000000000
// 007:aa00000099a00000999a00009999a0009999a000a9999a00a9999a000a9999a0
// 021:0000000a000000a9000000a9000000a90000000a000000000000000000000000
// 022:aaaaa00099999aa09999999a99999999aaa99999000aa99900000a9900000a99
// 023:0a9999a000a999a000a999a0a0a999a09aa999a09aa999a099a999a0999999a0
// 038:000000a9000000a9000000a9000000a9000000a9000000a9000000a9000000a9
// 039:999999a099999a0099999a0099999a009999a0009999a000999a0000999a0000
// 053:0000000a000000a9000000a9000000a90000000a000000000000000000000000
// 054:aa000a9999aa0a999999a9999999999999999999aa99999a0a99999a0a9999a0
// 055:99a0000099a000009a0000009a000000a0000000000000000022000002442000
// 067:0000000000000000000000000000000000000002000000020000000200000022
// 068:0002222200233333023332222332222233222233222233332223333223333322
// 069:22000000332200003333222a333333a9333333a933333a9922222a992222a999
// 070:a9999a00a9999a029999a0249999a244999a244499a3244499a244449a244444
// 071:2444420044444200444442004444442044244420423244202332442023324420
// 082:0000000000000000000000000000000000000000000000000000000000000002
// 083:0000002200000022000000230000224200224444024444442244422224442222
// 084:2333322223332223333222332232233344222222444444442444444422444444
// 085:333a9999333a999933a9999a33a9999a22a999a2444aaa424444442444444244
// 086:9a244442a2444423244444232444423344442333444423334444233344423333
// 087:3333244233332442333324423333244233332420333244203324442032444200
// 096:0000000000000000000000000000000000000000000000000000022200022223
// 097:0000000000000000000000000000000000000000000222222222222233222222
// 098:0000000200000022000002220000222222222222222222242222224422222444
// 099:2442223324422333244433334443333344333322433332334333233343323333
// 100:2234444433334444333334443333334422333344332233443333334433333344
// 101:4444424444444444444444444444444444444444444444444444444444444444
// 102:4442333344442222444444444422222244444444444444444444444444444444
// 103:2444200044420000442000002200000020000000200000002000000020000000
// 112:0022222300222223002222230022222300222233002223330022233300222333
// 113:3332222233332222333333223333333233333333333333333333333333333333
// 114:2222444422224444222244442222244422222444322224443222224433222244
// 115:4323333343233333443333334444333344444333444444444444444444444444
// 116:3333334433333444333344443334444433444444444444444444444444444444
// 117:4444444444444444444444444444444444444444444444444444444444444444
// 118:4444444444444444444444444444444244444442444444424444444244444424
// 119:2000000022000000242222224444444444444444444444444444444444444444
// 128:0022233300222333023333332333333323333333222333330233333302333333
// 129:3333333333333333333333333333333233333322333332223333333333333333
// 130:3222224432222344222233332223333322333333233333333333333333333333
// 131:4444444444444444333444443333334433333333333333333333333333333333
// 132:4444444444444444444444444444444434444444333333443333333333333333
// 133:4444444444444444444444444444444444444444444444443444444433333333
// 134:4444442444444424444442224444422244442222444423324332333333333333
// 135:4444444444444444444444442222444422222222222222223332222233333322
// 144:0022222200000000000000000000000000000000000000000000000000000000
// 145:2233333300222233000000220000000000000000000000000000000000000000
// 146:3333333333333333222222220000000000000000000000000000000000000000
// 147:3333333333333333333333332222222200000000000000000000000000000000
// 148:3333333333333333333333333333333322222222000000000000000000000000
// 149:3333333333333333333333333333333333333333222222230000000200000000
// 150:3333333333333333333333333333333333333333333333332222222200000000
// 151:3333333333333333333333333333333333333333333333332333333302222222
// </SPRITES>

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

// <SCREEN>
// 000:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 001:555555555555555555555555555555555555555577775777755577755777757755555555777757755757777755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 002:555555555555555555555555555555555555555711117111175711177111171175555557111171177171111175555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 003:555555555555555555555555555555555555557111777117717117717711771175555555711771177171177755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 004:555555555555555555555555555555555555555711177117717117717711771175555555711771111171111755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 005:555555555555555555555555555555555555555771117111177117717711771177755555711771177171177755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 006:555555555555555555555555555555555555557111177117755711177111171111175555711771177171111175555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 007:555555555555555555555555555555555555555777755775555577755777757777755555577557755757777755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 008:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 009:555555555577775555775577557777555577775555775577555555777755557777555577777755777755555577775577777755557777555577775555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 010:555555555711117557117711771111755711117557117711755557111175571111755711111177111175555711117711111175571111755711117555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 011:555555555711117757117711771111775711117757117711755557111177571111775711111177111177557711117711111175771111757711117555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 012:555555555711771177117711771177117711771177117711755557117711771177117577117757117711771177775711777757117777571177775555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 013:555555555711771177117711771177117711771177117711755557117711771177117557117557117711771175555711775557117755571177555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 014:555555555711117757117711771111775711117755771177555557111177571111117557117557117711771175555711117555771175557711755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 015:555555555711117557117711771111755711117555571175555557111175571111117557117557117711771175555711117555571177555711775555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 016:555555555711775557117711771177555711775555571175555557117755571111775557117557117711771175555711775555557711755577117555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 017:555555555711755557117711771175555711755555571175555557117555571111775577117757117711771177775711777755777711757777117555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 018:555555555711755555771111771175555711755555571175555557117555571177117711111177117711757711117711111177111177571111775555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 019:555555555711755555571111771175555711755555571175555557117555571177117711111177117711755711117711111177111175571111755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 020:555555555577555555557777557755555577555555557755555555775555557755775577777755775577555577775577777755777755557777555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 021:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 022:555555555555575555557575555575555755557755577577557575555555557555555555555555555575557555555555755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 023:555577557575777555575555577577557775555575757555757575555555557755757555577577555755575557755557555755757555775577557775757555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 024:555557757755575555777575757575755755555755757557557775557775557575757555757557757775777575755577757575775555757557755775757555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 025:555575757555575555575575777575755755557555757575555575555555557575577555777575755755575577555557557575755555757575757555757555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 026:555577757555557555575575557575755575557775775577755575555555557755557555557577755755575557755557555755755555775577757775577555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 027:555555555555555555555555575555555555555555555555555555555555555555575555575555555555555555555555555555555555755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 028:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 029:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 030:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 031:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 032:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 033:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 034:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 035:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 036:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 037:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 038:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 039:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 040:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 041:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 042:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 043:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 044:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 045:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 046:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 047:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 048:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 049:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 050:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 051:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 052:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 053:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 054:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 055:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 056:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 057:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 058:555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 059:555555555555555555555555555555555555555555555557777555555555555555555555555557777555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 060:555555555555555555555555555555555555555555557776666755555555555555555555555576666777555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 061:555555555555555555555555555555555555555555576666666675555555555555555555555766666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 062:555555555555555555555555555555555555555555766666666667555555555555555555557666666666675555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 063:555555555555555555555555555555555555555557666666666666755555555555555555576666666666667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 064:555555555555555555555555555555555555555576666666666666755555575555755555576666666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 065:555555555555555555555555555555555555555576666666666666775555767777675555776666666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 066:555555555555555555555555555555555555555766666666666777777755766666675577777776666666666675555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 067:555555555555555555555555555555555555555766666666677666666677766666677766666667766666666675555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 068:555555555555555555555555555555555555555576666666766666666666766666676666666666676666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 069:555555555555555555555555555555555555555576666667666666666666666666666666666666667666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 070:555555555555555555555555555555555555555576666667666666666666666666666666666666667666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 071:555555555555555555555555555555555555555576666667666666666666666666666666666666667666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 072:5555555555555555555555555555555555555bbbb7666667666666666666666666666666666666667666667bbbb55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 073:555555555555555555555555555555555555b5555bb666676666666666666666666666666666666676666bb5555b5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 074:55555555555555555555555555555555555b5555555b6676666666777776666666666777776666666766b5555555b555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 075:555555555555555555555555555555555555b5555555b77666666766666766677666766666766666677b5555555b5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 076:5555555555555555555555555555555555555bbb555bbb766666766666676671176676666667666667bbb555bbb55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 077:5555555555555555555555555555555555555555bbb5bb766666676666766711117667666676666667bb5bbb55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 078:555555555555555555555555555555555555555b555bbb677666667777767111111767777766666776bbb555b5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 079:55555555555555555555555555555555555555b5557bb66667666799991711111111719999766676666bb7555b555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 080:5555555555555555555555555555555555555b5557bbb6666a7679999911111111111199999767a6666bbb7555b55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 081:555555555555555555555555555555555555b5557bb6b6666a97999ccccc11111111ccccc99979a6666b6bb7555b5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 082:5555555555555555555555555555555555555b5bb6b6b666a99999ccc11cc111111cc11ccc99999a666b6b6bb5b55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 083:55555555555555555555555555555555555555b766b6b666a9999cbcc11cc111111cc11ccbc9999a666b6b667b555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 084:55555555555555555555555555555555555555576b66b666a9999cbcccccc111111ccccccbc9999a666b66b675555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 085:55555555555555555555555555555555555555766b6b6666ac99cbb1ccccc111111ccccc1bbc99ca6666b6b667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 086:55555555555555555555555555555555555557666b6b666a99c9cbbbccccc111116cccccbbbc9c99a666b6b666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 087:55555555555555555555555555555555555557666b6b666a99ccbbbbbccbc111111cbccbbbbbcc99a666b6b666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 088:55555555555555555555555555555555555576666b6b666a9cccbbbbbbbbc161111cbbbbbbbbccc9a666b6b666675555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 089:55555555555555555555555555555555555576666b66666a999cbbbbbbbbc111161cbbbbbbbbc999a66666b666675555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 090:5555555555555555555555555555555555576666666666a99999cbbbbbbc11116111cbbbbbbc99999a66666666667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 091:5555555555555555555555555555555555576666666666a999999cccccc1116111111cccccc999999a66666666667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 092:5555555555555555555555555555555555766666666666a9999999999991111111611999999999999a66666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 093:555555555555555555555555555555555576666666666a999999999999116177771111999999999999a6666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 094:555555555555555555555555555555555576666666666a999999999696111117711116169999999999a6666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 095:555555555555555555555555555555555576666666666a999999999911111111111111119699999999a6666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 096:555555555555555555555555555555555576666666666a999999969111111111111111111999999999a6666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 097:555555555555555555555555555555555576666666666a999999999117111111111111716999999999a6666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 098:5555555555555555555555555555555555766666666666a9999999611711111771111171119999999a66666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 099:55555555555555555555555555555555557666666666675a99999911117111711711171111999999a576666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 100:555555555555555555555555555555555576666666666755aa9999111117771111777111119999aa5576666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 101:55555555555555555555555555555555557666666666755555a99911111111111111111111999a555557666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 102:555555555555555555555555555555555576666666667555555aa9911111111111111111199aa5555557666666666755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 103:55555555555555555555555555555555555766666667555555555aaaaa111111111111aaaaa555555555766666667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 104:555555555555555555555555555555555557666666755555555555555aaa11111111aaa5555555555555576666667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 105:555555555555555555555555555555555555766667555555555555555a88aaaaaaaa88a5555555555555557666675555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 106:55555555555555555555555555555555555557777555555555555555a98888888888669a555555555555555777755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 107:5555555555555555555555555555555555555555555555555555555a9888888888886689a55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 108:555555555555555555555555555555555555555555555555555aaaa998888888888888889aaaa5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 109:555555555555555555555555555555555555555555555555aaa99999988888888888888999999aaa5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 110:55555555555555555555555555555555555555555555555a99966999988886686688888999999999a555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 111:555555555555555555555555555555555555555555555aa9999669999888666666688889999999999aa5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 112:55555555555555555555555555555555555555555555a99999999999988866666668889999999999999a555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 113:5555555555555555555555555555555555555555555a9999999999998888866666888888999999999999a55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 114:555555555555555555555555555555555555555555a999999999999968888866688888899999999999969a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 115:55555555555555555555555555555555555555555a99999999999998888888868888888999999999999999a555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 116:5555555555555555555555555555555555555555a96696999a9999968888888888888888999999a99999999a55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 117:5555555555555555555555555555555555555555a96699999a9999888888888888888888999999a99999999a55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 118:555555555555555555555555555555555555555a99999999a999996688888888888888888996699a99999999a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 119:555555555555555555555555555555555555555a99999999a999996688888888888888888886688a99999969a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 120:55555555555555555555555555555555555555a88999999a96999888888888888888888888888688a89999988a555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 121:5555555555555555555555555555555555555a888888999a69999888888888888888888888888888a888866888a55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 122:5555555555555555555555555555555555555a88888888a6699998888888888888888888888888888a88866888a55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 123:555555555555555555555555555555555555a888888888a9999998888888888888888888888888888a888888888a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 124:555555555555555555555555555555555555a886888888a9999998888888888888888888888888888a888888888a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 125:555555555555555555555555555555555555a888888888a9999998888888888888888888888888888a988888888a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 126:555555555555555555555555555555555555a888668888a9999998888888888888888888888888888a998888888a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 127:55555555555555555555555555555555555a88886688888a999998888888a888888a888888888888a99998888868a555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 128:55555555555555555555555555555555555a888888888886a9999888888a88888888a8888888888a699999986688a555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 129:555555555555555555555555555555555555a88888886666aa9998888aa8888888888aa8888888aa66669999668a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 130:555555555555555555555555555555555555a8888666666667aaaaaaa88888888888888aaaaaaa7666666669998a5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 131:5555555555555555555555555555555555555a8866666666679998888888888888888888888999766666666699a55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 132:555555555555555555555555555555555555557666666666679998888888888888888888888899766666666667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 133:555555555555555555555555555555555555557666666666679998888888888888888888888899766666666667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 134:555555555555555555555555555555555555557666666666799998888888888888888888888899976666666667555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// 135:555555555555555555555555555555555555555777777777799998888888888888888888888899977777777775555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555
// </SCREEN>

// <PALETTE>
// 000:000000f6f4f1413c38a49a8e6f6b62c8f6f1ff9aa7bc505ef9f2dfead1ac705835afc3ff40579a6b2e36000000000000
// </PALETTE>

