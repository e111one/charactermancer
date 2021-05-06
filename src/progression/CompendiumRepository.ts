export interface CompendiumRepository {

    findItemByPackAndId(packName: string, itemId: string): Promise<Item | null>

}

export class FoundryCompendiumRepository implements CompendiumRepository {

    constructor(protected compendiums: Collection<Compendium>) {

    }

    findItemByPackAndId(packName: string, itemId: string): Promise<Item | null> {
        return this.compendiums.get(packName).getEntity(itemId).then(entity => {
            if (entity instanceof Item) {
                return entity
            } else {
                return null
            }
        })
    }

}