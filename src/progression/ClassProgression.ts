import { Config } from '../config.js'

export type ClassProgression = {
    class: Class,
    levels: Array<ClassLevel>
}

type Class = Item | string

type FeatureRegular = {
    _type: "regular",
    items: Array<Item | string>
}

type FeatureOptional = {
    _type: "optional",
    items: Array<Item | string>
}

type FeaturePrerequisite = {
    _type: "prerequisite",
    prerequisites: Array<Item | string>
    items: Array<Item | string>
}

type ClassLevel = {
    level: number,
    features: {
        regular?: FeatureRegular,
        optional?: FeatureOptional,
        prerequisites?: FeaturePrerequisite
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