import ActorSheetFlags from "../apps/actor-flags.js";

export default class SGActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 875,
            height: 900,
            tabs: [{ navSelector: ".tabs", contentSelector: ".sg-sheet-body", initial: "character" }]
        });

        // https://foundryvtt.wiki/en/development/guides/SD-tutorial/SD07-Extending-the-ActorSheet-class
    }

    get template() {
        return `systems/sgrpg/templates/sheets/${this.actor.type}-sheet.hbs`;
    }

    async getData(options) {
        const baseData = super.getData();
        baseData.dtypes = ["String", "Number", "Boolean"];

        let sheetData = {};

        // Insert the basics
        sheetData.actor = baseData.data;
        sheetData.items = baseData.items;

        // Insert necessary misc data
        sheetData.options = baseData.options;
        sheetData.cssClass = baseData.cssClass;
        sheetData.editable = baseData.editable;
        sheetData.limited = baseData.limited;
        sheetData.title = baseData.title;
        sheetData.dtypes = baseData.dtypes;

        // Grab the actual template data and effects
        sheetData.system = baseData.data.system;
        sheetData.effects = baseData.effects;

        // Prepare items
        const editorData = {};
        if (this.actor.type == 'player') {
            this._prepareCharacterItems(sheetData);
            editorData.description = await TextEditor.enrichHTML(sheetData.system.description, { async: true });
            editorData.racial = await TextEditor.enrichHTML(sheetData.system.abilities.racial, { async: true });
            editorData.feats = await TextEditor.enrichHTML(sheetData.system.abilities.feats, { async: true });
            editorData.class = await TextEditor.enrichHTML(sheetData.system.abilities.class, { async: true });
            editorData.proficiencies = await TextEditor.enrichHTML(sheetData.system.abilities.proficiencies, { async: true });
        }
        if (this.actor.type == 'npc') {
            this._prepareCharacterItems(sheetData);
            editorData.details = await TextEditor.enrichHTML(sheetData.system.details, { async: true });
            editorData.gm_notes = await TextEditor.enrichHTML(sheetData.system.gm_notes, { async: true });
        }
        if (this.actor.type == 'vehicle') {
            this._prepareVehicleItems(sheetData);
            editorData.description = await TextEditor.enrichHTML(sheetData.system.description, { async: true });
        }
        sheetData.editorData = editorData;

        // Structural sheet stuff
        sheetData.isGM = game.user.isGM;
        sheetData.baseKitDisabled = sheetData.system.baseKitDisabled ?? false;
        sheetData.tensionDie = game.sgrpg.getTensionDie();
        sheetData.selectables = {
            proficiencySelects: {
                0: "Untrained",
                1: "Proficient",
                2: "Exceptional"
            }
        };
        sheetData.structural = {
            bulkMeter: {
                currentBulkPerc: Math.min((sheetData.system.bulkUsed / sheetData.system.bulkMax) * 100, 100),
                currentBulk: sheetData.system.bulkUsed,
                maxBulk: sheetData.system.bulkMax,
                isOverloaded: sheetData.system.bulkOverload
            },
            autoLevel: game.settings.get("sgrpg", "autoLevelSystem")
        };

        // Configuration data
        sheetData.config = mergeObject(CONFIG.SGRPG, {
            conditions: {
                normal: "Normal",
                disadvabilitychecks: "Disadv ability checks",
                speedhalved: "Speed halved",
                disadvattackssaves: "Disadv attacks, saves",
                hpmaxhalved: "HP max halved",
                speedzero: "Speed zero",
                death: "Death"
            },
            saves: CONFIG.SGRPG.abilities
        });


        return sheetData;
    }

    /**
     * Properly sort items into their respective lists
     */
    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const basekit = [];
        const weapons = [];
        const armors = [];

        // Iterate through items, allocating to containers
        for (let i of sheetData.items) {
            let item = i;
            i.img = i.img || DEFAULT_TOKEN;

            // Switch-case to append the item to the proper list
            switch (i.type) {
                case 'equip':
                    if (item.system.partOfBaseKit && actorData.type === "player")
                        basekit.push(i);
                    else
                        gear.push(i);
                    break;
                case 'weapon':
                    weapons.push(i);
                    break;
                case 'armor':
                    armors.push(i);
                    break;
                default:
                    gear.push(i);
                    console.warn("Unknown item type in character data, pushed into gear: " + i.name);
                    break;
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.basekit = basekit;
        actorData.weapons = weapons;
        actorData.armors = armors;
    }

    /**
     * Properly sort items into their respective lists, but for vehicles
     */
    _prepareVehicleItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const weapons = [];

        // Iterate through items, allocating to containers
        for (let i of sheetData.items) {
            let item = i;
            i.img = i.img || DEFAULT_TOKEN;

            // Switch-case to append the item to the proper list
            switch (i.type) {
                case 'item':
                    gear.push(i);
                    break;
                case 'weapon':
                    weapons.push(i);
                    break;
                default:
                    gear.push(i);
                    break;
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.weapons = weapons;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * @param html {jQuery}   The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;

        // Rollable skill checks
        html.find('a.txt-btn[type="roll"]').click(event => this._onRollCheck(event));
        html.find('a.txt-btn[type="roll_restheal"]').click(event => this._onRollRestHealing(event));
        html.find('a.txt-btn[type="roll_deathsave"]').click(event => this._onRollDeathSave(event));
        html.find('a.txt-btn[type="roll_init"]').click(event => this._roll_initiative(event));
        html.find('a.txt-btn[type="roll_moxie"]').click(event => this._roll_moxie(event));
        html.find('a.txt-btn[type="reset_deathsave"]').click(event => this._reset_deathsave(event));
        //html.find('a[type="roll_attack"]').click(event => this._roll_attack(event));
        html.find('a.skill-mod-revert').click(event => this._onSkillRestoreDefaultModClicked(event));

        html.find('.item-empty-inventory').click(event => this._onItemEmpty(event));
        html.find('.item-create').click(event => this._onItemCreate(event));
        html.find('.item-consume').click(event => this._onItemConsume(event));
        html.find('.item-edit').click(event => this._onItemEdit(event));
        html.find('.item-delete').click(event => this._onItemDelete(event));
        html.find('.item-roll').click(event => this._onItemRoll(event));
        html.find('.item-reload').click(event => this._onItemReload(event));

        html.find('a.config-button').click(this._onConfigMenu.bind(this));

        html.find(".death-save-checkbox").change(event => this._onDeathSaveCheckboxChanged(event));
    }

    /**
     * Handle resetting the skill attribute to default
     */
    async _onSkillRestoreDefaultModClicked(event) {
        const skillName = event.currentTarget.parentElement.parentElement.dataset.skill;

        const defaultValues = game.system.model.Actor[this.actor.type];
        const defaultSkillAttribute = defaultValues.skills[skillName].attribute;

        return this.actor.update({ [`data.skills.${skillName}.attribute`]: defaultSkillAttribute });
    }

    /** @override */
    async _onDropItemCreate(itemData) {
        // if ( itemData.data ) {
        //     // Ignore certain statuses
        //     ["equipped", "proficient", "prepared"].forEach(k => delete itemData.data[k]);
        // }

        // Stack identical equipment
        if (itemData.flags.core?.sourceId) {
            const similarItem = this.actor.items.find(i => {
                const sourceId = i.getFlag("core", "sourceId");
                return sourceId && (sourceId === itemData.flags.core?.sourceId);
            });
            if (similarItem) {
                return similarItem.update({
                    'data.quantity': similarItem.system.quantity + Math.max(itemData.system.quantity, 1)
                });
            }
        }

        // Create the owned item as normal
        return super._onDropItemCreate(itemData);
    }

    /**
     * Handle deleting all non-basekit items on an Actor
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemEmpty(event) {
        return ui.notifications.info("This button does nothing yet.");

    }

    /**
     * Handle deleting an existing Owned Item for the Actor
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();

        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const system = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            system: system
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.system["type"];

        // Finally, create the item!
        return await Item.create(itemData, { parent: this.actor });
    }

    /**
     * Handle editing an existing Owned Item for the Actor
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemEdit(event) {
        event.preventDefault();
        const div = event.currentTarget.parentElement.parentElement;
        const item = this.actor.items.get(div.dataset.itemId);
        return item.sheet.render(true);
    }

    _onItemConsume(event) {
        event.preventDefault();
        const div = event.currentTarget.parentElement.parentElement;
        const item = this.actor.items.get(div.dataset.itemId);
        return item.consume();
    }

    async _onItemReload(event) {
        event.preventDefault();
        const div = event.currentTarget.parentElement.parentElement;
        const item = this.actor.items.get(div.dataset.itemId);

        if (!item) {
            return ui.notifications.warn("Item to reload not found!");
        }

        item.reloadWeapon();
    }

    /* -------------------------------------------- */

    /**
     * Handle deleting an existing Owned Item for the Actor
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemDelete(event) {
        event.preventDefault();
        const div = event.currentTarget.parentElement.parentElement;
        const item = this.actor.items.get(div.dataset.itemId);

        if (item) return item.delete();
    }

    _onItemRoll(event) {
        event.preventDefault();
        const div = event.currentTarget.parentElement.parentElement;
        const item = this.actor.items.get(div.dataset.itemId);
        if (item) return item.roll()
    }

    /**
     * Handle toggling Ability score proficiency level
     * @param {Event} event     The originating click event
     * @private
     */
    async _onRollCheck(event) {
        event.preventDefault();

        let actorData = await this.getData();
        let bonusDataPath = event.currentTarget.dataset.bonus;

        let rollData = parseInt(getProperty(actorData, bonusDataPath));
        if (rollData >= 0) {
            // Make sure there is always sign.
            rollData = "+" + rollData;
        }

        let r = new CONFIG.Dice.D20Roll("1d20 @prof", { prof: rollData });
        const configured = await r.configureDialog({
            title: `Roll check for ${event.currentTarget.innerText}`,
            defaultRollMode: "normal"
        });
        if (configured === null) {
            return;
        }

        // Print roll to console.
        r.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: event.currentTarget.innerText
        });
    }

    _onRollRestHealing(event) {
        event.preventDefault();

        this.actor.rollHealing();
    }

    _onRollDeathSave(event) {
        event.preventDefault();

        this.actor.rollDeathSave();
    }

    _reset_deathsave(event) {
        event.preventDefault();
        return this.actor.update({
            "system.deathSaves.fails": 0,
            "system.deathSaves.successes": 0
        });
    }

    _roll_initiative(event) {
        if (game.sgrpg.usingMoxieCombat()) {
            return ui.notifications.info("Using Moxie Combat, please roll that one");
        } else {
            return this.actor.rollInitiative({ createCombatants: true });
        }
    }

    _roll_moxie(event) {
        if (game.sgrpg.usingMoxieCombat()) {
            return this.actor.rollInitiative({ createCombatants: true });
        } else {
            return ui.notifications.info("Using normal Initiative, please roll that one");
        }
    }

    /**
     * Handle spawning the TraitSelector application which allows a checkbox of multiple trait options
     * @param {Event} event   The click event which originated the selection
     * @private
     */
    _onConfigMenu(event) {
        event.preventDefault();
        const button = event.currentTarget;
        let app;
        console.log(button.dataset.action)
        switch (button.dataset.action) {
            case "flags":
                app = new ActorSheetFlags(this.object);
                break;
        }
        app?.render(true);
    }

    _onDeathSaveCheckboxChanged(event) {
        event.preventDefault();

        const isSuccess = event.currentTarget.classList.contains("success");
        const checked = event.currentTarget.checked;
        const value = checked ? event.currentTarget.value : event.currentTarget.value - 1;

        if (isSuccess) {
            return this.actor.update({ "system.deathSaves.successes": value });
        }
        else {
            return this.actor.update({ "system.deathSaves.fails": value });
        }
    }
}