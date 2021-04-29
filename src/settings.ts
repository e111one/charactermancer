import { Config } from "./config.js";

export type Settings = {

}

export class SettingsForm extends FormApplication<FormApplication.Options, FormApplication.Data<Settings>, Settings> {

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
                dragDrop: [{ dropSelector: ".drop" }]
            }
        }
    }

    static registerSettings(game: Game, config: Config) {
        game.settings.registerMenu(config.name, config.menuName, {
            name: "Charactermancer Configuration",
            label: "Magic lies ahead",
            icon: "fas fa-bars",
            type: SettingsForm,
            restricted: true // Restrict this submenu to gamemaster only?
        })
    }

}