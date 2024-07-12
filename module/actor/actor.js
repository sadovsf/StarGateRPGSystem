import ItemSg from "../item/item.js";

export default class ActorSg extends Actor {

    /* -------------------------------------------- */
    /* Static Functions                             */
    /* -------------------------------------------- */

    /**
     * Static function to get the level of a player from spent MP
     * @param {string} spent
     * @returns {number}
     */
    static _parseSpentMP(spent) {
        if (!spent) {
            return 0;
        }
        const foos = spent.split("+");
        let total = 0;
        for (let foo of foos) {
            total += parseInt(foo);
        }
        return total;
    }

    /**
     * Static function to get the level of a player from spent MP
     * @param {number} mp
     * @returns {number}
     */
    static _getLevelFromMP(mp) {
        if (mp <= 20) { // The base training phase
            return 1 + Math.floor(mp / 5);
        } else { // Advanced training phase, clamped to max level 20
            return Math.min(20, Math.floor(((mp - 20) / 10) + 5));
        }
    }

    /* -------------------------------------------- */
    /* Overrides                                    */
    /* -------------------------------------------- */

    /** @inheritdoc */
    getRollData() {
        let rollData = super.getRollData();

        // Set the Tension Die from the scene, and if necessary, from the campaign
        // Multiple different ways of writing to cover spelling errors
        const tensionDie = game.sgrpg.getTensionDie();
        rollData.tensionDie = tensionDie;
        rollData.tensionDice = tensionDie;
        rollData.TD = tensionDie;
        rollData.td = tensionDie;
        rollData.tD = tensionDie;

        return rollData;
    }

    /* -------------------------------------------- */
    /* Normal Functions                             */
    /* -------------------------------------------- */

    /** @override
     */
    prepareData() {
        // Performs the following, in order: data reset, prepareBaseData(), prepareEmbeddedDocuments(), prepareDerivedData()
        super.prepareData();
        this.prepareEmbeddedVisuals();
    }

    /* -------------------------------------------- */
    /* Process Base                                 */
    /* -------------------------------------------- */

    /** @override
     * Calculate some base necessities from existing data before moving on to derived proper 
     */
    prepareBaseData() {
        const actorData = this;
        const system = actorData.system;

        // Common base data for characters
        if (actorData.type === 'player' || actorData.type === 'npc')
            this._processBaseCommon(actorData);

        // Basic visual data container
        system.visualData = {};
    }

    _processBaseCommon(actorData) {
        const system = actorData.system;
        const autoLevel = game.settings.get("sgrpg", "autoLevelSystem");

        // Used level for players
        if (actorData.type === "player") {
            system.level = -1;

            const spentMP = ActorSg._parseSpentMP(system.spentMP);
            system.usedMPCount = spentMP;
            system.allMPCount = spentMP + parseInt(system.mp);

            if (autoLevel) {
                if (!isNaN(spentMP)) {
                    system.level = ActorSg._getLevelFromMP(spentMP);
                }
            } else {
                system.level = system.levelInput;
            }
        }

        // Proficiency Level
        let prof = 0;
        switch (actorData.type) {
            case 'player':
                prof = 2 + Math.floor((system.level - 1) / 4);
                break;
            case 'npc':
                prof = 2 + Math.floor((system.cr - 1) / 4);
                break;
            default:
                break;
        }
        // Set the proficiency level to the calculated value
        system.proficiencyLevel = prof + system.proficiencyBonus;
        system.proficiencyFromLevel = prof;

        // Basic ability score modifiers
        for (let [key, ability] of Object.entries(system.attributes)) {
            ability.mod = Math.floor((ability.value - 10) / 2);
            ability.modVisual = (ability.mod >= 0 ? "+" : "") + ability.mod.toString();
        }
    }

    /* -------------------------------------------- */
    /* Process Derived                              */
    /* -------------------------------------------- */

