import { Config } from "../config.js";
import { ProgressionRepository } from "./ProgressionRepository.js";
import { ClassProgression } from "./ClassProgression.js";
import { CompendiumRepository } from "./CompendiumRepository.js";

export type ProgressionSettings = {
    progressions: Array<ClassProgression>
}

export class ProgressionForm {

    static factory(settings: ClientSettings, progressionRepository: ProgressionRepository, compendiumRepository: CompendiumRepository, config: Config): ConstructorOf<FormApplication<FormApplication.Options, FormApplication.Data<ProgressionSettings>, ProgressionSettings>> {
        return class Form extends FormApplication<FormApplication.Options, FormApplication.Data<ProgressionSettings>, ProgressionSettings> {

            private progressions: ClassProgression[];

            constructor(progression?: ProgressionSettings, options?: Partial<FormApplication.Options>) {
                super(progression, options)
                this.progressions = progressionRepository.readProgression()
            }

            protected async _updateObject(event: Event, formData?: object) {
                progressionRepository.writeProgression([] /*this.progressions*/);
            }

            /**
             * Data that is fed to Handlebars template
             * @param options 
             * @returns progressions list resolved into actual items
             */
            getData(options?: Application.RenderOptions): FormApplication.Data<ProgressionSettings> | Promise<FormApplication.Data<ProgressionSettings>> {
                return this.resolveProgression(this.progressions).then(resolved => {
                    return {
                        object: duplicate({
                            progressions: resolved
                        }),
                        options: Form.defaultOptions,
                        title: Form.defaultOptions.title
                    }
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
            private getDropTarget(target: HTMLElement): DropTarget {
                if (target.classList.contains("class-drop")) {
                    return "class"
                } else {
                    //@TODO read target properties to figure out what level it is (+ parent dnd class)?
                    return "feature"
                }
            }

            /**
             * Find item in compendium and add it to the target
             * @param item item to look for in compendiums
             * @param dropTarget target to add the resolved item to
             */
            private async addFromCompendium(item: DropItem, dropTarget: DropTarget): Promise<void> {
                let compendiumItem = await compendiumRepository.findItemByPackAndId(item.pack, item.id)

                if (dropTarget === "class" && compendiumItem.data.type === "class") {
                    this.addClass(compendiumItem, item.pack)
                }
            }

            /**
             * Add new class to the internal state of the form
             * @param classItem resolved class item
             * @param pack optional package id if the item was from compendium
             */
            private addClass(classItem: Item, pack?: string): void {
                this.progressions.push({
                    class: {
                        item: classItem,
                        pack: pack
                    },
                    levels: []
                })
            }

            /**
             * Map over progressions and resolve identifiers to the actual items from compendium or items list
             * @param progs list of progressions
             */
            private async resolveProgression(progs: ClassProgression[]): Promise<ClassProgression[]> {
                return Promise.all(
                    progs.map(async p => {
                        if (typeof p.class.item === "string") {
                            if (p.class.pack) {
                                const item = await compendiumRepository.findItemByPackAndId(p.class.pack, p.class.item);
                                p.class.item = item;
                                return p
                            } else {
                                return p
                            }
                        } else {
                            return p
                        }
                    }))
            }

            /**
             * Reverse operation to `resolveProgression`
             * @param progs list of progressions
             */
            private referenceProgression(progs: ClassProgression[]): ClassProgression[] {
                return progs.map(p => {
                    if (p.class.item instanceof Item) {
                        p.class.item = p.class.item._id
                    }
                    return p;
                })
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
                            contentSelector: "form"
                        }]
                    }
                }
            }
        }
    }

    static setupForm(settings: ClientSettings, progressionRepository: ProgressionRepository, compendiumRepository: CompendiumRepository, config: Config) {
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

type DropTarget = "class" | "feature" //@TODO proper targets