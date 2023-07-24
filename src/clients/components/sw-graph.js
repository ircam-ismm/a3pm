import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import Plotly from 'plotly.js-dist';

import "@ircam/sc-components/sc-button.js";
import '@ircam/sc-components/sc-select.js';


class SwGraph extends LitElement {
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

  // no shadow DOM
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();

    // this.graphHeight = '150px';
    this.selectNewGraph = false;
    this.selectedTaskNum = null;
    this.graphCounter = 0;
    this.graphs = {};
    this.graphInfos = null;
    this.zoneColors = {
      slider: {
        left: '#000ffe',
        right: '#fbea00',
        center: '#000000'
      },
      triangle: {
        top: '#000ffe',
        right: '#00ee00',
        left: '#fbea00',
        center: '#000000'
      },
      square: {
        top: '#d82404',
        right: '#cb7cf0',
        bottom: '#1188e5',
        left: '#6ff4f6',
        center: '#000000'
      },
    };

    this._controller = null;
    this.project = null;
    this.filesystemMeasures = null;
    this.filesystemMedias = null;
  }

  get controller() {
    return this._controller;
  }

  set controller(value) {
    this._controller = value;

    this._controller.onUpdate(updates => {
      if ('parsedGraphData' in updates) {
        const data = updates.parsedGraphData;
        this.graphs[data.graphIdx].tagsOrder = data.tagsOrder;
        this.graphs[data.graphIdx].data = data.parsedData;
        this.plotGraph(data.graphIdx);
      }
    });
  }

  requestNewGraph() {
    if (this.selectedTaskNum && this.selectedFile && this.selectedName) {
      const taskNum = this.selectedTaskNum;
      const fileName = this.selectedFile; 
      const folderIndex = this.selectedName;

      const measures = this.filesystemMeasures.getTree();
      const participantMeasures = measures.children[folderIndex];
      const taskFolder = participantMeasures.children.find(folders => folders.name === `task${taskNum}`);
      const measureFile = taskFolder.children.find(file => file.name.includes(fileName));
      const metasFile = taskFolder.children.find(file => file.name.includes('task-metas'));
      const annotationType = this.project.get('annotationType')[taskNum - 1];

      this.graphCounter++;
      this.graphs[this.graphCounter] = {
        participant: participantMeasures.name,
        task: taskNum,
        file: fileName,
        annotationType: annotationType,
        colorType: 'solid',
      };

      this.controller.set({
        getGraphRequest: {
          graphIdx: this.graphCounter,
          metasPath: metasFile.path,
          measuresPath: measureFile.path,
        }
      });

      this.selectNewGraph = false;
      this.requestUpdate();
    }
  }

  plotGraph(graphIdx) {
    const graphInfo = this.graphs[graphIdx];
    const annotationType = graphInfo.annotationType;
    const tagsOrder = graphInfo.tagsOrder;
    // this.client.socket.removeListener('parsedData', this.plotGraph);
    const bars = [];
    const colors = [];
    for (let i = 0; i < graphInfo.data.length - 1; i++) {
      const line = graphInfo.data[i + 1];
      const prevLine = graphInfo.data[i]
      const { zone, colorSolid, colorTransparent } = this.getZoneColor(line.position.x, line.position.y, annotationType, graphInfo.colorType);
      colors.push({colorSolid, colorTransparent});
      const bar = {
        x: [line.time - prevLine.time],
        orientation: 'h',
        name: zone,
        marker: {
          color: colorSolid,
          width: 1
        },
        showlegend: false,
        type: 'bar'
      }
      bars.push(bar);
    }

    this.graphs[graphIdx].colors = colors;

    // legend
    Object.keys(this.zoneColors[annotationType]).forEach((zone, i) => {
      const tag = zone === 'center' ? 'center' : tagsOrder[i];
      const bar = {
        x: [0],
        orientation: 'h',
        name: tag,
        marker: {
          color: this.zoneColors[annotationType][zone],
          width: 0
        },
        showlegend: true,
        type: 'bar'
      };
      bars.push(bar)
    });

    const layout = {
      title: {
        text: `${graphInfo.participant} - task${graphInfo.task} - ${graphInfo.file}`,
        font: {
          size: 12,
          color: '#FFFFFF'
        },
      },
      legend: {
        font: {
          color: '#FFFFFF',
        },
        bgcolor: "#1d1d1d"
      },
      barmode: 'stack',
      paper_bgcolor: '#000000',
      plot_bgcolor: '#000000',
      margin: {
        b: 30,
        l: 0,
        t: 21,
        r: 0,
        pad: 0,
      },
    };

    const config = {
      responsive: true,
      displayModeBar: true,
    }
    const $graphContainer = this.querySelector(`#sw-graph-${graphIdx}`);
    Plotly.react($graphContainer, bars, layout, config);

  };

  changeColorMode(graphIdx, colorMode) {
    const $graphContainer = this.querySelector(`#sw-graph-${graphIdx}`);
    const graphInfo = this.graphs[graphIdx];
    for (let i = 0; i < graphInfo.data.length - 1; i++) {
      // console.log(i, $graphContainer.data[i], graphInfo.colors[i])
      const bar = $graphContainer.data[i];
      const barColors = graphInfo.colors[i];
      bar.marker.color = colorMode === 'solid' ? barColors.colorSolid : barColors.colorTransparent;
    }

    const config = {
      responsive: true,
      displayModeBar: true,
    }
    Plotly.react($graphContainer, $graphContainer.data, $graphContainer.layout, config);
  }


  getZoneColor(x, y, annotationType, colorType) {
    let zone, colorSolid, colorTransparent;
    switch (annotationType) {
      case 'slider':
        if (x > 0.5) {
          zone = 'right'
        } else if (x < 0.5) {
          zone = 'left'
        } else {
          zone = 'center'
        }
        colorSolid = this.zoneColors[annotationType][zone];
        let alpha = 0;
        if (zone === 'right') {
          alpha = 2 * (x - 0.5) * 255;
        } else if (zone === 'left') {
          alpha = 2 * (0.5 - x) * 255;
        }
        let alphaString = parseInt(alpha).toString(16);
        alphaString = alphaString.length === 1 ? `0${alphaString}` : alphaString;
        colorTransparent = `${this.zoneColors[annotationType][zone]}${alphaString}`;
        break;
      case 'square':
        const size = 1020
        const ellipses = {
          'top': {
            'xRad': 422 / size,
            'yRad': 368 / size
          },
          'right': {
            'xRad': 366 / size,
            'yRad': 366 / size
          },
          'bottom': {
            'xRad': 422 / size,
            'yRad': 368 / size
          },
          'left': {
            'xRad': 391 / size,
            'yRad': 368 / size
          },
        }
        ellipses['top']['xC'] = 0
        ellipses['top']['yC'] = 1 - ellipses['top']['yRad']
        ellipses['right']['xC'] = 1 - ellipses['right']['xRad']
        ellipses['right']['yC'] = 0
        ellipses['bottom']['xC'] = 0
        ellipses['bottom']['yC'] = -1 + ellipses['bottom']['yRad']
        ellipses['left']['xC'] = -1 + ellipses['left']['xRad']
        ellipses['left']['yC'] = 0
        // default : center
        zone = 'center'
        colorSolid = this.zoneColors[annotationType][zone];
        colorTransparent = `${this.zoneColors[annotationType][zone]}00`;
        // check if in another zone
        for (const pos of ['top', 'right', 'bottom', 'left']) {
          const distVertex = ((x - ellipses[pos]['xC']) ** 2 / ellipses[pos]['xRad'] ** 2) + ((y - ellipses[pos]['yC']) ** 2 / ellipses[pos]['yRad'] ** 2);
          if (distVertex < 1) {
            zone = pos;
            colorSolid = this.zoneColors[annotationType][zone];
            const alpha = (1 - distVertex) * 255;
            let alphaString = parseInt(alpha).toString(16);
            alphaString = alphaString.length === 1 ? `0${alphaString}` : alphaString;
            colorTransparent = `${this.zoneColors[annotationType][zone]}${alphaString}`;
          }
        }
        break;
      case 'triangle':
        // Positions of each vertex(top, bottom right, bottom left)
        const vertices = {
          top: {
            x: 0,
            y: 1,
          },
          left: {
            x: -0.88,
            y: -0.47,
          },
          right: {
            x: 0.88,
            y: -0.47,
          }
        };
        const thresh = 0.75;
        // default : center
        zone = 'center'
        colorSolid = this.zoneColors[annotationType][zone];
        colorTransparent = `${this.zoneColors[annotationType][zone]}00`;
        // check if in another zone
        for (const pos of ['top', 'left', 'right']) {
          const norm = Math.sqrt((x - vertices[pos].x) ** 2 + (y - vertices[pos].y) ** 2);
          if (norm < thresh) {
            zone = pos;
            colorSolid = this.zoneColors[annotationType][zone];
            const alpha = (thresh - norm) / thresh * 255;
            let alphaString = parseInt(alpha).toString(16);
            alphaString = alphaString.length === 1 ? `0${alphaString}` : alphaString;
            colorTransparent = `${this.zoneColors[annotationType][zone]}${alphaString}`;
          }
        }
        break;
    }
    return {
      zone,
      colorSolid,
      colorTransparent
    }
  }

  requestUpdate() {
    super.requestUpdate();
  }

  render() {
    const mediaFolders = this.project.get('mediaFolder');
    const medias = this.filesystemMedias.getTree();
    const measures = this.filesystemMeasures.getTree();

    let nameOptions = {};
    let taskOptions = {};
    let fileOptions = {};

    if (this.selectNewGraph) {
      for (let t = 1; t <= this.project.get('numTasks'); t++) {
        taskOptions[`task ${t}`] = `${t}`;
      }

      for (const el of measures.children) {
        if (el.type === 'directory') {
          nameOptions[el.name.split('-')[2]] = measures.children.indexOf(el);
        }
      }
      
      if (this.selectedTaskNum !== null && this.selectedTaskNum !== undefined) {
        const taskMediaFolder = mediaFolders[this.selectedTaskNum - 1];
        const mediaFilesTask = medias.children.find(folder => folder.name === taskMediaFolder).children
        for (const file of mediaFilesTask) {
          fileOptions[file.name] = file.name;
        }
      }
    }

    const graphClasses = {
      'empty-graph': true,
      'select-new-graph': this.selectNewGraph,
    };

    return html`
      ${Object.entries(this.graphs).map(([graphIdx, graphInfo]) => {
        return html`
          <div 
            id="sw-graph-${graphIdx}"
            class="graph-container"  
          >
            <sc-button 
              class="close-button"
              @input=${e => {
                delete this.graphs[graphIdx];
                this.requestUpdate();
              }}
            >X</sc-button>
            <sc-button 
              class="color-mode"
              @input=${e => {
                const curColorMode = graphInfo.colorType;
                graphInfo.colorType = curColorMode === 'solid' ? 'transparent' : 'solid';
                // this.plotGraph(graphIdx);
                this.changeColorMode(graphIdx, graphInfo.colorType);
              }}
            >color mode</sc-button>
          </div>
        `
      })}
      <div 
        class="${classMap(graphClasses)}" 
      >
        ${
          this.selectNewGraph 
          ? html`
            <sc-select 
              id="select-name"
              placeholder="select participant"
              options="${JSON.stringify(nameOptions)}"
              @change=${e => this.selectedName = e.detail.value}
            ></sc-select>
            <sc-select
              id="select-task"
              placeholder="select task"
              options="${JSON.stringify(taskOptions)}"
              @change=${e => {
                this.selectedTaskNum = e.detail.value;
                this.requestUpdate();
              }}
            ></sc-select>
            <sc-select
              id="select-file"
              placeholder="select media file"
              options="${JSON.stringify(fileOptions)}"
              @change=${e => this.selectedFile = e.detail.value}
            ></sc-select>
            <sc-button
              @input=${this.requestNewGraph}
            >plot</sc-button>`
          : html`<sc-button 
              id="add-button"
              @input=${e => { 
                this.selectNewGraph = true;
                this.requestUpdate();
              }}
            >add graph</sc-button>` 
        }
        
      </div>
    `
  }
  
}

customElements.define('sw-graph', SwGraph);