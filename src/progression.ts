import { Config } from './config.js'

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

type Progs = {
    progs: ClassProgression[]
}

export interface ProgressionRepository {

    /**
     * Read progression list from the storage
     */
    readProgression(): ClassProgression[]

    /**
     * Update progression list in the storage
     */
    writeProgression(prog: ClassProgression[]): Promise<ClassProgression[]>

}

export class FoundryProgressionRepository implements ProgressionRepository {

    initialized = false;

    constructor(protected settings: ClientSettings, protected config: Config) {
        this.init()
    }

    /**
     * Initialize the repository by registering the module & repository key in Foundry client settings
     */
    protected init(): void {
        if (!this.initialized) {
            this.settings.register(this.config.name, this.config.progressionRepositoryName, {
                scope: "world",
                default: {
                    progs: []
                },
                onChange: value => {
                    console.log(value)
                }
            })
            this.initialized = true;
        }
    }

    readProgression(): ClassProgression[] {
        const progs = this.settings.get(this.config.name, this.config.progressionRepositoryName) as Progs
        return progs.progs
    }

    writeProgression(prog: ClassProgression[]): Promise<ClassProgression[]> {
        return this.settings.set(this.config.name, this.config.progressionRepositoryName, {
            progs: prog
        }).then(p => p.progs)
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