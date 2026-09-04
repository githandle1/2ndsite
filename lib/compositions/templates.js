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
    title: "leaves on a tree",
    prompt: "leaves on a tree",
  },
  {
    id: "roses",
    title: "roses in a vase",
    prompt: "roses in a vase",
  },
  {
    id: "nightsky",
    title: "night sky",
    prompt: "night sky with stars and mountains",
  },
  {
    id: "mountains",
    title: "green mountains",
    prompt: "green mountain landscape",
    color: "#3f6244",
  },
  {
    id: "crayonbird",
    title: "crayon bird",
    prompt: "a small bird scribbled in crayon",
    color: "#2a8a86",
    brushType: "crayon",
  },
];

export const templates = {
  fingerprints: `function paint() {
  brush.noStroke();
  brush.fill("#e4d2be", 58);
  brush.fillBleed(0.52);
  brush.fillTexture(0.2, 0.1);
  brush.circle(400, 410, 390, 0.82);

  const prints = [
    { x: 230, y: 290, a: -16, s: 1.42 },
    { x: 575, y: 340, a: 20, s: 1.3 },
    { x: 400, y: 560, a: 6, s: 1.28 }
  ];
  const inks = ["#6b3a32", "#8a4a3c", "#5c322c"];

  for (let p = 0; p < prints.length; p++) {
    const print = prints[p];
    const rad = radians(print.a);
    for (let r = 6; r >= 1; r--) {
      brush.fill(inks[p % inks.length], 32 + r * 8);
      brush.fillBleed(0.22);
      brush.fillTexture(0.35, 0.28);
      const pts = [];
      const rx = (38 + r * 26) * print.s;
      const ry = (50 + r * 34) * print.s;
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
    brush.fill("#4a241f", 74);
    brush.fillBleed(0.12);
    brush.circle(print.x, print.y + 12 * print.s, 22 * print.s, 0.6);
  }

  brush.set("HB", "#5a332c", 0.6);
  for (let i = 0; i < 9; i++) {
    const a = radians(-70 + i * 16);
    brush.line(200, 220, 200 + Math.cos(a) * (72 + random(16)), 220 + Math.sin(a) * (34 + random(12)));
  }
}`,

  coffee: `function paint() {
  brush.noStroke();
  brush.fill("#ead8c4", 28);
  brush.fillBleed(0.42);
  brush.fillTexture(0.14, 0.08);
  brush.circle(400, 170, 190, 0.7);

  brush.fill("#c4b09a", 115);
  brush.fillBleed(0.12);
  brush.fillTexture(0.28, 0.2);
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
  brush.fillTexture(0.24, 0.22);
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
  brush.circle(400, 508, 70, 0.18);

  brush.fill("#c8b49c", 140);
  brush.fillBleed(0.1);
  brush.fillTexture(0.22, 0.2);
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
  brush.fillTexture(0.32, 0.28);
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
  brush.fillTexture(0.18, 0.1);
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
  brush.fillTexture(0.18, 0.1);
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
  brush.fillTexture(0.28, 0.12);
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
    brush.fillTexture(0.22, 0.12);
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

  mountains: `function paint() {
  brush.noStroke();
  brush.fill("#d5e0dc", 40);
  brush.fillBleed(0.55);
  brush.fillTexture(0.16, 0.1);
  brush.circle(400, 180, 280, 0.88);

  brush.fill("#c5d4c8", 34);
  brush.circle(240, 140, 120, 0.8);
  brush.fill("#e4ddd0", 28);
  brush.circle(560, 120, 130, 0.82);

  brush.fill("#7a9488", 58);
  brush.fillBleed(0.36);
  brush.fillTexture(0.28, 0.18);
  brush.polygon([
    [80, 380],
    [180, 280],
    [270, 340],
    [360, 220],
    [470, 310],
    [560, 200],
    [670, 300],
    [760, 250],
    [760, 430],
    [80, 430]
  ]);

  brush.fill("#5d7a62", 70);
  brush.fillBleed(0.3);
  brush.fillTexture(0.34, 0.22);
  brush.polygon([
    [40, 460],
    [150, 360],
    [250, 430],
    [360, 320],
    [480, 410],
    [590, 330],
    [700, 420],
    [780, 360],
    [780, 540],
    [40, 540]
  ]);

  brush.fill("#3f6244", 86);
  brush.fillBleed(0.24);
  brush.fillTexture(0.4, 0.28);
  brush.polygon([
    [20, 540],
    [130, 460],
    [230, 520],
    [340, 430],
    [460, 510],
    [580, 440],
    [700, 520],
    [790, 470],
    [790, 680],
    [20, 680]
  ]);

  const groves = [
    { x: 160, y: 560, r: 70, c: "#35583c" },
    { x: 280, y: 590, r: 82, c: "#2f4e36" },
    { x: 430, y: 570, r: 90, c: "#3d6240" },
    { x: 580, y: 600, r: 78, c: "#2c4a32" },
    { x: 700, y: 560, r: 64, c: "#456848" }
  ];
  for (let i = 0; i < groves.length; i++) {
    const g = groves[i];
    brush.fill(g.c, 78 + random(-8, 12));
    brush.fillBleed(0.28);
    brush.fillTexture(0.42, 0.3);
    brush.circle(g.x + random(-8, 8), g.y, g.r, 0.7);
  }

  brush.fill("#8a9a58", 48);
  brush.fillBleed(0.38);
  brush.circle(360, 640, 70, 0.75);
  brush.fill("#c4b07a", 36);
  brush.circle(500, 660, 54, 0.72);
}`,

  crayonbird: `function paint() {
  brush.set("crayon", "#e08a5a", 1.8);
  for (let i = 0; i < 9; i++) {
    const a = i * 0.7;
    brush.line(
      300 + Math.cos(a) * 70,
      320 + Math.sin(a) * 55,
      470 + Math.cos(a + 1.8) * 150,
      280 + Math.sin(a + 0.8) * 120
    );
  }

  const body = { x: 410, y: 430 };
  brush.set("crayon", "#2a8a86", 1.6);
  for (let i = 0; i < 26; i++) {
    const a = random(-0.8, 1);
    const len = 32 + random(22);
    brush.line(
      body.x + random(-18, 24),
      body.y + random(-14, 16),
      body.x + Math.cos(a) * len + random(-8, 10),
      body.y + Math.sin(a) * (len * 0.5) + random(-6, 8)
    );
  }

  brush.set("crayon", "#c45a6e", 1.2);
  for (let i = 0; i < 10; i++) {
    brush.line(
      body.x + 16 + random(-5, 7),
      body.y - 10 + random(-5, 5),
      body.x + 54 + random(-8, 12),
      body.y - 26 + random(-10, 8)
    );
  }

  brush.set("crayon", "#3d6a4a", 0.75);
  brush.line(body.x - 6, body.y + 16, body.x - 30, body.y + 62);
  brush.line(body.x + 8, body.y + 14, body.x + 2, body.y + 66);
  brush.line(body.x - 30, body.y + 62, body.x - 44, body.y + 54);
  brush.line(body.x + 2, body.y + 66, body.x + 20, body.y + 58);

  brush.set("crayon", "#d45a7a", 1);
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    brush.line(230 + t * 48, 562 + Math.sin(t * 9) * 14, 278 + t * 56, 546 + Math.cos(t * 8) * 18);
  }
}`,
};

export function sampleById(id) {
  return samples.find((item) => item.id === id) ?? samples[0];
}
