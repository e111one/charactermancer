type Progression = {
    class: Item | string,
    hitDice: HitDice
    inits: {
        hp: HpFormula
        features: [Feature],
        proficiencies: [Proficience],
        equipment: [Equipment]
    },
    milestones: [Milestone]
}

type HitDice = {
    n: number
}

type Armor = string
type Weapon = string
type Tool = string
type SavingThrow = string
type Skill = string
type Other = Item | string
type Proficience = Armor | Weapon | Tool | SavingThrow | Skill | Other

type HpFormula = {
    init: number,
    modifier: string
}

type Feature = Item | string

type Equipment = Item

type Milestone = {
    level: number,
    proficiencyBonus: number,
    features: [Feature]
}

class Prog {

    class: Item

}