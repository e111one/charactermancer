import { CompendiumRepository } from "./CompendiumRepository";

export class ClassProgression<R extends ItemReference> {
  constructor(
    readonly cls: ItemReference,
    readonly levels: Array<ClassLevel<R>> = []
  ) {}

  public get class(): ItemReference {
    return this.cls;
  }

  withLevels(levels: Array<ClassLevel<R>>): ClassProgression<R> {
    return new ClassProgression(this.class, levels);
  }

  /**
   * Check if this progression contains the required class id
   */
  containsClass(classId: string): boolean {
    switch (this.cls._type) {
      case "id":
        return this.cls.id === classId;
      case "item":
        return this.cls.item.id === classId;
    }
  }

  /**
   * Return copy of this object with all the internal items dereferenced
   * @param compendiumRepository compendium repository to deref the items from
   */
  async derefProgression(
    compendiumRepository: CompendiumRepository
  ): Promise<ClassProgression<ItemRef>> {
    const derefedClass = await this.derefClass(compendiumRepository);
    const derefedLevels = await Promise.all(
      this.levels.map((level) => level.derefFeatures(compendiumRepository))
    );
    return derefedClass.withLevels(derefedLevels);
  }

  /**
   * Return copy of this object with all the internal items referenced
   */
  refProgression(): ClassProgression<IdRef> {
    return this.refClass().withLevels(this.levels.map((l) => l.refFeatures()));
  }

  /**
   * Try to find a feature within the specified level
   */
  findFeature(
    levelId: string,
    featureSetId: string,
    featureId: string
  ): R | null {
    return this.levels
      .find((l) => l.id === levelId)
      ?.features.findFeature(featureSetId, featureId);
  }

  /**
   * Return copy of this object with the new feature created within the specified level id
   */
  public addFeature(
    featureType: FeatureType,
    levelId: string,
    featureSetId: string,
    itemRef: R
  ): ClassProgression<R> {
    switch (featureType) {
      case FeatureTypes.Granted:
        return this.withLevels(
          this.levels.map((l) => {
            if (l.id === levelId) {
              return l.addGranted(featureSetId, itemRef);
            } else {
              return l;
            }
          })
        );
      case FeatureTypes.Option:
        return this.withLevels(
          this.levels.map((l) => {
            if (l.id === levelId) {
              return l.addOption(featureSetId, itemRef);
            } else {
              return l;
            }
          })
        );
      case FeatureTypes.Prerequisite:
        return this.withLevels(
          this.levels.map((l) => {
            if (l.id === levelId) {
              return l.addPrerequisite(featureSetId, itemRef);
            } else {
              return l;
            }
          })
        );
    }
  }

  public removeFeature(
    levelId: string,
    featureSetId: string,
    itemId: string
  ): ClassProgression<R> {
    return this.withLevels(
      this.levels.map((l) => {
        if (l.id === levelId) {
          return l.removeFeature(featureSetId, itemId);
        } else {
          return l;
        }
      })
    );
  }

  /**
   * Return copy of this progression with the new level appended
   */
  public addLevel(): ClassProgression<R> {
    const lvl = new ClassLevel(
      randomString(),
      this.levels.length + 1,
      new LevelFeatures<R>()
    );
    return this.withLevels([...this.levels, lvl]);
  }

  private async derefClass(
    compendiumRepository: CompendiumRepository
  ): Promise<ClassProgression<ItemRef>> {
    switch (this.cls._type) {
      case "id": {
        const item = await compendiumRepository.findItemByPackAndId(
          this.cls.pack,
          this.cls.id
        );
        return new ClassProgression({
          _type: "item",
          id: item._id,
          item: item,
        });
      }
      case "item":
        return this as ClassProgression<ItemRef>;
    }
  }

