/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([

        // Item Sheet Partials
        "systems/sgrpg/templates/sheets/parts/weapon-details.hbs",
        "systems/sgrpg/templates/sheets/parts/weapon-firing-modes.hbs",
        "systems/sgrpg/templates/sheets/parts/equip-details.hbs",
        "systems/sgrpg/templates/sheets/parts/armor-details.hbs",
        "systems/sgrpg/templates/sheets/parts/npc-details.hbs",
        "systems/sgrpg/templates/sheets/parts/equip-header.hbs",
        "systems/sgrpg/templates/sheets/parts/weapon-header.hbs",
        "systems/sgrpg/templates/sheets/parts/armor-header.hbs",

        // Actor Sheet Partials
        "systems/sgrpg/templates/sheets/parts/vehicle-details.hbs",
        "systems/sgrpg/templates/sheets/parts/actor-weapon-inventory.hbs",
        "systems/sgrpg/templates/sheets/parts/actor-armor-inventory.hbs",
        "systems/sgrpg/templates/sheets/parts/actor-equip-inventory.hbs",
        "systems/sgrpg/templates/sheets/parts/actor-basekit-inventory.hbs",
        "systems/sgrpg/templates/sheets/parts/actor-bulk-progress.hbs"
    ]);
};

export function registerHandlebarsHelpersSG() {
    Handlebars.registerHelper('greaterThan', function (val, compare) {
        return val > compare;
    });

    Handlebars.registerHelper('equalTo', function (val, compare) {
        return val == compare;
    });

    Handlebars.registerHelper('consumesAmmo', function (item) {
        return item?.consumesAmmunition?.() ?? false;
    });
};