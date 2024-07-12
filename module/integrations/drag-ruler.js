// Drag Ruler integration
Hooks.once("dragRuler.ready", (SpeedProvider) => {
    class SGSpeedProvider extends SpeedProvider {
        get colors() {
            return [
                { id: "walk", default: 0x0000FF, name: "Walking Speed" },
                { id: "dash", default: 0x00DE00, name: "Dashing Speed" }
            ];
        }

        getRanges(token) {
            const walkspeed = token.actor?.system.speed || 0;
            const dashspeed = walkspeed * 2;

            const ranges = [
                { range: walkspeed, color: "walk" },
                { range: dashspeed, color: "dash" }
            ];

            return ranges;
        }
    }

    dragRuler.registerSystem("sgrpg", SGSpeedProvider);
});