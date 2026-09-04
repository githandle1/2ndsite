export const samples = [
  {
    id: "fingerprints",
    title: "fingerprints",
    prompt: "fingerprints",
  },
  {
    id: "coffee",
    title: "morning coffee",
    prompt: "morning cup of coffee",
    color: "#6b3a28",
    brushType: "HB",
  },
  {
    id: "leaves",
    title: "tree",
    prompt: "leaves on a tree",
  },
  {
    id: "roses",
    title: "roses",
    prompt: "roses in a vase",
  },
  {
    id: "nightsky",
    title: "night sky",
    prompt: "night sky with stars and mountains",
  },
];

export const templates = {
  fingerprints: `function paint() {
  brush.noStroke();
  brush.fill("#e8d8c6", 48);
  brush.fillBleed(0.36);
  brush.fillTexture(0.42, 0.28);
  brush.circle(400, 430, 260, 0.85);

  const prints = [
    { x: 330, y: 360, a: -18, s: 1 },
    { x: 470, y: 390, a: 22, s: 0.92 },
    { x: 400, y: 500, a: 8, s: 0.84 }
  ];
  const inks = ["#6b3a32", "#8a4a3c", "#5c322c"];

  for (let p = 0; p < prints.length; p++) {
    const print = prints[p];
    const rad = radians(print.a);
    for (let r = 6; r >= 1; r--) {
      brush.fill(inks[p % inks.length], 42 + r * 10);
      brush.fillBleed(0.16);
      brush.fillTexture(0.55, 0.42);
      const pts = [];
      const rx = (18 + r * 14) * print.s;
      const ry = (24 + r * 18) * print.s;
      for (let i = 0; i < 16; i++) {
        const t = (i / 16) * Math.PI * 2;
        const wobble = 1 + random(-0.08, 0.1);
        const x = Math.cos(t) * rx * wobble;
        const y = Math.sin(t) * ry * wobble;
        pts.push([
          print.x + x * Math.cos(rad) - y * Math.sin(rad),
          print.y + x * Math.sin(rad) + y * Math.cos(rad)
        ]);
      }
      brush.polygon(pts);
    }
    brush.fill("#4a241f", 70);
    brush.fillBleed(0.12);
    brush.circle(print.x, print.y + 6 * print.s, 11 * print.s, 0.6);
  }

  brush.set("HB", "#5a332c", 0.45);
  for (let i = 0; i < 9; i++) {
    const a = radians(-70 + i * 16);
    brush.line(328, 318, 328 + Math.cos(a) * (38 + random(10)), 318 + Math.sin(a) * (18 + random(8)));
  }
}`,

  coffee: `function paint() {
  brush.noStroke();
  brush.fill("#ead8c4", 44);
  brush.fillBleed(0.3);
  brush.fillTexture(0.4, 0.26);
  brush.circle(400, 170, 190, 0.7);

  brush.fill("#c4b09a", 115);
  brush.fillBleed(0.12);
  brush.fillTexture(0.42, 0.3);
  const saucer = [];
  for (let i = 0; i < 18; i++) {
    const t = (i / 18) * Math.PI * 2;
    saucer.push([400 + Math.cos(t) * (170 + random(-2, 2)), 548 + Math.sin(t) * (34 + random(-1, 2))]);
  }
  brush.polygon(saucer);
  brush.fill("#9e8a74", 80);
  brush.fillBleed(0.1);
  const well = [];
  for (let i = 0; i < 14; i++) {
    const t = (i / 14) * Math.PI * 2;
    well.push([400 + Math.cos(t) * 114, 542 + Math.sin(t) * 16]);
  }
  brush.polygon(well);

  brush.fill("#d4c0aa", 175);
  brush.fillBleed(0.1);
  brush.fillTexture(0.4, 0.32);
  const body = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    body.push([328 + t * 8 + random(-2, 2), 392 + t * 130]);
  }
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    body.push([400 + Math.cos(a) * 72, 522 - Math.sin(a) * 22]);
  }
  for (let i = 8; i >= 0; i--) {
    const t = i / 8;
    body.push([472 - t * 8 + random(-2, 2), 392 + t * 130]);
  }
  brush.polygon(body);
  brush.fill("#b3947a", 95);
  brush.fillBleed(0.1);
  brush.circle(400, 508, 70, 0.42);

  brush.fill("#c8b49c", 140);
  brush.fillBleed(0.1);
  brush.fillTexture(0.38, 0.3);
  const handle = [];
  for (let i = 0; i <= 12; i++) {
    const a = -0.4 + (i / 12) * 2;
    handle.push([500 + Math.cos(a) * 42, 438 + Math.sin(a) * 40]);
  }
  for (let i = 12; i >= 0; i--) {
    const a = -0.4 + (i / 12) * 2;
    handle.push([500 + Math.cos(a) * 22, 438 + Math.sin(a) * 22]);
  }
  brush.polygon(handle);

  brush.fill("#efe6dc", 130);
  brush.fillBleed(0.08);
  const rim = [];
  for (let i = 0; i < 18; i++) {
    const t = (i / 18) * Math.PI * 2;
    rim.push([400 + Math.cos(t) * (78 + random(-1, 2)), 390 + Math.sin(t) * (24 + random(-1, 1))]);
  }
  brush.polygon(rim);

  brush.fill("#3d1c10", 190);
  brush.fillBleed(0.08);
  brush.fillTexture(0.46, 0.36);
  const coffee = [];
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    coffee.push([400 + Math.cos(t) * (60 + random(-1, 1)), 392 + Math.sin(t) * (16 + random(-1, 1))]);
  }
  brush.polygon(coffee);
  brush.fill("#241008", 120);
  const throat = [];
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2;
    throat.push([404 + Math.cos(t) * 34, 394 + Math.sin(t) * 9]);
  }
  brush.polygon(throat);
  brush.fill("#c4a07a", 55);
  brush.circle(376, 388, 12, 0.3);

  brush.fill("#d9cfc4", 28);
  brush.fillBleed(0.28);
  brush.circle(376, 248, 16, 0.6);
  brush.circle(400, 214, 12, 0.65);
  brush.circle(422, 246, 14, 0.6);
}`,

  leaves: `function paint() {
  brush.noStroke();
  brush.fill("#d7e0d4", 36);
  brush.fillBleed(0.55);
  brush.fillTexture(0.34, 0.22);
  brush.circle(420, 240, 300, 0.9);

  brush.fill("#6b4a32", 90);
  brush.fillBleed(0.22);
  brush.fillTexture(0.4, 0.28);
  brush.polygon([
    [372, 760],
    [428, 760],
    [412, 430],
    [388, 428]
  ]);
  brush.fill("#5a3c28", 70);
  brush.polygon([
    [412, 560],
    [478, 500],
    [468, 478],
    [408, 530]
  ]);

  const greens = ["#3f6b46", "#2f5840", "#5a7a48", "#48683c", "#6e8b52"];
  for (let i = 0; i < 28; i++) {
    const a = random(Math.PI * 2);
    const d = random(20, 210);
    const x = 400 + Math.cos(a) * d * 0.95;
    const y = 300 + Math.sin(a) * d * 0.72;
    brush.fill(greens[i % greens.length], 70 + random(-10, 16));
    brush.fillBleed(0.3);
    brush.fillTexture(0.42, 0.3);
    const pts = [];
    const rot = a + random(-0.4, 0.4);
    for (let k = 0; k < 8; k++) {
      const t = (k / 8) * Math.PI * 2;
      const rx = 34 + random(-8, 10);
      const ry = 18 + random(-5, 7);
      pts.push([
        x + Math.cos(t) * rx * Math.cos(rot) - Math.sin(t) * ry * Math.sin(rot),
        y + Math.cos(t) * rx * Math.sin(rot) + Math.sin(t) * ry * Math.cos(rot)
      ]);
    }
    brush.polygon(pts);
  }

  brush.set("2H", "#3a4f32", 0.55);
  brush.line(400, 430, 310, 250);
  brush.line(400, 430, 490, 240);
  brush.line(412, 520, 520, 360);
}`,

  roses: `function paint() {
  brush.noStroke();
  brush.fill("#eadcc8", 34);
  brush.fillBleed(0.5);
  brush.fillTexture(0.34, 0.22);
  brush.circle(400, 470, 240, 0.8);

  brush.fill("#7a8b8c", 88);
  brush.fillBleed(0.24);
  brush.fillTexture(0.4, 0.3);
  brush.polygon([
    [338, 470],
    [462, 470],
    [444, 690],
    [356, 690]
  ]);
  brush.fill("#9aa7a6", 55);
  brush.circle(400, 478, 58, 0.4);
  brush.fill("#5f6e70", 70);
  brush.polygon([
    [356, 690],
    [444, 690],
    [430, 720],
    [370, 720]
  ]);

  brush.fill("#3d6a46", 78);
  brush.fillBleed(0.26);
  brush.polygon([
    [300, 430],
    [250, 390],
    [268, 340],
    [330, 370],
    [348, 430]
  ]);
  brush.fill("#2f5840", 74);
  brush.polygon([
    [470, 440],
    [530, 400],
    [548, 460],
    [500, 500],
    [458, 480]
  ]);

  brush.set("HB", "#35583c", 0.7);
  brush.line(400, 470, 360, 300);
  brush.line(400, 470, 410, 270);
  brush.line(400, 470, 460, 310);

  const blooms = [
    { x: 356, y: 286, c: "#c45b5f" },
    { x: 414, y: 248, c: "#b43c48" },
    { x: 468, y: 300, c: "#d46a6e" }
  ];
  for (const rose of blooms) {
    for (let i = 0; i < 6; i++) {
      const a = radians(i * 60 + random(-8, 8));
      brush.fill(rose.c, 78 + random(-8, 10));
      brush.fillBleed(0.32);
      brush.fillTexture(0.46, 0.36);
      const pts = [];
      for (let k = 0; k < 8; k++) {
        const t = (k / 8) * Math.PI * 2;
        const rx = 28 + random(-5, 7);
        const ry = 16 + random(-4, 5);
        pts.push([
          rose.x + Math.cos(a) * 16 + Math.cos(t) * rx * Math.cos(a) - Math.sin(t) * ry * Math.sin(a),
          rose.y + Math.sin(a) * 14 + Math.cos(t) * rx * Math.sin(a) + Math.sin(t) * ry * Math.cos(a)
        ]);
      }
      brush.polygon(pts);
    }
    brush.fill("#7a2430", 90);
    brush.fillBleed(0.16);
    brush.circle(rose.x, rose.y, 12, 0.45);
  }
}`,

  nightsky: `function paint() {
  brush.noStroke();
  brush.fill("#3a4560", 58);
  brush.fillBleed(0.5);
  brush.fillTexture(0.4, 0.24);
  brush.circle(400, 260, 300, 0.82);

  brush.fill("#2c354c", 64);
  brush.fillBleed(0.44);
  brush.circle(250, 200, 170, 0.76);

  brush.fill("#4a3d62", 42);
  brush.circle(560, 210, 180, 0.8);

  brush.fill("#efe4d0", 52);
  brush.fillBleed(0.4);
  brush.circle(560, 150, 52, 0.62);
  brush.fill("#f7f1e4", 88);
  brush.fillBleed(0.16);
  brush.circle(564, 146, 24, 0.36);

  const stars = [
    [160, 90],
    [230, 160],
    [300, 70],
    [370, 130],
    [430, 50],
    [490, 190],
    [620, 90],
    [680, 170],
    [140, 230],
    [330, 210],
    [200, 280],
    [450, 100],
    [700, 230],
    [280, 120],
    [540, 260]
  ];
  for (let i = 0; i < stars.length; i++) {
    brush.fill("#f2ead8", 72 + random(-10, 16));
    brush.fillBleed(0.1);
    brush.fillTexture(0.36, 0.22);
    brush.circle(stars[i][0] + random(-6, 6), stars[i][1] + random(-6, 6), 3 + random(5), 0.52);
  }

  brush.fill("#4a5468", 78);
  brush.fillBleed(0.28);
  brush.fillTexture(0.34, 0.22);
  brush.polygon([
    [60, 520],
    [160, 430],
    [250, 490],
    [360, 380],
    [470, 460],
    [580, 390],
    [690, 470],
    [760, 430],
    [760, 580],
    [60, 580]
  ]);

  brush.fill("#323a4c", 92);
  brush.fillBleed(0.22);
  brush.fillTexture(0.4, 0.28);
  brush.polygon([
    [40, 560],
    [140, 490],
    [240, 540],
    [350, 460],
    [470, 530],
    [590, 470],
    [710, 540],
    [770, 500],
    [770, 700],
    [40, 700]
  ]);

  brush.fill("#2a3140", 80);
  brush.fillBleed(0.2);
  brush.circle(200, 620, 70, 0.68);
  brush.circle(480, 640, 88, 0.66);
  brush.circle(660, 610, 64, 0.7);
}`,
};

export function sampleById(id) {
  return samples.find((item) => item.id === id) ?? samples[0];
}
