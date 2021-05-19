import { Config } from "../config.js";
import { ProgressionRepository } from "./ProgressionRepository.js";
import {
  ClassProgression,
  FeatureType,
  IdRef,
  ItemRef,
} from "./ClassProgression.js";
import { CompendiumRepository } from "./CompendiumRepository.js";

export type ProgressionSettings = {
  progressions: Array<ClassProgression<ItemRef>>;
};
export class ProgressionForm {
  static factory(
    progressionRepository: ProgressionRepository,
    compendiumRepository: CompendiumRepository
  ): ConstructorOf<
    FormApplication<
      FormApplication.Options,
      FormApplication.Data<ProgressionSettings>,
      ProgressionSettings
    >
  > {
    return class Form extends FormApplication<
      FormApplication.Options,
      FormApplication.Data<ProgressionSettings>,
      ProgressionSettings
    > {
      private _currentTab: string;

      constructor(
        progression?: ProgressionSettings,
        options?: Partial<FormApplication.Options>
      ) {
        super(progression, options);
      }

      //eslint-disable-next-line @typescript-eslint/ban-types
      protected async _updateObject(_event: Event, _formData?: object) {
        //everything is already saved
      }

      /**
       * Data that is fed to Handlebars template
       * @param options
       * @returns progressions list resolved into actual items
       */
      getData(
        _options?: Application.RenderOptions
      ):
        | FormApplication.Data<ProgressionSettings>
        | Promise<FormApplication.Data<ProgressionSettings>> {
        return progressionRepository.readProgression().then((progs) => {
          return {
            object: duplicate({
              progressions: progs,
            }),
            options: Form.defaultOptions,
            title: Form.defaultOptions.title,
          };
        });
      }

      activateListeners(html: JQuery): void {
        super.activateListeners(html);
        this.bindAddLevelButtons(html);
        this.bindItemSheetClicks(html);
        this.bindDragHighlight(html);
        this.bindRemoveFeatureItemClicks(html);
        this.bindNewFeatureSetClicks(html);
      }

      private bindAddLevelButtons(html: JQuery): void {
        html.find(".new-lvl").map((index, element) => {
          element.addEventListener("click", (event) => {
            event.preventDefault();
            const classId = element.getAttribute("data-class-id");
            void this.addLevel(classId).then((_) => this.render());
          });
        });
      }

      private bindItemSheetClicks(html: JQuery): void {
        html.find(".feature-link").map((_, element) => {
          element.addEventListener("click", (_) => {
            const classId = element.getAttribute("data-class-id");
            const levelId = element.getAttribute("data-level-id");
            const featureSetId = element.getAttribute("data-feature-set-id");
            const itemId = element.getAttribute("data-item-id");

            void progressionRepository
              .findFeatureOf(classId, levelId, featureSetId, itemId)
              .then((ref) => {
                ref.item.sheet.render(true);
              });
          });
        });
      }

      private bindNewFeatureSetClicks(html: JQuery): void {
        html.find(".add-feature-set").map((_, element) => {
          element.addEventListener("click", (_) => {
            const classId = element.getAttribute("data-class-id");
            const levelId = element.getAttribute("data-level-id");

            void progressionRepository
              .addFeatureSet(classId, levelId)
              .then((_) => this.render());
          });
        });
      }

      private bindRemoveFeatureItemClicks(html: JQuery): void {
        html.find(".feature-delete").map((_, element) => {
          element.addEventListener("click", (event) => {
            event.preventDefault();
            const classId = element.getAttribute("data-class-id");
            const levelId = element.getAttribute("data-level-id");
            const featureSetId = element.getAttribute("data-feature-set-id");
            const itemId = element.getAttribute("data-item-id");
            void progressionRepository
              .removeFeatureOf(classId, levelId, featureSetId, itemId)
              .then((_) => this.render());
          });
        });
      }

      private bindDragHighlight(html: JQuery): void {
        html.find(".features").map((_, element) => {
          const [onDragEnter, onDragLeave, onDrop] = [
            element.ondragenter,
            element.ondragleave,
            element.ondrop,
          ];
          const className = "features-target";
          let counter = 0;
          element.ondragenter = (event) => {
            counter++;
            onDragEnter?.call(null, event);
            if (counter > 0) {
              element.classList.add(className);
            }
          };

          element.ondragleave = (event) => {
            counter--;
            onDragLeave?.call(null, event);
            if (counter <= 0) {
              element.classList.remove(className);
            }
          };

          element.ondrop = (event) => {
            counter = 0;
            onDrop?.call(null, event);
            element.classList.remove(className);
          };
        });
      }

      /**
       * React to drag&drop event
       * @param event
       */
      protected _onDrop(event: DragEvent) {
        const item = JSON.parse(
          event.dataTransfer.getData("text/plain")
        ) as DropItem;
        const target = event.target as HTMLElement;

        const dropTarget = this.getDropTarget(target);

        if (dropTarget == null) {
          console.log("Something went horribly wrong with the drop target");
          //@TODO notify error
          return;
        }

        if (item && item.id && item.type === "Item") {
          if (item.pack) {
            void this.addFromCompendium(item, dropTarget).then((_) =>
              this.render()
            );
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
              _type: "class",
            };
          } else if (
            target.classList.contains("features") &&
            target.classList.contains("granted")
          ) {
            return {
              _type: "level",
              featureType: "granted",
              levelId: target.getAttribute("data-level-id"),
              classId: target.getAttribute("data-class-id"),
              featureSetId: target.getAttribute("data-feature-set-id"),
            };
          } else if (
            target.classList.contains("features") &&
            target.classList.contains("options")
          ) {
            return {
              _type: "level",
              featureType: "option",
              levelId: target.getAttribute("data-level-id"),
              classId: target.getAttribute("data-class-id"),
              featureSetId: target.getAttribute("data-feature-set-id"),
            };
          } else if (
            target.classList.contains("features") &&
            target.classList.contains("prerequisites")
          ) {
            return {
              _type: "level",
              featureType: "prerequisite",
              levelId: target.getAttribute("data-level-id"),
              classId: target.getAttribute("data-class-id"),
              featureSetId: target.getAttribute("data-feature-set-id"),
            };
          }
        } else {
          //seems like we are inside of a child element. should climb up the DOM tree
          return this.getDropTarget(target.parentElement);
        }
      }

      /**
       * Find item in compendium and add it to the target
       * @param item item to look for in compendiums
       * @param dropTarget target to add the resolved item to
       */
      private async addFromCompendium(
        item: DropItem,
        dropTarget: DropTarget
      ): Promise<ClassProgression<IdRef>[]> {
        const compendiumItem = await compendiumRepository.findItemByPackAndId(
          item.pack,
          item.id
        );

        if (
          dropTarget._type === "class" &&
          compendiumItem.data.type === "class"
        ) {
          return this.addClass(compendiumItem);
        } else if (dropTarget._type === "level") {
          return this.addFeature(
            compendiumItem,
            dropTarget.featureType,
            dropTarget.classId,
            dropTarget.levelId,
            dropTarget.featureSetId
          );
        }
      }

      /**
       * Add new class to the internal state of the form
       * @param classItem resolved class item
       * @param pack options package id if the item was from compendium
       */
      private async addClass(
        classItem: Item
      ): Promise<ClassProgression<IdRef>[]> {
        const progs = await progressionRepository.addClass(classItem);
        this._tabs[0].active = classItem.data._id;
        return progs;
      }

      private addFeature(
        featureItem: Item,
        featureType: FeatureType,
        classId: string,
        levelId: string,
        featureSetId: string
      ): Promise<ClassProgression<IdRef>[]> {
        return progressionRepository.addFeatureFor(
          classId,
          levelId,
          featureType,
          featureSetId,
          featureItem
        );
      }

      private addLevel(classId: string): Promise<ClassProgression<IdRef>[]> {
        return progressionRepository.addLevelOf(classId);
      }

      static get defaultOptions(): FormApplication.Options {
        return {
          ...super.defaultOptions,
          ...{
            title: "Charactermancer Configuration",
            id: Config.name,
            template: "modules/charactermancer/templates/settings.html",
            closeOnSubmit: true,
            submitOnChange: true,
            submitOnClose: true,
            popOut: true,
            width: 600,
            height: "auto",
            resizable: true,
            dragDrop: [{ dropSelector: ".drop-box" }],
            tabs: [
              {
                navSelector: ".tabs",
                contentSelector: "form",
              },
            ],
          },
        };
      }
    };
  }

  static async setupForm(
    settings: ClientSettings,
    progressionRepository: ProgressionRepository,
    compendiumRepository: CompendiumRepository,
    config: Config
  ): Promise<void> {
    await loadTemplates(["modules/charactermancer/templates/features.html"]);
    settings.registerMenu(config.name, config.menuName, {
      name: "Charactermancer Configuration",
      label: "Magic lies ahead",
      icon: "fas fa-bars",
      type: ProgressionForm.factory(
        progressionRepository,
        compendiumRepository
      ),
      restricted: true, // Restrict this submenu to gamemaster only?
    });
  }
}

type DropItem = {
  type: string;
  id: string;
  pack?: string;
};

type LevelTarget = {
  _type: "level";
  featureType: FeatureType;
  levelId: string;
  classId: string;
  featureSetId: string;
};

type ClassTarget = {
  _type: "class";
};

type DropTarget = ClassTarget | LevelTarget; //@TODO proper targets
