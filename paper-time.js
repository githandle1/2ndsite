(() => {
    const palettes = {
        light: [
            [0, "#eee9e1"],
            [5, "#f3e9df"],
            [8, "#f8f1e7"],
            [12, "#faf9f6"],
            [16, "#f8f2e7"],
            [18.5, "#f3e4d2"],
            [20.5, "#eee5df"],
            [24, "#eee9e1"]
        ],
        dark: [
            [0, "#211b1a"],
            [5, "#28201f"],
            [8, "#2d2421"],
            [12, "#332a25"],
            [16, "#31261f"],
            [18.5, "#2d211d"],
            [20.5, "#271c1c"],
            [24, "#211b1a"]
        ]
    };

    const themes = {
        light: {
            "--ink": "#24211f",
            "--hover": "#8b2f32",
            "--line": "rgba(139, 47, 50, 0.2)",
            "--muted": "rgba(36, 33, 31, 0.58)",
            "--overlay-ink": "var(--paper)",
            "--overlay-backdrop": "rgba(36, 33, 31, 0.72)",
            "--paper-frame-base": "#ded8cf",
            "--paper-frame-share": "70%",
            "--paper-highlight": "white",
            "--toggle-mix-target": "white",
            "--stain-blend": "multiply",
            "--stain-opacity": "0.47",
            "--stain-right-opacity": "0.40",
            "--stain-filter": "none"
        },
        dark: {
            "--ink": "#eee7dc",
            "--hover": "#c6797d",
            "--line": "rgba(198, 121, 125, 0.28)",
            "--muted": "rgba(238, 231, 220, 0.60)",
            "--overlay-ink": "#eee7dc",
            "--overlay-backdrop": "rgba(12, 10, 9, 0.82)",
            "--paper-frame-base": "#6b5548",
            "--paper-frame-share": "82%",
            "--paper-highlight": "#55463f",
            "--toggle-mix-target": "var(--ink)",
            "--stain-blend": "screen",
            "--stain-opacity": "0.18",
            "--stain-right-opacity": "0.16",
            "--stain-filter": "saturate(0.62) brightness(0.82)"
        }
    };

    const toRgb = (hex) => [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16)
    ];

    const paperAt = (palette, hour) => {
        const normalizedHour = ((hour % 24) + 24) % 24;
        const endIndex = palette.findIndex(([stop]) => stop >= normalizedHour);
        const [startHour, startHex] = palette[Math.max(0, endIndex - 1)];
        const [endHour, endHex] = palette[endIndex];
        const progress = (normalizedHour - startHour) / (endHour - startHour || 1);
        const start = toRgb(startHex);
        const end = toRgb(endHex);
        const channels = start.map((channel, index) =>
            Math.round(channel + (end[index] - channel) * progress)
        );

        return `rgb(${channels.join(" ")})`;
    };

    const params = new URLSearchParams(location.search);
    const requestedHour = Number.parseFloat(params.get("hour"));
    const requestedScheme = params.get("scheme");
    const preferredScheme = window.matchMedia("(prefers-color-scheme: dark)");

    const activeScheme = () => {
        if (requestedScheme === "dark" || requestedScheme === "light") {
            return requestedScheme;
        }

        return preferredScheme.matches ? "dark" : "light";
    };

    const localHour = () => {
        if (Number.isFinite(requestedHour)) {
            return requestedHour;
        }

        const now = new Date();
        return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    };

    const updatePaper = () => {
        const root = document.documentElement;
        const scheme = activeScheme();

        root.dataset.scheme = scheme;
        root.style.colorScheme = scheme;
        root.style.setProperty("--paper", paperAt(palettes[scheme], localHour()));
        Object.entries(themes[scheme]).forEach(([name, value]) => {
            root.style.setProperty(name, value);
        });
    };

    updatePaper();
    window.setInterval(updatePaper, 60_000);

    if (typeof preferredScheme.addEventListener === "function") {
        preferredScheme.addEventListener("change", updatePaper);
    } else if (typeof preferredScheme.addListener === "function") {
        preferredScheme.addListener(updatePaper);
    }
})();
