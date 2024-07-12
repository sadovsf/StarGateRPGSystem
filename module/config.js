// Namespace Configuration Values
export const SGRPG = {};


SGRPG.abilities = {
    "str": "Strength",
    "dex": "Dexterity",
    "con": "Constitution",
    "int": "Inteligence",
    "wis": "Wisdom",
    "cha": "Charisma"
};


SGRPG.attackTypes = {
    piercing: "Piercing",
    bludgeoning: "Bludgeoning",
    fire: "Fire",
    paralyze: "Paralyze",
    psychic: "Psychic",
    blunt: "Blunt",
    force: "Force",
    slashing: "Slashing",
    electric: "Electric",
    radiant: "Radiant",
    sonic: "Sonic",
    explosive: "Explosive"
};

SGRPG.sizes = {
    tiny: "Tiny",
    small: "Small",
    medium: "Medium",
    large: "Large",
    huge: "Huge",
    grg: "Gargantuan"
}

SGRPG.tensionDice = {
    "d4": "Comedic (d4)",
    "d6": "Standard (d6)",
    "d8": "Growing (d8)",
    "d10": "Dire (d10)",
    "d12": "All is Lost (d12)",
};
SGRPG.defaultTensionDie = "d6";

SGRPG.actionReloadValue = "act_based_reload";

/**
 * This Object defines the types of single or area targets which can be applied
 * @type {Object}
 */
SGRPG.targetTypes = {
    "none": "None",
    "self": "Self",
    "creature": "Creature",
    "ally": "Ally",
    "enemy": "Enemy",
    "space": "Space",
    "radius": "Radius",
    "sphere": "Sphere",
    "cylinder": "Cylinder",
    "cone": "Cone",
    "square": "Square",
    "cube": "Cube",
    "line": "Line",
    "wall": "Wall"
};

/**
 * Map the subset of target types which produce a template area of effect
 * The keys are SGRPG target types and the values are MeasuredTemplate shape types
 * @type {Object}
 */
SGRPG.areaTargetTypes = {
    cone: "cone",
    cube: "rect",
    cylinder: "circle",
    line: "ray",
    radius: "circle",
    sphere: "circle",
    square: "rect",
    wall: "ray"
};


// Configure Optional Character Flags
SGRPG.characterFlags = {
    "initiativeAdv": {
        name: "Advantage on initiative",
        hint: "Provided by feats or items",
        section: "Feats",
        type: Boolean
    }
};


// Configure Optional Character Flags
SGRPG.rangeTypes = {
    "short": "Short Range Bonus",
    "long":"Long Range Bonus"
};


// Configure Optional Character Flags
SGRPG.tensionSelection = {
    "no": "No Tension Die",
    "yes": "Add Tension Die"
};