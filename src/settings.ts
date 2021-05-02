import { Config } from "./config.js";
import { ProgressionRepository } from "./progression.js";

export type Settings = {

}

export class ProgressionForm {

    static factory(settings: ClientSettings, progressionRepository: ProgressionRepository, config: Config): ConstructorOf<FormApplication<FormApplication.Options, FormApplication.Data<Settings>, Settings>> {
        return class Form extends FormApplication<FormApplication.Options, FormApplication.Data<Settings>, Settings> {

            constructor(settings?: Settings, options?: Partial<FormApplication.Options>) {
                super(settings, options)
                console.log(config)
                console.log(settings)
                console.log(options)
            }

            protected async _updateObject(event: Event, formData?: object) {
                //@TODO convert form data into ClassProgression list and save it in repository
                progressionRepository.writeProgression([]);
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
                        dragDrop: [{ dragSelector: ".drag" }]
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
