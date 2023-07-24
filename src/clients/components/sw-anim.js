import { LitElement, html, css } from 'lit';

import getTransform from './rot.js';
import '@ircam/sc-components/sc-transport.js';
import '@ircam/sc-components/sc-button.js';

class SwAnim extends LitElement {
  static properties = {
    controller: {
      type: 'any',
      default: null,
    },
    project: {
      type: 'any',
      default: null,
    },
    filesystemMedias: {
      type: 'any',
      default: null,
    },
    filesystemMeasures: {
      type: 'any',
      default: null,
    },
  }

  static styles = css`
    :host {
      position: relative;
      display: inline-block;
      width: 100%;
      height: 600px;
      clear: both;
      margin-bottom: 100px;
    }

    sc-select {
      margin-bottom: 20px;
    }

    sc-transport {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 10;
    }

    .participant-field {
      display: flex;
      align-items: center;
      height: 30px;
    }

    .participant-checkbox {
      margin-right: 10px;
    }
    
    .participant-color {
      margin-left: 10px;
      width: 40px;
      height: 25px;
      background-color: #232323;
      border: 1px solid #343434;
      border-radius: 2px;
      color: white;
      padding: 2px 6px;
    }

    .animation-canvas {
      position: absolute;
      top: 50px;
      left: 100px;
    }

    #anim-menu {
      width: 20%;
      float: left;
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
    }

    #animation-container {
      position: relative;
      width: 75%;
      float: right;
    }

    #animation-canvas-tags {
      position: absolute;
      top: 0px;
      left: 0;
    }

    #animation-canvas-bg {
      position: absolute;
      top: 50px;
      left: 100px;
    }

    


  `;

  get controller() {
    return this._controller;
  }

  set controller(value) {
    this._controller = value;

    this._controller.onUpdate(updates => {
      if ('parsedAnimData' in updates) {
        this.animData = updates.parsedAnimData;
        Object.entries(this.animData).forEach(([key, value]) => {
          const projTags = this.project.get('tags');
          const taskTags = projTags[this.selectedTask - 1];
          const refOrder = taskTags[0];
          const order = value.tagsOrder;
          const transform = getTransform(this.animAnnotationType, order, refOrder);
          value.transform = transform;
        });
      }
    });
  }

  constructor() {
    super();

    this.selectedTask = null;
    this.$mediaPlayer = new Audio();
    this.animationBg = {
      square: "./images/square-bg.png",
      triangle: "./images/triangle-bg.png",
    }
    this.animationWidth = 500;
    this.animationHeight = 500;
 
    this._controller = null;
    this.project = null;
    this.filesystemMedias = null;
    this.filesystemMeasures = null;
  }

   scaleCanvas(u) {
    const [x,y] = u;
    return [(1+x)*this.animationWidth/2, (1-y)*this.animationHeight/2];
  }


  setupAnim() {
    const $animCanvas = this.shadowRoot.querySelectorAll(".animation-canvas");
    for (const $cv of $animCanvas) {
      $cv.getContext("2d").clearRect(0, 0, this.animationWidth, this.animationHeight);
    }

    this.animSelectedParticipants = [];
    const participantCheckboxes = this.shadowRoot.querySelectorAll(".participant-checkbox");
    for (const box of participantCheckboxes) {
      if (box.checked) {
        this.animSelectedParticipants.push(box.value);
      }
    }

    for (const name of this.animSelectedParticipants) {
      this.animDrawMeasure(name);
    }
  }

