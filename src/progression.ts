type ClassProgression = {
    level: [ClassLevel],
    class: [Class],
    box: {
        boxType: [BoxType]//string, //regular | optional | prerequisite
        boxContains: [BoxConstructRegular] | [BoxConstructOptional] | [BoxConstructPrerequisite]
    },
}

type BoxConstructRegular = {
    boxKey: [BoxKey],
    innerItems: Item | string
} | null
type BoxConstructOptional = {
    boxKey: [BoxKey],
    innerItems: Item | string //not sure if i must respect the logic here
} | null
type BoxConstructPrerequisite = {
    boxKey: [BoxKey],
    valueRequired: Item | string | null
    innerItems: Item | string
} | null

type ClassLevel = number
type Class = Item | string
type BoxType = regular | optional | prerequisite
type regular = string
type optional = string
type prerequisite = string
type BoxKey = Item | string

/*@TODO: playersheet stats
*type Race = Item | string
*type SavingThrow = string
*type Skill = string
*type Resistance = Item | string
*type Other = Item | string
*type Proficience = Armor | Weapon | Tool | SavingThrow | Skill | Other
**/