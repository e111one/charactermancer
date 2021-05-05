import { Config } from "../config.js";
import { ProgressionRepository } from "./ProgressionRepository.js";
import { ClassProgression } from "./ClassProgression.js";

export type ProgressionSettings = {
    progressions: Array<ClassProgression>
}

export class ProgressionForm {

    static factory(settings: ClientSettings, progressionRepository: ProgressionRepository, config: Config): ConstructorOf<FormApplication<FormApplication.Options, FormApplication.Data<ProgressionSettings>, ProgressionSettings>> {
        return class Form extends FormApplication<FormApplication.Options, FormApplication.Data<ProgressionSettings>, ProgressionSettings> {

            constructor(progression?: ProgressionSettings, options?: Partial<FormApplication.Options>) {
                super(progression, options)
                super.template
            }

            protected async _updateObject(event: Event, formData?: object) {
                console.log(formData)
                progressionRepository.writeProgression([]);
            }

            getData(options?: Application.RenderOptions): FormApplication.Data<ProgressionSettings> | Promise<FormApplication.Data<ProgressionSettings>> {
                let progressions = progressionRepository.readProgression() //@TODO use the actual progression settings below instead of the mock
                return {
                    object: duplicate({
                        progressions: [{
                            class: "Bard",
                            levels: []
                        }, {
                            class: "Barbarian",
                            levels: []
                        }]
                    }),
                    options: Form.defaultOptions,
                    title: Form.defaultOptions.title
                }
            }

            protected _onDrop(event: DragEvent) {
                console.log(event.dataTransfer.getData('text/plain'));
                super._onDrop(event);
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
                        dragDrop: [{ dragSelector: ".drag" }],
                        tabs: [{
                            navSelector: ".tabs",
                            contentSelector: "form",
                            initial: "Bard"
                        }]
                    }
                }
            }
        }
    }

    static setupForm(settings: ClientSettings, progressionRepository: ProgressionRepository, config: Config) {
        settings.registerMenu(config.name, config.menuName, {
            name: "Charactermancer Configuration",
            label: "Magic lies ahead",
            icon: "fas fa-bars",
            type: ProgressionForm.factory(settings, progressionRepository, config),
            restricted: true // Restrict this submenu to gamemaster only?
        })
    }

}
