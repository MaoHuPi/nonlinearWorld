const DEBUG = false;
const SQRT3 = Math.sqrt(3);

const bgc = [0, 0, 0];

const cvs = document.getElementById('view'),
	ctx = cvs.getContext('2d');
// [cvs.width, cvs.height] = [1000, 1000];
[cvs.width, cvs.height] = [100, 100];
const cvsTemp = document.createElement('canvas'),
	ctxTemp = cvsTemp.getContext('2d');

let mode = 0;

class Cube {
	constructor({
		pos: [x, y, z] = [0, 0, 0],
		size: [w, h, d] = [10, 10, 10],
		color: [r, g, b] = [255, 255, 255],
		opacity = 1
	} = {}) {
		this.pos = [x, y, z];
		this.size = [w, h, d];
		this.color = [r, g, b];
		this.opacity = opacity;
	}
	toTri() {
		let [x, y, z] = this.pos;
		let [w, h, d] = this.size;
		let [hw, hh, hd] = [w / 2, h / 2, d / 2];
		let points = new Array(2 ** 3)
			.fill(0)
			.map((_, i) => i
				.toString(2)
				.padStart(3, '0')
				.split('')
				.map((n, j) => ((n == '1' ? 1 : -1) * [hw, hh, hd][j]) + ([x, y, z][j]))
			);
		return [
			[0, 1, 2], [3, 2, 1],
			[6, 7, 4], [5, 4, 7],
			[0, 4, 1], [5, 1, 4],
			[3, 7, 2], [6, 2, 7],
			[0, 2, 4], [6, 4, 2],
			[3, 1, 7], [5, 7, 1]
		].map(tri => ({
			points: tri.map(index => points[index]),
			texture: {
				type: 'color',
				color: this.color,
				opacity: this.opacity
			}
		}));
	}
}

let cubeR = new Cube({
	pos: [-6, -15, 0],
	size: [10, 10, 10],
	color: [255, 0, 0],
	opacity: 1
});
let cubeG = new Cube({
	pos: [-6, 0, 0],
	size: [10, 10, 10],
	color: [0, 255, 0],
	opacity: 1
});
let cubeB = new Cube({
	pos: [-6, 15, 0],
	size: [10, 10, 10],
	color: [0, 0, 255],
	opacity: 1
});
let scene = [
	...cubeR.toTri(),
	...cubeG.toTri(),
	...cubeB.toTri(), 
	{
		points: [
			[-0.5, 10, -10],
			[-0.5, 10, 10],
			[-0.5, -10, -10]
		],
		texture: {
			type: 'image',
			url: 'image/maohupi_logo.jpg',
			anchors: [
				[911, 911],
				[911, 0],
				[0, 911],
			]
		}
	},
	{
		points: [
			[-0.5, -10, 10],
			[-0.5, -10, -10],
			[-0.5, 10, 10]
		],
		texture: {
			type: 'image',
			url: 'image/maohupi_logo.jpg',
			anchors: [
				[0, 0],
				[0, 911],
				[911, 0],
			]
		}
	},
];

let [viewW, viewH] = [100, 100];
let [xm, ym] = [viewW / 2, viewH / 2];
let [px, py, pz] = [0, 0, 0];
let [theta1, theta2] = [0, 0];
let alpha = 0.01;

function h2rgb(h) {
	let c = 0.5, m = 0,
		x = 1 - Math.abs((h / 60) % 2 - 1);
	let [r, g, b] =
		0 <= h && h < 60 ? [c, x, 0] :
			60 <= h && h < 120 ? [x, c, 0] :
				120 <= h && h < 180 ? [0, c, x] :
					180 <= h && h < 240 ? [0, x, c] :
						240 <= h && h < 300 ? [x, 0, c] :
							300 <= h && h <= 360 ? [c, 0, x] :
								[0, 0, 0];
	return [r, g, b].map(a => (a + m) * 255);
}
function rgb2h(r, g, b) {
	[r, g, b] = [r, g, b].map(a => a / 255);
	let cMax = Math.max(r, g, b),
		cMin = Math.min(r, g, b),
		delta = cMax - cMin;
	return delta == 0 ? 0 :
		cMax == r ? 60 * (((g - b) / delta) % 6) :
			cMax == g ? 60 * ((b - r) / delta + 2) :
				cMax == b ? 60 * ((r - g) / delta + 4) :
					0
}

