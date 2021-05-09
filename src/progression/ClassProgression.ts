import { CompendiumRepository } from "./CompendiumRepository";

export class ClassProgression {
    constructor(readonly cls: ItemReference, readonly levels: Array<ClassLevel> = []) {

    }

    public get class(): ItemReference {
        return this.cls;
    }

    /**
     * Return copy of this progression with the new class
     */
    withClass(cls: ItemReference): ClassProgression {
        return new ClassProgression(cls, this.levels)
    }

    /**
     * Return copy of this progression with new levels
     */
    withLevels(levels: Array<ClassLevel>): ClassProgression {
        return new ClassProgression(this.cls, levels)
    }

    /**
     * Check if this progression contains the required class id
     */
    containsClass(classId: string): boolean {
        switch (this.cls._type) {
            case "id":
                return this.cls.id === classId
            case "item":
                return this.cls.item.id === classId
        }
    }

    /**
     * Return copy of this object with all the internal items dereferenced 
     * @param compendiumRepository compendium repository to deref the items from
     */
    async derefProgression(compendiumRepository: CompendiumRepository): Promise<ClassProgression> {
        const derefedClass = await this.derefClass(compendiumRepository)
        const derefedLevels = await Promise.all(this.levels.map(level => level.derefFeatures(compendiumRepository)))
        return derefedClass.withLevels(derefedLevels)
    }

    /**
     * Return copy of this object with all the internal items referenced
     */
    refProgression(): ClassProgression {
        return this.refClass().withLevels(this.levels.map(l => l.refFeatures()))
    }

    /**
     * Try to find a feature within the specified level
     */
    findFeature(levelId: string, featureId: string): ItemReference | null {
        return this.levels.find(l => l.id === levelId)?.features.findFeature(featureId)
    }

    /**
     * Return copy of this object with the new feature created within the specified level id
     */
    public addFeature(featureType: FeatureType, levelId: string, itemRef: ItemReference): ClassProgression {
        switch (featureType) {
            case FeatureTypes.Granted:
                return this.withLevels(this.levels.map(l => {
                    if (l.id === levelId) {
                        return l.addGranted(itemRef)
                    } else {
                        return l
                    }
                }))
            case FeatureTypes.Option:
                return this.withLevels(this.levels.map(l => {
                    if (l.id === levelId) {
                        return l.addOption(itemRef)
                    } else {
                        return l
                    }
                }))
            case FeatureTypes.Prerequisite:
                return this.withLevels(this.levels.map(l => {
                    if (l.id === levelId) {
                        return l.addPrerequisite(itemRef)
                    } else {
                        return l
                    }
                }))
        }
    }

    /**
     * Return copy of this progression with the new level appended
     */
    public addLevel(): ClassProgression {
        const lvl = new ClassLevel(this.randomString(), this.levels.length + 1, new LevelFeatures())
        return this.withLevels([...this.levels, lvl])
    }

    private async derefClass(compendiumRepository: CompendiumRepository): Promise<ClassProgression> {
        switch (this.cls._type) {
            case "id":
                let item = await compendiumRepository.findItemByPackAndId(this.cls.pack, this.cls.id)
                return this.withClass({
                    _type: "item",
                    id: item._id,
                    item: item
                })
            default:
                return this
        }
    }

    private refClass(): ClassProgression {
        switch (this.cls._type) {
            case "item":
                let pack: string | null;
                if (this.cls.item.compendium) {
                    pack = `${this.cls.item.compendium.metadata.package}.${this.cls.item.compendium.metadata.name}`
                }
                return this.withClass({
                    _type: "id",
                    id: this.cls.item.data._id,
                    pack: pack,
                })
            default:
                return this
        }

    }

    private randomString(): string {
        return Math.random().toString(36).substr(2, 5);
    }
}

export class ClassLevel {
    constructor(readonly id: string, readonly level: number, readonly features: LevelFeatures) {

    }

    /**
     * Return copy of this object with all the internal items dereferenced
     * @param compendiumRepository compendium repository to deref the items from
     */
    async derefFeatures(compendiumRepository: CompendiumRepository): Promise<ClassLevel> {
        return new ClassLevel(this.id, this.level, await this.features.derefFeatures(compendiumRepository))
    }

    /**
     * Return copy of this object with all the internal items referenced
     */
    refFeatures(): ClassLevel {
        return new ClassLevel(this.id, this.level, this.features.refFeatures())
    }

