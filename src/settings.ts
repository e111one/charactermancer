import { Config } from "./config.js";

export type Settings = {

}

export class SettingsForm {

    static factory(game: Game, config: Config): ConstructorOf<FormApplication<FormApplication.Options, FormApplication.Data<Settings>, Settings>> {
        return class Form extends FormApplication<FormApplication.Options, FormApplication.Data<Settings>, Settings> {

            constructor(settings?: Settings, options?: Partial<FormApplication.Options>) {
                super(settings, options)
                console.log(game)
                console.log(config)
                console.log(settings)
                console.log(options)
            }

            protected async _updateObject(event: Event, formData?: object) {
                throw new Error("Method not implemented.");
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

    static registerSettings(game: Game, config: Config) {
        game.settings.registerMenu(config.name, config.menuName, {
            name: "Charactermancer Configuration",
            label: "Magic lies ahead",
            icon: "fas fa-bars",
            type: SettingsForm.factory(game, config),
            restricted: true // Restrict this submenu to gamemaster only?
        })
    }

}