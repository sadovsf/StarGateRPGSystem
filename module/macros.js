
/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export function createSgMacro(data, slot) {
    if (data?.type !== "Item") return;
    if (!data.uuid) return console.error("SGRPG item macro creation received data without a UUID set: " + data);
    // Do the actual macro creation separately so the hook can return false and prevent the default handling
    (async () => {
        const item = await fromUuid(data.uuid);
        if (!item?.actor) return ui.notifications.warn("You can only create macro buttons for owned Items");

        // Create the macro command
        const command = `game.sgrpg.rollItemMacro("${item.name}");`;
        let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
        if (!macro) {
            macro = await Macro.create({
                name: item.name,
                type: "script",
                img: item.img,
                command: command,
                flags: { "sgrpg.itemMacro": true }
            });
        }

        game.user.assignHotbarMacro(macro, slot);
    })();
    return false;
}

/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
export function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);

    // Get matching items
    const items = actor ? actor.items.filter(i => i.name === itemName) : [];
    if (items.length > 1) {
        ui.notifications.warn(`Your controlled Actor ${actor.name} has more than one Item with name ${itemName}. The first matched item will be chosen.`);
    } else if (items.length === 0) {
        return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
    }
    const item = items[0];

    // Trigger the item roll action.
    return item.roll();
}