  changeTask(task) {
    // this.animData = null;

    const $animCanvasTagsCtx = this.shadowRoot.querySelector("#animation-canvas-tags").getContext("2d");
    $animCanvasTagsCtx.clearRect(0, 0, this.animationWidth + 200, this.animationHeight + 100);
    const $animCanvasBgCtx = this.shadowRoot.querySelector("#animation-canvas-bg").getContext("2d");
    $animCanvasBgCtx.clearRect(0, 0, this.animationWidth, this.animationHeight);
    const $animCanvas = this.shadowRoot.querySelectorAll(".animation-canvas");
    for (const $cv of $animCanvas) {
      $cv.getContext("2d").clearRect(0, 0, this.animationWidth, this.animationHeight);
    }

    // change background image
    this.animAnnotationType = this.project.get('annotationType')[task - 1];
    const animBgUrl = this.animationBg[this.animAnnotationType];
    if (animBgUrl) {
      const img = new Image();   // Create new img element
      img.onload = () => {
        $animCanvasBgCtx.drawImage(img, 0, 0, this.animationWidth, this.animationHeight);
      };
      img.src = animBgUrl; // Set source path
    }
    // draw tags
    let tags = this.project.get('tags')[task - 1][0];
    $animCanvasTagsCtx.font = '16px sans-serif';
    $animCanvasTagsCtx.fillStyle = "white";
    const maxWidthTag = 200;
    switch (this.animAnnotationType) {
      case 'slider': {
        const widthTagLeft = $animCanvasTagsCtx.measureText(tags[0]).width;
        $animCanvasTagsCtx.fillText(tags[0], Math.max(0, 90 - widthTagLeft), 60, 90); // canvas tags 200px larger
        $animCanvasTagsCtx.fillText(tags[1], this.animationWidth + 110, 60, 90); // canvas tags 200px larger
      }
        break;
      case 'triangle': {
        const [xRight, yRight] = this.scaleCanvas([0.9, -0.6]);
        const [xLeft, yLeft] = this.scaleCanvas([-0.9, -0.6]);
        const widthTagTop = Math.min($animCanvasTagsCtx.measureText(tags[0]).width, maxWidthTag);
        const widthTagRight = Math.min($animCanvasTagsCtx.measureText(tags[1]).width, maxWidthTag);
        const widthTagLeft = Math.min($animCanvasTagsCtx.measureText(tags[2]).width, maxWidthTag);
        $animCanvasTagsCtx.fillText(tags[0], (this.animationWidth - widthTagTop)/2 + 100, 40, maxWidthTag);
        $animCanvasTagsCtx.fillText(tags[1], xRight - widthTagRight + 100, yRight + 50, maxWidthTag);
        $animCanvasTagsCtx.fillText(tags[2], xLeft + 100, yLeft + 50, maxWidthTag);
        break;
      }
      case 'square': {
        // const [xTop, yTop] = this.scaleCanvas([0.13, 1]);
        const [xRight, yRight] = this.scaleCanvas([1, -0.2]);
        const [xBottom, yBottom] = this.scaleCanvas([0.17, -1]);
        const [xLeft, yLeft] = this.scaleCanvas([-1, -0.2]);
        const widthTagTop = Math.min($animCanvasTagsCtx.measureText(tags[0]).width, maxWidthTag);
        // const widthTagRight = Math.min($animCanvasTagsCtx.measureText(tags[1]).width, 100);
        const widthTagBottom = Math.min($animCanvasTagsCtx.measureText(tags[2]).width, maxWidthTag);
        const widthTagLeft = Math.min($animCanvasTagsCtx.measureText(tags[3]).width, 100);
        $animCanvasTagsCtx.fillText(tags[0], (this.animationWidth - widthTagTop)/2 + 100, 40, maxWidthTag);
        $animCanvasTagsCtx.fillText(tags[1], xRight + 100, yRight, 100);
        $animCanvasTagsCtx.fillText(tags[2], (this.animationWidth - widthTagBottom)/2 + 100, yBottom + 60, 200);
        $animCanvasTagsCtx.fillText(tags[3], xLeft - widthTagLeft + 100, yLeft, 100);
        break;
      }
    }
  }

  changeFile(task, file) {
    const medias = this.filesystemMedias.getTree();
    const projectMediaFolder = this.project.get('mediaFolder');
    const taskMediaFolder = projectMediaFolder[task - 1];
    const taskFiles = medias.children.find(e => e.name === taskMediaFolder).children;
    const recordingFile = taskFiles.find(e => e.name === file);
    this.$mediaPlayer.src = recordingFile.url;
    // fetch data
    const animData = {};
    const measures = this.filesystemMeasures.getTree();
    const measureFolders = measures.children.filter(e => e.type === 'directory');
    for (const measureFolder of measureFolders) {
      const $colorPicker = this.shadowRoot.querySelector(`#anim-color-${measureFolder.name}`);
      animData[measureFolder.name] = {
        drawIndex: 0,
        timer: null,
        path: {},
        color: $colorPicker.value
      };
      const taskDir = measureFolder.children.find(e => e.name === `task${task}`);
      if (taskDir) {
        const metasFile = taskDir.children.find(e => e.name.includes('task-metas'));
        const measuresFile = taskDir.children.find(e => e.name.includes(file));
        animData[measureFolder.name].path = {
          metas: metasFile.path,
          measures: measuresFile.path,
        };
      }
    }
    this.controller.set({ getAnimationRequest: animData });
  }

