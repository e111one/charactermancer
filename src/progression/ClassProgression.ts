import { Config } from '../config.js'

export type ClassProgression = {
    class: Class,
    levels: Array<ClassLevel>
}

type Class = {
    item: Item | string,
    pack?: string
}

type Items = {
    items: Array<Item | string>
}

type Prerequisites = {
    prerequisites: Array<Item | string>
}

type ClassLevel = {
    level: number,
    features: {
        regular?: Items,
        optional?: Items,
        prerequisites?: Items & Prerequisites
    }
}

/*@TODO: playersheet stats
*type Race = Item | string
*type SavingThrow = string
*type Skill = string
*type Resistance = Item | string
*type Other = Item | string
*type Proficience = Armor | Weapon | Tool | SavingThrow | Skill | Other
**/