    /** @override
     * Augment the basic actor data with additional dynamic data.
     */
    prepareDerivedData() {
        const actorData = this;

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'player') this._preparePlayerData(actorData);
        if (actorData.type === 'npc') this._prepareNpcData(actorData);
        if (actorData.type === 'vehicle') this._prepareVehicleData(actorData);
    }

    /**
     * Prepare Player type specific data
     */
    _preparePlayerData(actorData) {
        this._processCommon(actorData);
        this._processArmor(actorData);
    }

    /**
     * Prepare NPC type specific data
     */
    _prepareNpcData(actorData) {
        this._processCommon(actorData);
        this._processArmor(actorData);
        this._processNpc(actorData);
    }

    /**
     * Prepare Vehicle type specific data
     */
    _prepareVehicleData(actorData) {
        this._processMinimal(actorData);
    }

    /**
     * Prepare data based on common template
     */
    _processCommon(actorData) {
        const system = actorData.system;

        // Process skills
        for (let [key, skill] of Object.entries(system.skills)) {
            // Calculate the modifier using d20 rules.
            skill.total = system.attributes[skill.attribute].mod + system.proficiencyLevel * skill.proficient;
            skill.totalVisual = (skill.total >= 0 ? "+" : "") + skill.total.toString();
        }

        // Process saves
        for (let [key, save] of Object.entries(system.saves)) {
            // Calculate the modifier using d20 rules.
            save.total = system.attributes[key].mod + system.proficiencyLevel * save.proficient;
            save.totalVisual = (save.total >= 0 ? "+" : "") + save.total.toString();
        }

        // Get max HP
        let hp = 0;
        switch (actorData.type) {
            case 'player':
                let hitDieValue = -1;
                let index = system.hd.trim().search(/d/i); // Search for the letter d in the string
                if (index >= 0) {
                    hitDieValue = parseInt(system.hd.trim().slice(index + 1));
                }
                system.hitDieValue = hitDieValue;
                hp = system.health.maxBonus + (system.health.maxLevelBonus * system.level) + hitDieValue + (hitDieValue / 2 + 1) * (system.level - 1) + system.attributes.con.mod * system.level;
                system.visualData.hitDieLevels = (hitDieValue / 2 + 1) * (system.level - 1);
                system.visualData.hitDieTotal = `${hitDieValue} + ${(hitDieValue / 2 + 1) * (system.level - 1)}`;
                system.visualData.conBonus = system.attributes.con.mod * system.level;
                break;
            default:
                hp = parseInt(system.health.maxBonus);
                break;
        }
        system.health.max = hp;

        // Get max determination
        system.determination.max = system.proficiencyLevel + system.determination.maxBonus;

        // Initiative and moxie
        system.initiative = (system.attributes.dex.mod > system.attributes.wis.mod ? system.attributes.dex.mod : system.attributes.wis.mod) + system.initiativeBonus;
        system.moxie = (system.attributes.int.mod > system.attributes.cha.mod ? system.attributes.int.mod : system.attributes.cha.mod) + system.moxieBonus;

        system.visualData.initiative = `${(system.attributes.dex.mod > system.attributes.wis.mod ? "Dex" : "Wis")}: ${(system.attributes.dex.mod > system.attributes.wis.mod ? system.attributes.dex.mod : system.attributes.wis.mod)}`;
        system.visualData.moxie = `${(system.attributes.int.mod > system.attributes.cha.mod ? "Int" : "Cha")}: ${(system.attributes.int.mod > system.attributes.cha.mod ? system.attributes.int.mod : system.attributes.cha.mod)}`;

        // Very basic bulk, speed, and AC
        system.bulkMax = system.bulkBonus + system.attributes.str.mod;
        system.speed = system.speedBase;
        system.ac = 10 + system.acBonus + system.attributes.dex.mod;

        // Max automatic shots
        system.maxAutomaticShots = system.attributes.str.mod + system.miscSettings.extraAutoFire;

        // Used bulk
        // Only consider carried items that are not part of the base kit or a worn armor
        const bulkItems = this.items.filter(element => element.system.carried && !element.system.partOfBaseKit && !element.system.worn);
        let usedBulk = 0;
        for (let item of bulkItems) {
            usedBulk += item.system.bulkTotal;
        }
        system.bulkUsed = usedBulk;
        system.bulkOverload = usedBulk > system.bulkMax;
    }

    /**
     * Process data for actors with only minimal data
     */
    _processMinimal(actorData) {
        const system = actorData.system;

        // Get max HP
        system.health.max = parseInt(system.health.maxBonus);

        // Get AC
        system.ac = parseInt(system.acBonus);

        // Get speed
        system.speed = parseInt(system.speedBase);

        // Get bulk
        system.bulkMax = parseInt((system.bulkBonus));

        // Used bulk
        // Only consider carried items that are not part of the base kit
        const bulkItems = this.items.filter(element => element.system.carried && !element.system.partOfBaseKit);
        let usedBulk = 0;
        for (let item of bulkItems) {
            usedBulk += item.system.bulk * item.system.quantity;
        }
        system.bulkUsed = usedBulk;
        system.bulkOverload = usedBulk > system.bulkMax;
    }

    /**
     * Process data that's only used for NPC's
     */
    _processNpc(actorData) {
        const system = actorData.system;

        // Get proficient skills
        system.proficientSkills = {};
        for (let [key, skill] of Object.entries(system.skills)) {
            if (skill.proficient > 0) {
                system.proficientSkills[key] = skill;
            }
        }
    }

    /**
     * Process data that has to do with armor
     */
    _processArmor(actorData) {
        const system = actorData.system;

        const wornArmors = this.items.filter(element => element.type === 'armor' && element.system.carried && element.system.worn);
        let baseAC = 0, additiveAC = 0, baseBulk = 0, additiveBulk = 0, heavyArmor = false, overStrength = false;
        for (let armor of wornArmors) {
            const armorData = armor.system;
            if (armorData.additive) {
                additiveAC += armorData.acBonus;
                additiveBulk += armorData.bulkBonus;
            } else {
                if (baseAC < armorData.acBonus) {
                    baseAC = armorData.acBonus;
                    baseBulk = armorData.bulkBonus;
                };
            }
            if (armorData.heavyArmor) heavyArmor = true;
            if (armorData.strRequired > system.attributes.str.value) overStrength = true;
        }

        // Set the proper values
        system.bulkMax = baseBulk + additiveBulk + system.bulkBonus + system.attributes.str.mod;
        system.speed = overStrength ? 1 : system.speedBase - (heavyArmor ? 2 : 0);
        system.ac = baseAC + additiveAC + system.acBonus + (heavyArmor ? 0 : system.attributes.dex.mod);
        system.bulkOverload = system.usedBulk > system.bulkMax;

        // Store visual sheet data
        system.visualData.armorAC = baseAC;
        system.visualData.armorAdditional = additiveAC;
        system.visualData.dexBonus = (heavyArmor ? 0 : system.attributes.dex.mod);
        system.visualData.heavyArmor = heavyArmor;
        system.visualData.overStrength = overStrength;
        system.visualData.armorLimitsSpeed = (overStrength ? "Badly" : (heavyArmor ? "Yes" : "No"));

        system.visualData.armorBulk = baseBulk;
        system.visualData.armorBulkPlus = additiveBulk;
    }

    /* -------------------------------------------- */
    /* Process Visuals                              */
    /* -------------------------------------------- */

    prepareEmbeddedVisuals() {
        for (let item of this.items) {
            item.prepareVisualData();
        }
    }

    /* -------------------------------------------- */
    /* Private Functions                            */
    /* -------------------------------------------- */

    /**
     * Update tokens associated with this actor with lighting data
     * @param {any} lightdata Data to use for update
     * @private
     */
    async _updateTokenLighting(lightdata) {
        const actor = this;
        let foundtoken = null;
        if (actor.token) {
            foundtoken = actor.token;
        }
        else {
            let tokenarray = actor.getActiveTokens(true);
            if (tokenarray.length > 0 && tokenarray[0]?.actorLink === true)
                foundtoken = tokenarray[0].document;
        }

        if (foundtoken) {
            await foundtoken.update({ "light": lightdata });
        }

        // Update prototype token, if applicable
        if (!this.isToken) {
            await this.update({
                "token.light": lightdata
            });
        }
    }

    /* -------------------------------------------- */
    /* Data Modification                            */
    /* -------------------------------------------- */

    /**
       * Apply a certain amount of damage or healing to the health pool for Actor
       * @param {number} amount       An amount of damage (positive) or healing (negative) to sustain
       * @param {number} multiplier   A multiplier which allows for resistance, vulnerability, or healing
       * @return {Promise<Actor>}     A Promise which resolves once the damage has been applied
       */
    async applyDamage(amount = 0, multiplier = 1) {
        amount = Math.floor(parseInt(amount) * multiplier);

        // Deduct damage from temp HP first
        const tmp = parseInt(this.system.temp_health.value) || 0;
        const dt = amount > 0 ? Math.min(tmp, amount) : 0;

        // Remaining goes to health
        // const tmpMax = parseInt(this.system.temp_health.max) || 0;
        const dh = Math.clamped(this.system.health.value - (amount - dt), 0, this.system.health.max);

        // Update the Actor
        const updates = {
            "system.temp_health.value": tmp - dt,
            "system.health.value": dh
        };

        // Delegate damage application to a hook
        // TODO replace this in the future with a better modifyTokenAttribute function in the core
        const allowed = Hooks.call("modifyTokenAttribute", {
            attribute: "health",
            value: amount,
            isDelta: false,
            isBar: true
        }, updates);
        return allowed !== false ? this.update(updates) : this;
    }

    /**
     * Change which illumination item the actor is using, or turn them all off
     * @param {ItemSg} lightsource
     */
    async changeLightSource(lightsource) {
        if (!lightsource) {
            console.error("Attempted to change a light source without providing light source for actor: " + this);
            return;
        }
        let updatedlightdata = {
            "dim": 0, "bright": 0, "angle": 360, "color": "#ffffff", "alpha": 0.25, "animation": {
                "type": "", "speed": 5, "intensity": 5
            }
        };

        let lightsources = this.items.filter(element => element.type === "equip" && element.system.isLightItem);

        if (!lightsource.system.lighted) { // Light the light source
            updatedlightdata = {
                "dim": lightsource.system.dimLight, "bright": lightsource.system.brightLight, "angle": lightsource.system.lightAngle,
                "color": lightsource.system.lightColor, "alpha": lightsource.system.lightAlpha, "animation": {
                    "type": lightsource.system.lightAnimationType, "speed": lightsource.system.lightAnimationSpeed, "intensity": lightsource.system.lightAnimationIntensity
                }
            };
            const index = lightsources.findIndex(element => element.id === lightsource.id);
            if (index > -1)
                lightsources.splice(index, 1); // Exclude from dousing
            await lightsource.update({ "_id": lightsource.id, "system.lighted": true });
        }

        let doused = [];
        for (let l of lightsources) { // Douse all other light sources, including the caller if it was previously lighted
            doused.push({ "_id": l.id, "system.lighted": false });
        }
        await this.updateEmbeddedDocuments("Item", doused);
        await this._updateTokenLighting(updatedlightdata);
    }

    /**
     * Refresh the token light source based on which illumination item is active, if any
     */
    refreshLightSource() {
        let updatedlightdata = {
            "dim": 0, "bright": 0, "angle": 360, "color": "#ffffff", "alpha": 0.25, "animation": {
                "type": "", "speed": 5, "intensity": 5
            }
        };

        let lightsources = this.items.filter(element => element.type === "equip" && element.system.isLightItem);
        let activesource = lightsources.find(element => element.system.lighted === true);
        if (activesource) {
            updatedlightdata = {
                "dim": lightsource.system.dimLight, "bright": lightsource.system.brightLight, "angle": lightsource.system.lightAngle,
                "color": lightsource.system.lightColor, "alpha": lightsource.system.lightAlpha, "animation": {
                    "type": lightsource.system.lightAnimationType, "speed": lightsource.system.lightAnimationSpeed, "intensity": lightsource.system.lightAnimationIntensity
                }
            };
        }

        return this._updateTokenLighting(updatedlightdata);
    }

    /**
     * Pop up a dialog to specify which heal, then roll and apply it
     */
    async rollHealing() {
        if (this.type !== "player") {
            return console.error("Tried to rest heal a non-character: " + this.name);
        }

        const system = this.system;
        if (system.health.value >= system.health.max) {
            return ui.notifications.info("Already at maximum health!");
        }

        const betterMod = system.attributes.con.mod > system.proficiencyLevel ? system.attributes.con.mod : system.proficiencyLevel;
        const templateData = {
            "actor": this,
            "shortRestHeal": `${system.hd} + ${betterMod}`,
            "longRestHeal": `${system.level}${system.hd} + ${betterMod}`,
            "fullHeal": `${system.health.max}`
        };

        const contents = await renderTemplate("systems/sgrpg/templates/popups/healing-popup.html", templateData);
        let resolvedroll = new Promise((resolve) => {
            let confirmed = false;
            let restType = "";
            let dlog = new Dialog({
                title: "Resting Heal",
                content: contents,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-clock"></i>',
                        label: "Short Rest",
                        callback: () => { restType = "Short"; confirmed = true; }
                    },
                    two: {
                        icon: '<i class="fas fa-bed"></i>',
                        label: "Long Rest",
                        callback: () => { restType = "Long"; confirmed = true; }
                    },
                    three: {
                        icon: '<i class="fas fa-bed"></i>',
                        label: "Full HP",
                        callback: () => { restType = "Full"; confirmed = true; }
                    }
                },
                default: "one",
                render: html => { },
                close: html => {
                    resolve({ "confirmed": confirmed, "restType": restType });
                }
            });
            dlog.render(true);
        });
        const results = await resolvedroll;

        if (results.confirmed && results.restType) {
            let r = new Roll(results.restType === "Full" ? templateData.fullHeal : results.restType === "Long" ? templateData.longRestHeal : templateData.shortRestHeal);
            await r.evaluate();
            const rollResult = r.total;
            r.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                flavor: results.restType + " Rest Healing"
            });
            this.applyDamage(rollResult, -1); // Negative multiplier, as the function does damage so negative heals the character
        }
    }

    /**
     * Automatically roll and record the result of a death save
     */
    async rollDeathSave() {
        let r = new Roll("1d20");
        await r.evaluate();
        const rollResult = r.total;

        const data = this.system.deathSaves;
        const curSuccess = parseInt(data.successes);
        const curFails = parseInt(data.fails);
        const curHealth = parseInt(this.system.health.value);

        if (rollResult === 1) {
            // 2 fails.
            if (curHealth === 0 && curFails >= 1) {
                this.update({
                    "system.deathSaves.fails": curFails + 2,
                    "system.condition": "death"
                });
            } else {
                this.update({ ["system.deathSaves.fails"]: curFails + 2 });
            }
        }
        else if (rollResult === 20) {
            // success + heal.
            const maxHealth = parseInt(this.system.health.max);
            this.update({
                "system.deathSaves.fails": 0,
                "system.deathSaves.successes": 0,
                "system.health.value": curHealth + 1 <= maxHealth ? curHealth + 1 : curHealth
            });
        }
        else if (rollResult >= 10) {
            // success.
            if (curSuccess >= 2) {
                this.update({
                    "system.deathSaves.fails": 0,
                    "system.deathSaves.successes": 0
                });
            }
            else {
                this.update({ [`data.deathSaves.successes`]: curSuccess + 1 });
            }
        }
        else {
            // fail.
            if (curHealth === 0 && curFails >= 2) {
                this.update({
                    "system.deathSaves.fails": curFails + 1,
                    "system.condition": "death"
                });
            } else {
                this.update({ ["system.deathSaves.fails"]: curFails + 1 });
            }
        }

        return r.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: "Death Save"
        });
    }
}