// title:   Pat Pat The Pretty Girl
// author:  gaffe
// desc:    a cute dog petting simulator
// site:    artfight.net
// license: MIT License (change this to your license of choice)
// version: 0.1
// script:  js

const SCREEN_W = 240
const SCREEN_H = 136

const LETTERBOX_COLOR = 2
const BACKGROUND_COLOR = 5
const TEXT_COLOR = 1
const TEXT_BORDER_COLOR = 7

let initialized = false
let game = null

class LetterBox {
	TIC() {
		vbank(1)
		rect(0, 0, SCREEN_W / 2 - 64, SCREEN_H, LETTERBOX_COLOR)
		rect(SCREEN_W / 2 + 64, 0, SCREEN_W, SCREEN_H, LETTERBOX_COLOR)
		vbank(0)
	}
}

class Title {
	TIC() {
		printWithBorder("PET THE", 64, 2, TEXT_COLOR, TEXT_BORDER_COLOR, false, 1, false, true)
		printWithBorder("PUPPY PRINCESS", 64, 10, TEXT_COLOR, TEXT_BORDER_COLOR, false, 2, true, true)
		printWithBorder("art fight 2024 - by gaffe for pazu", 64, 22, TEXT_BORDER_COLOR, null, false, 1, true, true)
	}
}

class Game {
	letterBox = new LetterBox()
	title = new Title()

	TIC() {
		cls(BACKGROUND_COLOR)
		poke(0x3FF9, -SCREEN_W / 2 + 64)

		this.title.TIC()
		this.letterBox.TIC()
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

// <TILES>
// 001:eccccccccc888888caaaaaaaca888888cacccccccacc0ccccacc0ccccacc0ccc
// 002:ccccceee8888cceeaaaa0cee888a0ceeccca0ccc0cca0c0c0cca0c0c0cca0c0c
// 003:eccccccccc888888caaaaaaaca888888cacccccccacccccccacc0ccccacc0ccc
// 004:ccccceee8888cceeaaaa0cee888a0ceeccca0cccccca0c0c0cca0c0c0cca0c0c
// 017:cacccccccaaaaaaacaaacaaacaaaaccccaaaaaaac8888888cc000cccecccccec
// 018:ccca00ccaaaa0ccecaaa0ceeaaaa0ceeaaaa0cee8888ccee000cceeecccceeee
// 019:cacccccccaaaaaaacaaacaaacaaaaccccaaaaaaac8888888cc000cccecccccec
// 020:ccca00ccaaaa0ccecaaa0ceeaaaa0ceeaaaa0cee8888ccee000cceeecccceeee
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

