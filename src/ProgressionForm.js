class ProgressionForm {
  constructor(levelId) {
    this.levelId = levelId;
    //this.classId = classId;
    //this.levelId = 0;
    /**
     * @TODO: convert ts + d-n-d item-id'
     */
  }
  createLevel = () => {
    if (levelId < 20) {
      let boxProgression = document.querySelector(".boxProgression");
      let boxNewLevel = document.createElement("div");
      boxNewLevel.className = "boxNewLevel";
      boxNewLevel.innerHTML = `<div class="boxNewLevelControl">
                <div class="levelValue">lvl ${++levelId}</div>
                <button class="btn btn-small boxControlRegular" onclick="GmProgressionForm.createBoxRegular(${levelId})">+</button>
                <button class="btn btn-small boxControlOptional" onclick="GmProgressionForm.createBoxOptional(${levelId})">?</button>
                <button class="btn btn-small boxControlPrerequisite" onclick="GmProgressionForm.createBoxPrerequisite(${levelId})">!</button>
                </div>
                <div class="boxNewLevelContainer" id="${levelId}">
                </div>`;
      boxProgression.appendChild(boxNewLevel);
      console.log("last created levelId = " + levelId);
      console.log(this);
    } else {
      return console.error("Level capped at 20");
    }
  };

  createBoxRegular = (val) => {
    if (!!document.getElementById("boxRegular_" + val + "_")) {
      return null;
    } else {
      let boxRegular = document.createElement("div");
      boxRegular.className = "box boxRegular";
      boxRegular.id = "boxRegular_" + val + "_";
      boxRegular.innerHTML = `+Regular`;
      document.getElementById(val).appendChild(boxRegular);
      console.log("created regular at lvl " + val);
    }
  };

  createBoxOptional = (val) => {
    if (
      !!document.getElementById("boxOptionalContainer_" + val + "_" + tempO)
    ) {
      return tempO++;
    } else {
      let i = 0;
      let boxOptional = document.createElement("div");
      boxOptional.className = "box boxOptionalContainer";
      boxOptional.id = "boxOptionalContainer_" + val + "_" + tempO;
      boxOptional.innerHTML = `?Optional
                <div class="box optionContainer">
                <div class="smallBox boxOptional" id="boxOptional_${val}_${++i}"></div>
                <div class="smallBox boxOptional" id="boxOptional_${val}_${++i}"></div>
                </div>`;
      document.getElementById(val).appendChild(boxOptional);
      console.log("created optional at lvl " + val);
      tempO = 0;
    }
  };

  createBoxPrerequisite = (val) => {
    if (
      !!document.getElementById("boxPrerequisiteContainer_" + val + "_" + tempP)
    ) {
      return tempP++;
    } else {
      let i = 0;
      let boxPrerequisite = document.createElement("div");
      boxPrerequisite.className = "box boxPrerequisiteContainer";
      boxPrerequisite.id = "boxPrerequisiteContainer_" + val + "_" + tempP;
      boxPrerequisite.innerHTML = `!Prerequisite
                <div class="box PrerequisiteContainer">
                <div class="smallBox boxPrerequisite" id="boxPrerequisite">
                    <div class="Prerequisite" id="Prerequisite_${val}_${++i}"></div>
                    <div class="Award" id="Award_${val}_${++i}"></div>
                </div>
                </div>`;
      document.getElementById(val).appendChild(boxPrerequisite);
      console.log("created prerequisite at lvl " + val);
      tempP = 0;
    }
  };
  boxOptionalAddoption = (val) => {};
}

//let GmProgressionForm = new ProgressionForm(0);
let levelId = 0,
  tempO = 0,
  tempP = 0;
const fireForm = (v) => {
  console.log(new ProgressionForm(v));
  return (GmProgressionForm = new ProgressionForm(v));
};
const _GetSomeHelp = () => {
  alert("FAQ might be here");
};
