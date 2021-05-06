import { Config } from "./config.js"
import { FoundryProgressionRepository } from "./progression/ProgressionRepository.js";
import { ProgressionForm } from "./progression/ProgressionForm.js"

export default class Bootstrap {

    declare game: Game

    static init() {
        Hooks.on("init", () => {
            const progressionRepository = new FoundryProgressionRepository(game.settings, Config)
            ProgressionForm.setupForm(game.settings, progressionRepository, Config);
        });
    }

}