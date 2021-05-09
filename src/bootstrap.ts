import { Config } from "./config.js";
import { FoundryProgressionRepository } from "./progression/ProgressionRepository.js";
import { ProgressionForm } from "./progression/ProgressionForm.js";
import { FoundryCompendiumRepository } from "./progression/CompendiumRepository.js";

export default class Bootstrap {
  declare game: Game;
  declare CONFIG: unknown;

  static init(): void {
    Hooks.on("init", () => {
      Hooks.on("renderCompendiumDirectory", () => {
        const compendiumRepository = new FoundryCompendiumRepository(
          game.packs
        );
        const progressionRepository = new FoundryProgressionRepository(
          game.settings,
          compendiumRepository,
          Config
        );
        void ProgressionForm.setupForm(
          game.settings,
          progressionRepository,
          compendiumRepository,
          Config
        );
      });
    });
  }
}
