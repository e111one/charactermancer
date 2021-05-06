import { ClassProgression } from "./ClassProgression.js";
import { Config } from "../config.js";

export interface ProgressionRepository {

    /**
     * Read progression list from the storage
     */
    readProgression(): ClassProgression[]

    /**
     * Update progression list in the storage
     */
    writeProgression(prog: ClassProgression[]): Promise<ClassProgression[]>

}

export class FoundryProgressionRepository implements ProgressionRepository {

    initialized = false;

    constructor(protected settings: ClientSettings, protected config: Config) {
        this.init()
    }

    /**
     * Initialize the repository by registering the module & repository key in Foundry client settings
     */
    protected init(): void {
        if (!this.initialized) {
            this.settings.register(this.config.name, this.config.progressionRepositoryName, {
                scope: "world",
                default: {
                    progs: []
                },
                onChange: value => {
                    console.log(value)
                }
            })
            this.initialized = true;
        }
    }

    readProgression(): ClassProgression[] {
        const progs = this.settings.get(this.config.name, this.config.progressionRepositoryName) as Progs
        return progs.progs
    }

    writeProgression(prog: ClassProgression[]): Promise<ClassProgression[]> {
        return this.settings.set(this.config.name, this.config.progressionRepositoryName, {
            progs: prog
        }).then(p => p.progs)
    }
}

/**
 * Object to store in FoundryVTT settings
 */
type Progs = {
    progs: ClassProgression[]
}