  private refClass(): ClassProgression<IdRef> {
    switch (this.cls._type) {
      case "item": {
        let pack: string | null;
        if (this.cls.item.compendium) {
          pack = `${this.cls.item.compendium.metadata.package}.${this.cls.item.compendium.metadata.name}`;
        }
        return new ClassProgression({
          _type: "id",
          id: this.cls.item.data._id,
          pack: pack,
        });
      }
      case "id":
        return this as ClassProgression<IdRef>;
    }
  }
}

export class ClassLevel<R extends ItemReference> {
  constructor(
    readonly id: string,
    readonly level: number,
    readonly features: LevelFeatures<R>
  ) {}

  /**
   * Return copy of this object with all the internal items dereferenced
   * @param compendiumRepository compendium repository to deref the items from
   */
  async derefFeatures(
    compendiumRepository: CompendiumRepository
  ): Promise<ClassLevel<ItemRef>> {
    return new ClassLevel(
      this.id,
      this.level,
      await this.features.derefFeatures(compendiumRepository)
    );
  }

  /**
   * Return copy of this object with all the internal items referenced
   */
  refFeatures(): ClassLevel<IdRef> {
    return new ClassLevel(this.id, this.level, this.features.refFeatures());
  }

  addGranted(featureSetId: string, reference: R): ClassLevel<R> {
    return new ClassLevel(
      this.id,
      this.level,
      this.features.addGranted(featureSetId, reference)
    );
  }

  addOption(featureSetId: string, reference: R): ClassLevel<R> {
    return new ClassLevel(
      this.id,
      this.level,
      this.features.addOption(featureSetId, reference)
    );
  }

  addPrerequisite(featureSetId: string, reference: R): ClassLevel<R> {
    return new ClassLevel(
      this.id,
      this.level,
      this.features.addPrerequisite(featureSetId, reference)
    );
  }

  removeFeature(featureSetId: string, itemId: string): ClassLevel<R> {
    return new ClassLevel(
      this.id,
      this.level,
      this.features.removeFeature(featureSetId, itemId)
    );
  }
}

export class LevelFeatures<R extends ItemReference> {
  constructor(
    readonly featureSets: FeatureSets<R> = {
      [randomString()]: emptyFeatureSet(),
    }
  ) {}

  /**
   * Return copy of this object with all the internal items dereferenced
   * @param compendiumRepository compendium repository to deref the items from
   */
  async derefFeatures(
    compendiumRepository: CompendiumRepository
  ): Promise<LevelFeatures<ItemRef>> {
    const derefed = await Promise.all(
      Object.entries(this.featureSets).map<
        Promise<[string, FeatureSet<ItemRef>]>
      >(async ([key, value]) => {
        const featureSet: FeatureSet<ItemRef> = {
          granted: await this.derefItems(compendiumRepository, value.granted),
          options: await this.derefItems(compendiumRepository, value.options),
          prerequisites: await this.derefItems(
            compendiumRepository,
            value.prerequisites
          ),
        };
        return [key, featureSet];
      })
    );
    return new LevelFeatures(Object.fromEntries(derefed));
  }

  /**
   * Return copy of this object with all the internal items referenced
   */
  refFeatures(): LevelFeatures<IdRef> {
    const refs = Object.entries(this.featureSets).map<
      [string, FeatureSet<IdRef>]
    >(([key, value]) => {
      return [
        key,
        {
          granted: this.refItems(value.granted),
          options: this.refItems(value.options),
          prerequisites: this.refItems(value.prerequisites),
        },
      ];
    });
    return new LevelFeatures(Object.fromEntries(refs));
  }

  /**
   * Try to find the feature by its id
   */
  findFeature(featureSetId: string, id: string): R | null {
    return this.findFeatureIn(this.featureSets[featureSetId], id);
  }

  addGranted(featureSetId: string, reference: R): LevelFeatures<R> {
    if (this.findFeatureIn(this.featureSets[featureSetId], reference.id))
      return this;
    return new LevelFeatures({
      ...this.featureSets,
      [featureSetId]: {
        ...this.featureSets[featureSetId],
        granted: [...this.featureSets[featureSetId].granted, reference],
      },
    });
  }

