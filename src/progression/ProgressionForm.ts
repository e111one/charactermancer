import { Config } from "../config.js";
import { ProgressionRepository } from "./ProgressionRepository.js";
import { ClassProgression, ItemReference } from "./ClassProgression.js";
import { CompendiumRepository } from "./CompendiumRepository.js";

export type ProgressionSettings = {
    progressions: Array<ClassProgression>
}
export class ProgressionForm {

    static factory(settings: ClientSettings, progressionRepository: ProgressionRepository, compendiumRepository: CompendiumRepository, config: Config): ConstructorOf<FormApplication<FormApplication.Options, FormApplication.Data<ProgressionSettings>, ProgressionSettings>> {
        return class Form extends FormApplication<FormApplication.Options, FormApplication.Data<ProgressionSettings>, ProgressionSettings> {

            private progressions: ClassProgression[];
            private _currentTab: string

            constructor(progression?: ProgressionSettings, options?: Partial<FormApplication.Options>) {
                super(progression, options)
                this.progressions = progressionRepository.readProgression()
            }

            protected async _updateObject(event: Event, formData?: object) {
                progressionRepository.writeProgression([] /*this.referenceProgressions(this.progressions)*/);
            }
            /**
             * Data that is fed to Handlebars template
             * @param options 
             * @returns progressions list resolved into actual items
             */
            getData(options?: Application.RenderOptions): FormApplication.Data<ProgressionSettings> | Promise<FormApplication.Data<ProgressionSettings>> {
                return this.resolveProgression(this.progressions).then(_ => {
                    return {
                        object: duplicate({
                            progressions: this.progressions
                        }),
                        options: Form.defaultOptions,
                        title: Form.defaultOptions.title
                    }
                });
            }

            activateListeners(html: JQuery): void {
                super.activateListeners(html)
                this.bindAddLevelButtons(html)
                this.bindItemSheetClicks(html)
            }

            private bindAddLevelButtons(html: JQuery): void {
                html.find(".new-lvl").map((index, element) => {
                    element.addEventListener("click", (event) => {
                        event.preventDefault()
                        let classId = element.getAttribute("data-class-id")
                        this.addLevel(classId)
                        this.render()
                    })
                });
            }

            private bindItemSheetClicks(html: JQuery): void {
                html.find(".feature-link").map((_, element) => {
                    element.addEventListener("click", (event) => {
                        let classId = element.getAttribute("data-class-id")
                        let levelId = element.getAttribute("data-level-id")
                        let itemId = element.getAttribute("data-item-id")

                        let ref = this.progressions.find(prog => prog.class.id === classId)?.findFeature(levelId, itemId)

                        switch (ref?._type) {
                            case "item":
                                ref.item.sheet.render(true)
                        }
                    });
                });
            }

            /**
             * React to drag&drop event
             * @param event 
             */
            protected _onDrop(event: DragEvent) {
                const item = JSON.parse(event.dataTransfer.getData('text/plain')) as DropItem;
                const target = event.target as HTMLElement;

                const dropTarget = this.getDropTarget(target)

                if (dropTarget == null) {
                    console.log("Something went horribly wrong with the drop target")
                    //@TODO notify error
                    return
                }

                if (item && item.id && item.type === "Item") {
                    if (item.pack) {
                        this.addFromCompendium(item, dropTarget).then(_ => this.render())
                    } else {
                        //@TODO it's from the items directory, not compendium
                    }
                } else {
                    //@TODO notify with error
                }

                super._onDrop(event);
            }

            /**
             * Figure out the drop target. Is it a class or one of the levels?
             * @param target HTMLElement that is a drop victim
             * @returns 
             */
            private getDropTarget(target: HTMLElement): DropTarget | null {
                if (target.classList.contains("drop-box")) {
                    if (target.classList.contains("class-drop")) {
                        return {
                            _type: "class"
                        }
                    } else if (target.classList.contains("features") && target.classList.contains("granted")) {
                        return {
                            _type: "level",
                            featureType: "granted",
                            levelId: target.getAttribute("data-level-id"),
                            classId: target.getAttribute("data-class-id")
                        }
                    } else if (target.classList.contains("features") && target.classList.contains("options")) {
                        return {
                            _type: "level",
                            featureType: "option",
                            levelId: target.getAttribute("data-level-id"),
                            classId: target.getAttribute("data-class-id")
                        }
                    } else if (target.classList.contains("features") && target.classList.contains("prerequisites")) {
                        return {
                            _type: "level",
                            featureType: "prerequisite",
                            levelId: target.getAttribute("data-level-id"),
                            classId: target.getAttribute("data-class-id")
                        }
                    }
                } else {
                    //seems like we are inside of a child element. should climb up the DOM tree
                    return this.getDropTarget(target.parentElement)
                }
            }

            /**
             * Find item in compendium and add it to the target
             * @param item item to look for in compendiums
             * @param dropTarget target to add the resolved item to
             */
            private async addFromCompendium(item: DropItem, dropTarget: DropTarget): Promise<void> {
                let compendiumItem = await compendiumRepository.findItemByPackAndId(item.pack, item.id)

                if (dropTarget._type === "class" && compendiumItem.data.type === "class") {
                    this.addClass(compendiumItem, item.pack)
                } else if (dropTarget._type === "level") {
                    this.addFeature(compendiumItem, dropTarget.featureType, dropTarget.classId, dropTarget.levelId, item.pack)
                }
            }

            /**
             * Add new class to the internal state of the form
             * @param classItem resolved class item
             * @param pack options package id if the item was from compendium
             */
            private addClass(classItem: Item, pack?: string): void {
                this._tabs[0].active = classItem.data._id
                this.progressions.push(new ClassProgression({
                    _type: "item",
                    id: classItem._id,
                    item: classItem
                }))
            }

            private addFeature(featureItem: Item, featureType: FeatureType, classId: string, levelId: string, pack?: string): void {
                const cls = this.progressions.find(prog => prog.class.id === classId)
                cls?.addFeature(featureType, levelId, {
                    _type: "item",
                    id: featureItem._id,
                    item: featureItem
                })
            }

            private addLevel(classId: string): void {
                const cls = this.progressions.find(prog => prog.class.id === classId)
                cls?.addLevel()
            }

            /**
             * Map over progressions and resolve identifiers to the actual items from compendium or items list
             * @param progs list of progressions
             */
            private async resolveProgression(progs: ClassProgression[]): Promise<void> {
                await Promise.all(this.progressions.map(p => p.derefItems(compendiumRepository)))
            }

            /**
             * Reverse operation to `resolveProgression`
             * @param progs list of progressions
             */
            private referenceProgression(progs: ClassProgression[]): void {
                this.progressions.map(p => p.refItems())
            }

            static get defaultOptions(): FormApplication.Options {
                return {
                    ... super.defaultOptions,
                    ... {
                        title: "Charactermancer Configuration",
                        id: Config.name,
                        template: 'modules/charactermancer/templates/settings.html',
                        closeOnSubmit: true,
                        submitOnChange: true,
                        submitOnClose: true,
                        popOut: true,
                        width: 600,
                        height: 'auto',
                        resizable: true,
                        dragDrop: [{ dropSelector: ".drop-box" }],
                        tabs: [{
                            navSelector: ".tabs",
                            contentSelector: "form",
                        }]
                    }
                }
            }
        }
    }

    static setupForm(settings: ClientSettings, progressionRepository: ProgressionRepository, compendiumRepository: CompendiumRepository, config: Config) {
        loadTemplates(['modules/charactermancer/templates/features.html']);
        settings.registerMenu(config.name, config.menuName, {
            name: "Charactermancer Configuration",
            label: "Magic lies ahead",
            icon: "fas fa-bars",
            type: ProgressionForm.factory(settings, progressionRepository, compendiumRepository, config),
            restricted: true // Restrict this submenu to gamemaster only?
        })
    }

}

type DropItem = {
    type: string,
    id: string,
    pack?: string
}

type LevelTarget = {
    _type: "level",
    featureType: FeatureType,
    levelId: string,
    classId: string
}

type ClassTarget = {
    _type: "class"
}

type DropTarget = ClassTarget | LevelTarget //@TODO proper targets

type RegularFeature = "granted"
type OptionalFeature = "option"
type PrerequisiteFeature = "prerequisite"

type FeatureType = RegularFeature | OptionalFeature | PrerequisiteFeature