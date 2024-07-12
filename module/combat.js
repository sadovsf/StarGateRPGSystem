

/**
 * Override the default Initiative formula to customize special behaviors of the system.
 * Apply advantage, proficiency, or bonuses where appropriate
 * Apply the dexterity score as a decimal tiebreaker if requested
 * See Combat._getInitiativeFormula for more detail.
 */
export const _getInitiativeFormula = function () {
    const actor = this.actor;
    if (!actor) return "1d20";
    const moxie = game.settings.get("sgrpg", "useMoxieCombat"); // Use the raw setting here, since it's where the magic happens
    const init = moxie ? actor.system.moxie : actor.system.initiative;

    // Construct initiative formula parts
    let nd = 1;
    let mods = "";
    if (actor.getFlag("sgrpg", "initiativeAdv")) {
        nd = 2;
        mods += "kh";
    }

    return `${nd}d20${mods} + ${init}`;
};