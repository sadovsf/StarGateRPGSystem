export default class TokenSg extends TokenDocument {
    /**
   * Get an Array of attribute choices which could be tracked for Actors in the Combat Tracker
   * @param {object} data
   * @param {string[]} _path
   * @returns {object}
   * @override
   */
    static getTrackedAttributes(data, _path = []) {
        if (!data) {
            data = {};
            for (let model of Object.values(game.model.Actor)) {
                foundry.utils.mergeObject(data, model);
            }
        }

        // Track the path and record found attributes
        const attributes = { bar: [], value: [] };

        // Recursively explore the object
        for (let [k, v] of Object.entries(data)) {
            let p = _path.concat([k]);

            // Check objects for both a "value" and a "max"
            if (v instanceof Object) {
                if (k === "_source") continue;
                const isBar = ("value" in v) && ("max" in v);
                if (isBar) attributes.bar.push(p);
                else {
                    const inner = this.getTrackedAttributes(data[k], p);
                    attributes.bar.push(...inner.bar);
                    attributes.value.push(...inner.value);
                }
            }

            // Otherwise, identify values which are numeric or null
            else if (Number.isNumeric(v) || (v === null)) {
                attributes.value.push(p);
            }
        }

        if (_path.length === 0) {
            if (!attributes.bar.find(x => x.includes("health"))) {
                attributes.bar.push(["health"]);
            }
        }

        return attributes;
    }
}