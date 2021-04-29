import { Config } from "./config.js"
import { SettingsForm } from "./settings.js"

export default class Bootstrap {

    declare game: Game

    static init() {
        Hooks.on("init", () => {
            SettingsForm.registerSettings(game, Config);
        });
    }

}