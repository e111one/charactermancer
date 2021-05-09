import { CompendiumRepository } from "./CompendiumRepository";

export class ClassProgression<R extends ItemReference> {
    constructor(readonly cls: ItemReference, readonly levels: Array<ClassLevel<R>> = []) {

    }

    public get class(): ItemReference {
        return this.cls;
    }

    withLevels(levels: Array<ClassLevel<R>>): ClassProgression<R> {
        return new ClassProgression(this.class, levels)
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
    async derefProgression(compendiumRepository: CompendiumRepository): Promise<ClassProgression<ItemRef>> {
        const derefedClass = await this.derefClass(compendiumRepository)
        const derefedLevels = await Promise.all(this.levels.map(level => level.derefFeatures(compendiumRepository)))
        return derefedClass.withLevels(derefedLevels)
    }

    /**
     * Return copy of this object with all the internal items referenced
     */
    refProgression(): ClassProgression<IdRef> {
        return this.refClass().withLevels(this.levels.map(l => l.refFeatures()))
    }

    /**
     * Try to find a feature within the specified level
     */
    findFeature(levelId: string, featureId: string): R | null {
        return this.levels.find(l => l.id === levelId)?.features.findFeature(featureId)
    }

    /**
     * Return copy of this object with the new feature created within the specified level id
     */
    public addFeature(featureType: FeatureType, levelId: string, itemRef: R): ClassProgression<R> {
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
    public addLevel(): ClassProgression<R> {
        const lvl = new ClassLevel(this.randomString(), this.levels.length + 1, new LevelFeatures<R>())
        return this.withLevels([...this.levels, lvl])
    }

    private async derefClass(compendiumRepository: CompendiumRepository): Promise<ClassProgression<ItemRef>> {
        switch (this.cls._type) {
            case "id":
                let item = await compendiumRepository.findItemByPackAndId(this.cls.pack, this.cls.id)
                return new ClassProgression({
                    _type: "item",
                    id: item._id,
                    item: item
                })
            case "item":
                return (this as ClassProgression<ItemRef>)
        }
    }

    private refClass(): ClassProgression<IdRef> {
        switch (this.cls._type) {
            case "item":
                let pack: string | null;
                if (this.cls.item.compendium) {
                    pack = `${this.cls.item.compendium.metadata.package}.${this.cls.item.compendium.metadata.name}`
                }
                return new ClassProgression({
                    _type: "id",
                    id: this.cls.item.data._id,
                    pack: pack,
                })
            case "id":
                return (this as ClassProgression<IdRef>)
        }

    }

    private randomString(): string {
        return Math.random().toString(36).substr(2, 5);
    }
}

export class ClassLevel<R extends ItemReference> {
    constructor(readonly id: string, readonly level: number, readonly features: LevelFeatures<R>) {

    }

    /**
     * Return copy of this object with all the internal items dereferenced
     * @param compendiumRepository compendium repository to deref the items from
     */
    async derefFeatures(compendiumRepository: CompendiumRepository): Promise<ClassLevel<ItemRef>> {
        return new ClassLevel(this.id, this.level, await this.features.derefFeatures(compendiumRepository))
    }

    /**
     * Return copy of this object with all the internal items referenced
     */
    refFeatures(): ClassLevel<IdRef> {
        return new ClassLevel(this.id, this.level, this.features.refFeatures())
    }

    addGranted(reference: R): ClassLevel<R> {
        return new ClassLevel(this.id, this.level, this.features.addGranted(reference))
    }

    addOption(reference: R): ClassLevel<R> {
        return new ClassLevel(this.id, this.level, this.features.addOption(reference))
    }

    addPrerequisite(reference: R): ClassLevel<R> {
        return new ClassLevel(this.id, this.level, this.features.addPrerequisite(reference))
    }
}

export class LevelFeatures<R extends ItemReference> {

    constructor(
        readonly granted: Items<R> = { items: [] },
        readonly options: Items<R> = { items: [] },
        readonly prerequisites: Items<R> & Prerequisites<R> = { items: [], prerequisites: [] }) {
    }

    /**
     * Return copy of this object with all the internal items dereferenced
     * @param compendiumRepository compendium repository to deref the items from
     */
    async derefFeatures(compendiumRepository: CompendiumRepository): Promise<LevelFeatures<ItemRef>> {
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
    refFeatures(): LevelFeatures<IdRef> {
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
    findFeature(id: string): R | null {
        return this.granted.items.find(ref => ref.id === id) || this.options.items.find(ref => ref.id === id) || this.prerequisites.items.find(ref => ref.id === id)
    }

    addGranted(reference: R): LevelFeatures<R> {
        if (this.findFeature(reference.id)) return this;
        return new LevelFeatures({
            items: [...this.granted.items, reference]
        }, this.options, this.prerequisites)
    }

    addOption(reference: R): LevelFeatures<R> {
        
        return new LevelFeatures(this.granted, {
            items: [...this.options.items, reference]
        }, this.prerequisites)
    }

    addPrerequisite(reference: R): LevelFeatures<R> {
        
        return new LevelFeatures(this.granted, this.options, {
            items: [...this.prerequisites.items, reference]
        })
    }

    private async derefItems(compendiumRepository: CompendiumRepository, items: Array<R>): Promise<Array<ItemRef>> {
        return Promise.all(items.map(async (ref: ItemReference) => {
            switch (ref._type) {
                case "id":
                    let resolved = await compendiumRepository.findItemByPackAndId(ref.pack, ref.id)
                    const itemRef: ItemRef = {
                        _type: "item",
                        id: resolved._id,
                        item: resolved
                    }
                    return itemRef;
                default:
                    return ref
            }
        }));
    }

    private refItems(items: Array<ItemReference>): Array<IdRef> {
        return items.map((ref: ItemReference) => {
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

export type ItemRef = {
    _type: "item",
    id: string,
    item: Item
}

export type IdRef = {
    _type: "id",
    id: string,
    pack?: string
}

export type ItemReference = ItemRef | IdRef

type Items<R extends ItemReference> = {
    items: Array<R>
}

type Prerequisites<R extends ItemReference> = {
    prerequisites?: Array<R>
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