  addOption(featureSetId: string, reference: R): LevelFeatures<R> {
    if (this.findFeatureIn(this.featureSets[featureSetId], reference.id))
      return this;
    return new LevelFeatures({
      ...this.featureSets,
      [featureSetId]: {
        ...this.featureSets[featureSetId],
        options: [...this.featureSets[featureSetId].options, reference],
      },
    });
  }

  addPrerequisite(featureSetId: string, reference: R): LevelFeatures<R> {
    if (this.findFeatureIn(this.featureSets[featureSetId], reference.id))
      return this;
    return new LevelFeatures({
      ...this.featureSets,
      [featureSetId]: {
        ...this.featureSets[featureSetId],
        prerequisites: [
          ...this.featureSets[featureSetId].prerequisites,
          reference,
        ],
      },
    });
  }

  removeFeature(featureSetId: string, itemId: string): LevelFeatures<R> {
    return new LevelFeatures({
      ...this.featureSets,
      [featureSetId]: {
        granted: this.featureSets[featureSetId].granted.filter(
          (feature) => feature.id !== itemId
        ),
        options: this.featureSets[featureSetId].options.filter(
          (feature) => feature.id !== itemId
        ),
        prerequisites: this.featureSets[featureSetId].prerequisites.filter(
          (feature) => feature.id !== itemId
        ),
      },
    });
  }

  private findFeatureIn(
    featureSet: FeatureSet<R>,
    featureId: string
  ): R | null {
    return (
      featureSet.granted.find((ref) => ref.id === featureId) ||
      featureSet.options.find((ref) => ref.id === featureId) ||
      featureSet.prerequisites.find((ref) => ref.id === featureId)
    );
  }

  private async derefItems(
    compendiumRepository: CompendiumRepository,
    items: Array<R>
  ): Promise<Array<ItemRef>> {
    return Promise.all(
      items.map(async (ref: ItemReference) => {
        switch (ref._type) {
          case "id": {
            const resolved = await compendiumRepository.findItemByPackAndId(
              ref.pack,
              ref.id
            );
            const itemRef: ItemRef = {
              _type: "item",
              id: resolved._id,
              item: resolved,
            };
            return itemRef;
          }
          default:
            return ref;
        }
      })
    );
  }

  private refItems(items: Array<ItemReference>): Array<IdRef> {
    return items.map((ref: ItemReference) => {
      switch (ref._type) {
        case "item": {
          let pack: string | null;
          if (ref.item.compendium) {
            pack = `${ref.item.compendium.metadata.package}.${ref.item.compendium.metadata.name}`;
          }
          return {
            _type: "id",
            id: ref.item.data._id,
            pack: pack,
          };
        }
        default:
          return ref;
      }
    });
  }
}

export type ItemRef = {
  _type: "item";
  id: string;
  item: Item;
};

export type IdRef = {
  _type: "id";
  id: string;
  pack?: string;
};

export type ItemReference = ItemRef | IdRef;

type FeatureSets<R extends ItemReference> = Record<string, FeatureSet<R>>;

type FeatureSet<R extends ItemReference> = {
  prerequisites: Array<R>;
  granted: Array<R>;
  options: Array<R>;
};

function emptyFeatureSet<R extends ItemReference>(): FeatureSet<R> {
  return {
    prerequisites: [],
    granted: [],
    options: [],
  };
}

function randomString(): string {
  return Math.random().toString(36).substr(2, 5);
}

type RegularFeature = "granted";
type OptionalFeature = "option";
type PrerequisiteFeature = "prerequisite";

export const FeatureTypes = {
  Granted: "granted",
  Option: "option",
  Prerequisite: "prerequisite",
};

export type FeatureType =
  | RegularFeature
  | OptionalFeature
  | PrerequisiteFeature;

/*@TODO: playersheet stats
 *type Race = Item | string
 *type SavingThrow = string
 *type Skill = string
 *type Resistance = Item | string
 *type Other = Item | string
 *type Proficience = Armor | Weapon | Tool | SavingThrow | Skill | Other
 **/
