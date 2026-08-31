(() => {
    const palette = [
        [0, "#eee9e1"],
        [5, "#f3e9df"],
        [8, "#f8f1e7"],
        [12, "#faf9f6"],
        [16, "#f8f2e7"],
        [18.5, "#f3e4d2"],
        [20.5, "#eee5df"],
        [24, "#eee9e1"]
    ];

    const toRgb = (hex) => [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16)
    ];

    const paperAt = (hour) => {
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

    const requestedHour = Number.parseFloat(new URLSearchParams(location.search).get("hour"));

    const localHour = () => {
        if (Number.isFinite(requestedHour)) {
            return requestedHour;
        }

        const now = new Date();
        return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    };

    const updatePaper = () => {
        document.documentElement.style.setProperty("--paper", paperAt(localHour()));
    };

    updatePaper();
    window.setInterval(updatePaper, 60_000);
})();
