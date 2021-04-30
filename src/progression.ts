type RaceProgression = {
    inits: {
        features: [Races],
        /*@TODO: resistances and proficiencies based on race features*/
    }
}

type ClassProgression = {
    class: Item | string,
    hitDice: HitDice
    inits: {
        hp: HpFormula
        features: [Feature],
        proficiencies: [Proficience],
        /*equipment: [Equipment],*/
        spellcasting: [Spellcasting],
        classStarterBackpack: [ClassStarterBackpack],
    },
    milestones: [Milestone]
}

type HitDice = {
    n: number
}

type HpFormula = {
    init: number,
    modifier: string
}

type Milestone = {
    level: number,
    proficiencyBonus: number,
    /*features: [Feature]*/
}

type Spellcasting = {
    spellcastingAbility: boolean,
    spellcastingType: Item | string,
    hasSpells: string,
    /*hasSpellslots: number[]*/
}

type ClassStarterBackpack = {
    starterGear: [StarterGear],
    starterCoins: [StarterCoins]
}

type StarterGear = {
    Armor: [Armor],
    Weapon: [Weapon],
    /*@TODO: background items?*/
}

type StarterCoins = {
    coins: number | null
}

type Races = Item | string
type Feature = Item | string
type Armor = string
type Weapon = string
type Tool = string
type SavingThrow = string
type Skill = string
type Other = Item | string
type Proficience = Armor | Weapon | Tool | SavingThrow | Skill | Other

/*type Equipment = Item*/

/*class Prog {

    class: Item

}*/