    addGranted(reference: ItemReference): ClassLevel {
        return new ClassLevel(this.id, this.level, this.features.addGranted(reference))
    }

    addOption(reference: ItemReference): ClassLevel {
        return new ClassLevel(this.id, this.level, this.features.addOption(reference))
    }

    addPrerequisite(reference: ItemReference): ClassLevel {
        return new ClassLevel(this.id, this.level, this.features.addPrerequisite(reference))
    }
}

export class LevelFeatures {

    constructor(
        readonly granted: Items = { items: [] },
        readonly options: Items = { items: [] },
        readonly prerequisites: Items & Prerequisites = { items: [], prerequisites: [] }) {
    }

    /**
     * Return copy of this object with all the internal items dereferenced
     * @param compendiumRepository compendium repository to deref the items from
     */
    async derefFeatures(compendiumRepository: CompendiumRepository): Promise<LevelFeatures> {
        return new LevelFeatures({
            items: await this.derefItems(compendiumRepository, this.granted.items)
        }, {
            items: await this.derefItems(compendiumRepository, this.options.items)
        }, {
            items: await this.derefItems(compendiumRepository, this.prerequisites.items)
        })
    }

    /**
     * Return copy of this object with all the internal items referenced
     */
    refFeatures(): LevelFeatures {
        return new LevelFeatures({
            items: this.refItems(this.granted.items)
        }, {
            items: this.refItems(this.options.items)
        }, {
            items: this.refItems(this.prerequisites.items)
        })
    }

    /**
     * Try to find the feature by its id
     */
    findFeature(id: string): ItemReference | null {
        return this.granted.items.find(ref => ref.id === id) || this.options.items.find(ref => ref.id === id) || this.prerequisites.items.find(ref => ref.id === id)
    }

    addGranted(reference: ItemReference): LevelFeatures {
        if (this.findFeature(reference.id)) return this;
        return new LevelFeatures({
            items: [...this.granted.items, reference]
        }, this.options, this.prerequisites)
    }

    addOption(reference: ItemReference): LevelFeatures {
        if (this.findFeature(reference.id)) return this;
        return new LevelFeatures(this.granted, {
            items: [...this.options.items, reference]
        }, this.prerequisites)
    }

    addPrerequisite(reference: ItemReference): LevelFeatures {
        if (this.findFeature(reference.id)) return this;
        return new LevelFeatures(this.granted, this.options, {
            items: [...this.prerequisites.items, reference]
        })
    }

    private async derefItems(compendiumRepository: CompendiumRepository, items: Array<ItemReference>): Promise<Array<ItemReference>> {
        return Promise.all(items.map(async ref => {
            switch (ref._type) {
                case "id":
                    const resolved: Item = await compendiumRepository.findItemByPackAndId(ref.pack, ref.id)
                    const itemRef: ItemRef = {
                        _type: "item",
                        id: resolved._id,
                        item: resolved
                    }
                    return itemRef
                default:
                    return ref
            }
        }));
    }

    private refItems(items: Array<ItemReference>): Array<ItemReference> {
        return items.map(ref => {
            switch (ref._type) {
                case "item": {
                    let pack: string | null;
                    if (ref.item.compendium) {
                        pack = `${ref.item.compendium.metadata.package}.${ref.item.compendium.metadata.name}`
                    }
                    return {
                        _type: "id",
                        id: ref.item.data._id,
                        pack: pack
                    }
                }
                default:
                    return ref
            }
        })
    }

}

type ItemRef = {
    _type: "item",
    id: string,
    item: Item
}

type IdRef = {
    _type: "id",
    id: string,
    pack?: string
}

export type ItemReference = ItemRef | IdRef

type Items = {
    items: Array<ItemReference>
}

type Prerequisites = {
    prerequisites?: Array<ItemReference>
}

type RegularFeature = "granted"
type OptionalFeature = "option"
type PrerequisiteFeature = "prerequisite"

export const FeatureTypes = {
    Granted: "granted",
    Option: "option",
    Prerequisite: "prerequisite"
}

export type FeatureType = RegularFeature | OptionalFeature | PrerequisiteFeature

/*@TODO: playersheet stats
*type Race = Item | string
*type SavingThrow = string
*type Skill = string
*type Resistance = Item | string
*type Other = Item | string
*type Proficience = Armor | Weapon | Tool | SavingThrow | Skill | Other
**/