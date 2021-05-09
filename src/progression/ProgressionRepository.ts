import { ClassLevel, ClassProgression, FeatureType, ItemReference, LevelFeatures } from "./ClassProgression.js";
import { Config } from "../config.js";
import { CompendiumRepository } from "./CompendiumRepository.js";

export interface ProgressionRepository {

    /**
     * Read progression list from the storage
     */
    readProgression(): Promise<ClassProgression[]>

    /**
     * Update progression list in the storage
     */
    writeProgression(prog: ClassProgression[]): Promise<ClassProgression[]>

    /**
     * Add new class to the progression
     * @param classItem
     */
    addClass(classItem: Item): Promise<ClassProgression[]>

    /**
     * Add new empty level to the class.
     * @param classId class id to add the level to
     */
    addLevelOf(classId: string): Promise<ClassProgression[]>

    /**
     * Add new feature to the class.level.featureType
     * @param classId id of the class to add the feature to
     * @param levelId id of the level to add the feature to
     * @param featureType type of the feature
     * @param featureItem actual item to add
     */
    addFeatureFor(classId: string, levelId: string, featureType: FeatureType, featureItem: Item): Promise<ClassProgression[]>

    /**
     * Find feature of class within its level
     * @param classId id of the class to look up
     * @param levelId id of the level to look up
     * @param featureId id of the actual item
     */
    findFeatureOf(classId: string, levelId: string, featureId: string): Promise<ItemReference | null>

}

export class FoundryProgressionRepository implements ProgressionRepository {

    initialized = false;

    constructor(protected settings: ClientSettings, protected compendiumRepository: CompendiumRepository, protected config: Config) {
        this.init()
    }

    async addLevelOf(classId: string): Promise<ClassProgression[]> {
        const progs = await this.readProgression()
        return this.writeProgression(progs.map(prog => {
            if (prog.class.id === classId) {
                return prog.addLevel()
            } else {
                return prog
            }
        }))
    }

    async addFeatureFor(classId: string, levelId: string, featureType: FeatureType, featureItem: Item) {
        const progs = await this.readProgression()

        return this.writeProgression(progs.map(prog => {
            if (prog.class.id === classId) {
                return prog.addFeature(featureType, levelId, {
                    _type: "item",
                    id: featureItem._id,
                    item: featureItem
                })
            } else {
                return prog
            }
        }))
    }

    async findFeatureOf(classId: string, levelId: string, featureId: string): Promise<ItemReference | null> {
        let progs = await this.readProgression();
        return progs.find(prog => prog.class.id === classId)?.findFeature(levelId, featureId)
    }

    async addClass(classItem: Item): Promise<ClassProgression[]> {
        let progs = await this.readProgression()
        let prog = progs.find(p => p.containsClass(classItem.data._id))
        if (prog) return Promise.resolve().then(_ => progs);
        return this.writeProgression([...progs, new ClassProgression({
            _type: "item",
            id: classItem._id,
            item: classItem
        }).addLevel()])
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

    readProgression(): Promise<ClassProgression[]> {
        const progs = this.settings.get(this.config.name, this.config.progressionRepositoryName) as Progs
        return Promise.all(progs.progs.map(p => {
            //foundry stores plain JSON in settings, and therefore 
            let lvls = p.levels.map(l => {
                let [granted, options, prereq] = [l.features.granted, l.features.options, l.features.prerequisites]
                let features = new LevelFeatures(granted, options, prereq)
                return new ClassLevel(l.id, l.level, features)
            })
            return new ClassProgression(p.cls, lvls).derefProgression(this.compendiumRepository)
        }))
    }

    writeProgression(prog: ClassProgression[]): Promise<ClassProgression[]> {
        return this.settings.set(this.config.name, this.config.progressionRepositoryName, {
            progs: prog.map(p => p.refProgression())
        }).then(p => p.progs)
    }
}

/**
 * Object to store in FoundryVTT settings
 */
type Progs = {
    progs: ClassProgression[]
}