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
            [0, "#514341"],
            [5, "#5c4a47"],
            [8, "#645149"],
            [12, "#6b584e"],
            [16, "#675046"],
            [18.5, "#60473f"],
            [20.5, "#58413f"],
            [24, "#514341"]
        ]
    };

    const skyStops = [
        [0, "#6f6a9a"],
        [5, "#d08a78"],
        [8, "#e0b06a"],
        [12, "#d8c46a"],
        [16, "#d49258"],
        [18.5, "#c46e4a"],
        [20.5, "#9a6a86"],
        [24, "#6f6a9a"]
    ];

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
            "--ink": "#f3eadf",
            "--hover": "#d98e92",
            "--line": "rgba(217, 142, 146, 0.32)",
            "--muted": "rgba(243, 234, 223, 0.65)",
            "--overlay-ink": "#f3eadf",
            "--overlay-backdrop": "rgba(12, 10, 9, 0.82)",
            "--paper-frame-base": "#9a7868",
            "--paper-frame-share": "82%",
            "--paper-highlight": "#8a7165",
            "--toggle-mix-target": "var(--ink)",
            "--stain-blend": "screen",
            "--stain-opacity": "0.24",
            "--stain-right-opacity": "0.22",
            "--stain-filter": "saturate(1.25) brightness(0.74)"
        }
    };

    const STORAGE_KEY = "cabinet-scheme";

    const toRgb = (hex) => [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16)
    ];

    const colorAt = (palette, hour) => {
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

    const readStoredScheme = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "light" || stored === "dark") {
                return stored;
            }
        } catch {
            // Private mode can block storage.
        }

        return null;
    };

    const writeStoredScheme = (scheme) => {
        try {
            if (scheme === "light" || scheme === "dark") {
                localStorage.setItem(STORAGE_KEY, scheme);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // Ignore quota / privacy failures.
        }
    };

    let chosenScheme = requestedScheme === "dark" || requestedScheme === "light"
        ? requestedScheme
        : readStoredScheme();

    const activeScheme = () => {
        if (chosenScheme === "dark" || chosenScheme === "light") {
            return chosenScheme;
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

    const syncPicker = () => {
        const scheme = activeScheme();

        document.querySelectorAll("[data-scheme]").forEach((button) => {
            button.setAttribute("aria-pressed", button.dataset.scheme === scheme ? "true" : "false");
        });
    };

    const updatePaper = () => {
        const root = document.documentElement;
        const scheme = activeScheme();
        const hour = localHour();

        root.dataset.scheme = scheme;
        root.style.colorScheme = scheme;
        root.style.setProperty("--paper", colorAt(palettes[scheme], hour));
        root.style.setProperty("--day-dot", colorAt(skyStops, hour));
        Object.entries(themes[scheme]).forEach(([name, value]) => {
            root.style.setProperty(name, value);
        });
        syncPicker();
    };

    const setScheme = (scheme) => {
        if (scheme !== "light" && scheme !== "dark") {
            return;
        }

        chosenScheme = scheme;
        writeStoredScheme(scheme);
        updatePaper();
    };

    const initDaylightControl = () => {
        const picker = document.getElementById("daylight-picker");

        if (!picker) {
            return;
        }

        picker.querySelectorAll("[data-scheme]").forEach((button) => {
            button.addEventListener("click", () => {
                setScheme(button.dataset.scheme);
            });
        });

        syncPicker();
    };

    updatePaper();
    window.setInterval(updatePaper, 60_000);

    if (typeof preferredScheme.addEventListener === "function") {
        preferredScheme.addEventListener("change", updatePaper);
    } else if (typeof preferredScheme.addListener === "function") {
        preferredScheme.addListener(updatePaper);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initDaylightControl);
    } else {
        initDaylightControl();
    }

    window.paperTime = {
        setScheme,
        getScheme: activeScheme,
        updatePaper
    };
})();