  animDrawMeasure(name) {
    const $animCanvasCtx = this.shadowRoot.querySelector(`#animation-canvas-${name}`).getContext("2d");
    $animCanvasCtx.clearRect(0, 0, this.animationWidth, this.animationHeight);
    $animCanvasCtx.font = '16px sans-serif';
    const participantData = this.animData[name];
    const drawIndex = participantData.drawIndex;
    const transform = participantData.transform;
    const point = participantData.data[drawIndex];
    if (this.animAnnotationType === 'slider') {
      const pointTrans = transform([point.position.x]);
      const idxParticipant = this.animSelectedParticipants.indexOf(name);
      $animCanvasCtx.fillStyle = 'white';
      $animCanvasCtx.fillText(name.split('-')[2], 20, 20 + 100 * idxParticipant);
      $animCanvasCtx.fillStyle = participantData.color ? participantData.color : 'white';
      $animCanvasCtx.strokeStyle = 'white';
      $animCanvasCtx.beginPath();
      $animCanvasCtx.rect(20, 40 + 100 * idxParticipant, this.animationWidth - 20, 50);
      $animCanvasCtx.stroke();
      $animCanvasCtx.beginPath();
      $animCanvasCtx.rect(20, 40 + 100 * idxParticipant, (this.animationWidth - 40) * pointTrans[0], 50);
      $animCanvasCtx.fill();
    } else {
      const pointTrans = transform([point.position.x, point.position.y]);
      $animCanvasCtx.fillStyle = participantData.color ? participantData.color : 'white';
      $animCanvasCtx.strokeStyle = 'black';
      $animCanvasCtx.beginPath();
      $animCanvasCtx.arc(this.animationWidth / 2 * (1 + pointTrans[0]), this.animationHeight / 2 * (1 - pointTrans[1]), 7, 0, 2 * Math.PI);
      $animCanvasCtx.stroke();
      $animCanvasCtx.beginPath();
      $animCanvasCtx.arc(this.animationWidth / 2 * (1 + pointTrans[0]), this.animationHeight / 2 * (1 - pointTrans[1]), 7, 0, 2 * Math.PI);
      $animCanvasCtx.fill();
    }
    this.animData[name].drawIndex++;
    if (drawIndex < participantData.numPoints - 1) {
      const currTime = point.time;
      const nextTime = this.animData[name].data[drawIndex + 1].time;

      this.animData[name].timer = setTimeout(() => {
        this.animDrawMeasure(name);
      }, (nextTime - currTime) * 1000);
    }
  }

  transport(state) {
    switch (state) {
      case 'play':
        if (this.animData) {
          this.setupAnim();
          this.$mediaPlayer.play();
        }
        break;
      case 'pause':
        for (const el of Object.values(this.animData)) {
          clearTimeout(el.timer);
        }
        this.$mediaPlayer.pause();
        break;
      case 'stop':
        for (const el of Object.values(this.animData)) {
          clearTimeout(el.timer);
          el.drawIndex = 0;
        }
        this.$mediaPlayer.pause();
        this.$mediaPlayer.currentTime = 0;
        break;
    }

  }

  requestUpdate() {
    super.requestUpdate();
  }

  render() {
    const project = this.project.getValues();
    const medias = this.filesystemMedias.getTree();
    const measures = this.filesystemMeasures.getTree();
    
    const taskOptions = {};
    for (let t = 1; t <= this.project.get('numTasks'); t++) {
      taskOptions[`task ${t}`] = `${t}`;
    }

    let taskFiles;
    let fileOptions = []; 
    if (this.selectedTask !== null && this.selectedTask !== undefined) {
      const taskMediaFolderName = project.mediaFolder[this.selectedTask - 1];
      taskFiles = medias.children.find(e => e.name == taskMediaFolderName);
      taskFiles = taskFiles.children;
      fileOptions = taskFiles.map(e => e.name);
    }

    const measuresFolders = measures.children.filter(e => e.type === 'directory');

    return html`
      <div id="anim-menu">
        <sc-select
          placeholder="select task"
          options="${JSON.stringify(taskOptions)}"
          @change=${e => { 
            if (e.detail.value) {
              this.selectedTask = e.detail.value;
              const $fileSelect = this.shadowRoot.querySelector("#file-select");
              $fileSelect.value = '';
              this.changeTask(this.selectedTask);
              this.requestUpdate();
            }
          }}
        ></sc-select>
        <sc-select
          id="file-select"
          placeholder="select file"
          options="${JSON.stringify(fileOptions)}"
          @change=${e => {
            if (e.detail.value) {
              this.selectedFile = e.detail.value;
              this.changeFile(this.selectedTask, this.selectedFile);
            }
          }}
        ></sc-select>
        <!-- participant selector -->
        <fieldset>
          <legend>Participant</legend>
          ${measuresFolders.map(folder => {
            return html`
              <div class="participant-field">
                <input
                  class="participant-checkbox"
                  type="checkbox"
                  value="${folder.name}"
                />
                <label for="${folder.name}">
                  ${folder.name.split('-')[2]}
                </label>
                <input 
                  class="participant-color"
                  id="anim-color-${folder.name}"
                  type="color" 
                  name="color" 
                  value="#ffffff" 
                  @input="${e => {
                    if (this.animData) {
                      this.animData[folder.name].color = e.target.value;
                    }
                  }}"
                />
              </div>
            ` 
          })}
        </fieldset>
      </div>

      <div id="animation-container">
        <sc-transport
          @change=${e => this.transport(e.detail.value)}
        ></sc-transport>

        <canvas
          id="animation-canvas-tags"
          width="700" 
          height="600"
        >
        </canvas>
        <canvas
          id="animation-canvas-bg"
          width="500" 
          height="500"
        >
        </canvas>
        ${measuresFolders.map(e => {
          return html`
            <canvas
              class="animation-canvas"
              id="animation-canvas-${e.name}"
              width="500"
              height="500"
            >
            </canvas>
          `
        })}
      </div>
    `
  }
}

customElements.define('sw-anim', SwAnim);