function render() {
	for (let pxX = 0; pxX < cvs.width; pxX++) {
		let xi = pxX / cvs.width * viewW;
		for (let pxY = 0; pxY < cvs.width; pxY++) {
			let yi = pxY / cvs.width * viewW;
			let colorList = [];

			let [s1, c1] = [Math.sin(theta1), Math.cos(theta1)],
				[s2, c2] = [Math.sin(theta2), Math.cos(theta2)];
			let r = [1, 1, Math.sqrt((xi - xm) ** 2 + (yi - ym) ** 2)][mode];
			let [dx, dy, dz] = [
				-1,
				alpha * (xi - xm),
				alpha * (ym - yi)
			]
			let [drd_x, drd_y, drd_z] = [-dy * s2 + dz * s1 * c2, dy * c2 + dz * s1 * s2, dz * c1],
				[d_x, d_y, d_z] = [-c1 * c2, -c1 * s2, s1];

			function convergeDistance_color_opacity(xi, yi, [A, B, C], texture, [px, py, pz], [theta1, theta2], alpha) {
				let [ax, ay, az] = A,
					[bx, by, bz] = B,
					[cx, cy, cz] = C;
				let [abac_x, abac_y, abac_z] = [
					(by - ay) * (cz - az) - (cy - ay) * (bz - az),
					(bz - az) * (cx - ax) - (cz - az) * (bx - ax),
					(bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
				]

				// step 1: get "d"
				let alpha_drd = (abac_x * drd_x + abac_y * drd_y + abac_z * drd_z),
					alpha_d = (abac_x * d_x + abac_y * d_y + abac_z * d_z),
					alpha_c = (abac_x * (px - ax) + abac_y * (py - ay) + abac_z * (pz - az));
				let f = d => d * [1, d, r ** d][mode] * alpha_drd + d * alpha_d + alpha_c,
					f_d = d => alpha_drd * [1, d, r ** d][mode] * (1 + d * Math.log/*ln*/(r)) + alpha_d;

				let d;
				if (r == 0) {
					d = -alpha_c / alpha_d;
				} else {
					let xn = 0;
					for (let i = 0; i < 3; i++) { xn = xn - f(xn) / f_d(xn); }
					d = xn;
				}
				if (DEBUG) console.log(d);

				// step 2: find converge point
				let drd = d * [1, d, r ** d][mode];
				let [x, y, z] = [px + d * d_x + drd * drd_x, py + d * d_y + drd * drd_y, pz + d * d_z + drd * drd_z];
				if (DEBUG) console.log(x, y, z);

				//step 3: calculate u, v
				let u, v;
				let [div_x, div_y, div_z] = [
					(cy - ay) * (bx - ax) - (by - ay) * (cx - ax),
					(cz - az) * (by - ay) - (bz - az) * (cy - ay),
					(cx - ax) * (bz - az) - (bx - ax) * (cz - az)
				];
				if (div_x !== 0) {
					v = (bx - ax - by + ay) * (x - ax) / div_x;
				} else if (div_y !== 0) {
					v = (by - ay - bz + az) * (y - ay) / div_y;
				} else if (div_z !== 0) {
					v = (bz - az - bx + ax) * (z - az) / div_z;
				}
				if (bx - ax !== 0) {
					u = ((x - ax) - v * (cx - ax)) / (bx - ax);
				} else if (by - ay !== 0) {
					u = ((y - ay) - v * (cy - ay)) / (by - ay);
				} else if (bz - az !== 0) {
					u = ((z - az) - v * (cz - az)) / (bz - az);
				}
				if (DEBUG) console.log(u, v);

				// step 4: filter
				d = (u >= 0 && v >= 0 && u + v <= 1 && d >= 0) ? d : undefined;
				if (DEBUG) console.log(d);

				// return
				let color = [0, 0, 0], opacity = 0;
				switch (texture.type) {
					case 'color':
						color = texture.color;
						opacity = texture.opacity;
						break;
					case 'colors':
						let standardizedBase = [
							[SQRT3 / 2, -1 / 2],
							[-SQRT3 / 2, -1 / 2],
							[0, 1]
						];
						let standardizedPos = [SQRT3 / 2 - u * SQRT3 - v * SQRT3 / 2, -1 / 2 + v * 3 / 2];
						let standardizedTotalDistance = 0;
						// let totalRgb = [0, 0, 0];
						for (let i = 0; i < 3; i++) {
							let standardizedDistance = SQRT3 - Math.sqrt((standardizedBase[i][0] - standardizedPos[0]) ** 2 + (standardizedBase[i][1] - standardizedPos[1]) ** 2);
							// let rgb = h2rgb(texture.colors[i][0])
							// for (let j = 0; j < 3; j++) { totalRgb[j] += rgb[j] * standardizedDistance; }
							color[0] += texture.colors[i][0] * standardizedDistance;
							color[1] += texture.colors[i][1] * standardizedDistance;
							color[2] += texture.colors[i][2] * standardizedDistance;
							opacity += texture.opacity[i] * standardizedDistance;
							standardizedTotalDistance += standardizedDistance;
						}
						// color[0] = rgb2h(...totalRgb.map(a => a / standardizedTotalDistance));
						color[0] /= standardizedTotalDistance;
						color[1] /= standardizedTotalDistance;
						color[2] /= standardizedTotalDistance;
						opacity /= standardizedTotalDistance;
						break;
					case 'image':
						let [dataX, dataY] = [
							texture.anchors[0][0] + u * (texture.anchors[1][0] - texture.anchors[0][0]) + v * (texture.anchors[2][0] - texture.anchors[0][0]),
							texture.anchors[0][1] + u * (texture.anchors[1][1] - texture.anchors[0][1]) + v * (texture.anchors[2][1] - texture.anchors[0][1])
						],
							dataIndex = (Math.floor(dataX) + Math.floor(dataY) * texture.imageWidth) * 4;
						color = [texture.data[dataIndex] / 255, texture.data[dataIndex + 1] / 255, texture.data[dataIndex + 2] / 255];
						opacity = texture.data[dataIndex + 3];
						break;
				}
				return { d, color, opacity };
			}
			for (let tri of scene) {
				let { d, color, opacity } = convergeDistance_color_opacity(xi, yi, tri.points, tri.texture, [px, py, pz], [theta1, theta2], alpha);
				if (Number.isFinite(d)) {
					colorList.push({ d, color, opacity });
				}
			}
			// step 5: set color
			if (colorList.length > 0) {
				colorList = colorList.sort((a, b) => a.d - b.d);
				let color = [0, 0, 0];
				let opacity = 1;
				for (let data of colorList) {
					color[0] += data.color[0] * opacity * data.opacity;
					color[1] += data.color[1] * opacity * data.opacity;
					color[2] += data.color[2] * opacity * data.opacity;
					opacity = opacity * (1 - data.opacity);
					if (opacity == 0) break;
				}
				color[0] += bgc[0] * opacity;
				color[1] += bgc[1] * opacity;
				color[2] += bgc[2] * opacity;
				// ctx.fillStyle = `hsl(${color[0]}, ${color[1]}%, ${color[2]}%)`; // temp
				ctx.fillStyle = `rgb(${color.join(',')})`; // temp
			} else {
				// ctx.fillStyle = `hsl(${bgc[0]}, ${bgc[1]}%, ${bgc[2]}%)`;
				ctx.fillStyle = `rgb(${bgc.join(',')})`;
			}
			if (r == 0) ctx.fillStyle = 'white';
			ctx.fillRect(pxX, pxY, 1, 1);
		}
	}
}

let deltaTheta1 = Math.PI / 4;
let deltaTheta2 = Math.PI / 4;
let deltaFB = 1;
let deltaLR = 1;
let deltaUD = 1;
document.addEventListener('keydown', event => {
	switch (event.key) {
		case 'm':
			mode = (mode + 1) % 3;
			break;
		case 'ArrowUp':
			theta1 += deltaTheta1;
			break;
		case 'ArrowDown':
			theta1 -= deltaTheta1;
			break;
		case 'ArrowLeft':
			theta2 += deltaTheta2;
			break;
		case 'ArrowRight':
			theta2 -= deltaTheta2;
			break;
		case 'w':
			px -= Math.cos(theta2) * deltaFB;
			py -= Math.sin(theta2) * deltaFB;
			break;
		case 's':
			px += Math.cos(theta2) * deltaFB;
			py += Math.sin(theta2) * deltaFB;
			break;
		case 'a':
			px += Math.sin(theta2) * deltaLR;
			py -= Math.cos(theta2) * deltaLR;
			break;
		case 'd':
			px -= Math.sin(theta2) * deltaLR;
			py += Math.cos(theta2) * deltaLR;
			break;
		case 'q':
			pz += deltaUD;
			break;
		case 'z':
			pz -= deltaUD;
			break;
	}
	render();
});

function loadImage(src) {
	return new Promise(solve => {
		let image = new Image();
		image.onload = () => {
			solve(image);
		}
		image.src = src;
	});
}
async function main() {
	for (let tri of scene) {
		if (tri.texture.url) {
			let image = await loadImage(tri.texture.url);
			[cvsTemp.width, cvsTemp.height] = [image.width, image.height];
			ctxTemp.drawImage(image, 0, 0);
			tri.texture.data = ctxTemp.getImageData(0, 0, cvsTemp.width, cvsTemp.height).data;
			tri.texture.imageWidth = image.width;
		}
	}

	mode = 1;
	[px, py, pz] = [7.564971157455602, 17.435028842544405, 21];
	[theta1, theta2] = [-0.7853981633974483, 0.7853981633974483];
	// [cvs.width, cvs.height] = [1080, 1080];
	[cvs.width, cvs.height] = [100, 100];

	render();
}
main();