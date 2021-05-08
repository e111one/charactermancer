import { CompendiumRepository } from "./CompendiumRepository";

export class ClassProgression {
    constructor(protected cls: ItemReference, readonly levels: Array<ClassLevel> = []) {

    }

    containsClass(classId: string): boolean {
        switch (this.cls._type) {
            case "id":
                return this.cls.id === classId
            case "item":
                return this.cls.item.id === classId
        }
    }

    async derefItems(compendiumRepository: CompendiumRepository): Promise<void> {
        await this.derefClass(compendiumRepository)
        Promise.all(this.levels.map(level => level.features.derefFeatures(compendiumRepository)))
    }

    refItems(): void {
        this.refClass()
        this.levels.map(level => level.features.refFeatures())
    }

    findFeature(levelId: string, featureId: string): ItemReference | null {
        return this.levels.find(l => l.id === levelId)?.features.findFeature(featureId)
    }

    private async derefClass(compendiumRepository: CompendiumRepository): Promise<void> {
        switch (this.cls._type) {
            case "id":
                let item = await compendiumRepository.findItemByPackAndId(this.cls.pack, this.cls.id)
                this.cls = {
                    _type: "item",
                    id: item._id,
                    item: item
                }
        }
    }

    private refClass(): void {
        switch (this.cls._type) {
            case "item":
                let pack: string | null;
                if (this.cls.item.compendium) {
                    pack = `${this.cls.item.compendium.metadata.package}.${this.cls.item.compendium.metadata.name}`
                }
                this.cls = {
                    _type: "id",
                    id: this.cls.item.data._id,
                    pack: pack
                }
        }

    }

    public get class(): ItemReference {
        return this.cls;
    }

    public addFeature(featureType: "granted" | "option" | "prerequisite", levelId: string, itemRef: ItemReference): void {
        switch (featureType) {
            case "granted":
                this.levels.find(l => l.id === levelId)?.addGranted(itemRef)
                break
            case "option":
                this.levels.find(l => l.id === levelId)?.addOption(itemRef)
                break
            case "prerequisite":
                this.levels.find(l => l.id === levelId)?.addPrerequisite(itemRef)
        }
    }

    public addLevel(): ClassLevel {
        const lvl = new ClassLevel(this.randomString(), this.levels.length + 1, new LevelFeatures())
        this.levels.push(lvl)
        return lvl
    }

    private randomString(): string {
        return Math.random().toString(36).substr(2, 5);
    }
}

export class ClassLevel {
    constructor(readonly id: string, readonly level: number, readonly features: LevelFeatures) {

    }

    addGranted(reference: ItemReference) {
        this.features.granted.items.push(reference)
    }

    addOption(reference: ItemReference) {
        this.features.options.items.push(reference)
    }

    addPrerequisite(reference: ItemReference) {
        this.features.prerequisites.items.push(reference)
    }
}

export class LevelFeatures {

    public granted: Items
    public options: Items
    public prerequisites: Items & Prerequisites


    constructor(granted?: Items, options?: Items, prerequisites?: Items & Prerequisites) {
        this.granted = granted || { items: [] }
        this.options = options || { items: [] }
        this.prerequisites = prerequisites || { items: [], prerequisites: [] }
    }

    async derefFeatures(compendiumRepository: CompendiumRepository): Promise<void> {
        this.granted.items = await this.derefItems(compendiumRepository, this.granted.items)
        this.options.items = await this.derefItems(compendiumRepository, this.options.items)
        this.prerequisites.items = await this.derefItems(compendiumRepository, this.prerequisites.items)
    }

    refFeatures(): void {
        this.granted.items = this.refItems(this.granted.items)
        this.options.items = this.refItems(this.options.items)
        this.prerequisites.items = this.refItems(this.prerequisites.items)
    }

    findFeature(id: string): ItemReference | null {
        return this.granted.items.find(ref => ref.id === id) || this.options.items.find(ref => ref.id === id) || this.prerequisites.items.find(ref => ref.id === id)
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

/*@TODO: playersheet stats
*type Race = Item | string
*type SavingThrow = string
*type Skill = string
*type Resistance = Item | string
*type Other = Item | string
*type Proficience = Armor | Weapon | Tool | SavingThrow | Skill | Other
**/