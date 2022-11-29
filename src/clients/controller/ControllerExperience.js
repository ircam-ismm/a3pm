import { AbstractExperience } from '@soundworks/core/client';
import { render, html, nothing } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-button.js';
import '@ircam/simple-components/sc-bang.js';
import Plotly from 'plotly.js-dist';

/**
 * @todo: 
 * - better close button
 * - close button next to graph
 * - resize graph possible?
 * - change font color graphs
 */


class ControllerExperience extends AbstractExperience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;
    this.participants = new Set();

    this.fileSystem = this.require('file-system');

    this.graphHeight = 150;

    this.plotGraph = this.plotGraph.bind(this);

    this.zoneColors = {
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

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.project = await this.client.stateManager.attach('project');

    this.client.stateManager.observe(async (schemaName, stateId) => {
      if (schemaName === 'participant') {
        const participant = await this.client.stateManager.attach(schemaName, stateId);

        participant.onDetach(() => {
          this.participants.delete(participant);
          this.render();
        });

        let $packetFeedbackBang = null;

        participant.subscribe(updates => {
          if (!$packetFeedbackBang) {
            const id = `#packet-feedback-${participant.get('slug')}`;
            $packetFeedbackBang = document.querySelector(id);
          }

          if (updates.annotationPacketSent) {
            $packetFeedbackBang.active = true;
          }

          this.render();
        });

        this.participants.add(participant);
        this.render();
      }
    });

    this.fileSystem.state.subscribe(() => this.render());




    // const measures = this.fileSystem.state.get('measures');
    // console.log(measures)

    window.addEventListener('resize', () => this.renderApp());
    this.renderApp();
  }

  addGraph() {
    this.$addButton = document.querySelector('#add-button');
    this.$addButton.remove();

    const $newGraph = document.querySelector('#empty-graph');
    $newGraph.style.backgroundColor = '#1d1d1d';
    $newGraph.removeAttribute('id') 

    // add selects
    const measures = this.fileSystem.state.get('measures');
    const medias = this.fileSystem.state.get('medias');
    const $selBlock = document.createElement('div');
    const $selectTask = document.createElement('select');
    const $selectName = document.createElement("select");
    const $selectFile = document.createElement("select");
    for (let t = 1; t <= this.project.get('numTasks'); t++) {
      const $option = document.createElement('option');
      $option.value = `task${t}`;
      $option.text = `task${t}`;
      $selectTask.appendChild($option);
    }
    for (const el of measures.children) {
      if (el.type === 'directory') {
        const $option = document.createElement('option');
        $option.value = measures.children.indexOf(el);
        $option.text = el.name.split('-')[2];
        $selectName.appendChild($option);
      }
    }
    const selectedTask = $selectTask.value;
    let mediaFilesTask;
    for (const folder of medias.children) {
      if (folder.name === selectedTask) {
        mediaFilesTask = folder.children
      }
    }
    for (const file of mediaFilesTask) {
      const $option = document.createElement('option');
      $option.value = file.name;
      $option.text = file.name;
      $selectFile.appendChild($option);
    }

    $selectTask.style.display = 'block';
    $selectName.style.display = 'block';
    $selectFile.style.display = 'block'
    $selBlock.appendChild($selectName);
    $selBlock.appendChild($selectTask);
    $selBlock.appendChild($selectFile);

    // update medias when changing task
    $selectTask.addEventListener('change', (e) => {
      $selectFile.replaceChildren();
      let mediaFilesTask;
      for (const folder of medias.children) {
        if (folder.name === e.target.value) {
          mediaFilesTask = folder.children
        }
      }
      for (const file of mediaFilesTask) {
        const $option = document.createElement('option');
        $option.value = file.name;
        $option.text = file.name;
        $selectFile.appendChild($option);
      }
    })

    // add validate button
    const $validateButton = document.createElement('sc-button');
    $validateButton.style.display = 'block';
    $validateButton.setAttribute('text', 'plot');
    $validateButton.addEventListener('input', e => {
      const folderIndex = e.target.previousElementSibling.previousElementSibling.previousElementSibling.value;
      const taskNum = e.target.previousElementSibling.previousElementSibling.value;
      const fileName = e.target.previousElementSibling.value;
      this.selectGraph(folderIndex, taskNum, fileName, $newGraph, $selBlock);
    });

    $selBlock.appendChild($validateButton); 
    $selBlock.style.display = 'inline-block';
    $selBlock.style.marginTop = '30px';
    $newGraph.appendChild($selBlock);

    this.renderApp();
  }

  selectGraph(folderIndex, task, file, $graphDiv, $selBlock) {
    $selBlock.remove();
    //Open file
    const measures = this.fileSystem.state.get('measures');
    const selectedMeasure = measures.children[folderIndex];
    for (const taskFolder of selectedMeasure.children) {
      if (taskFolder.name === task) {
        let metasFile, measureFile;
        for (const folderFile of taskFolder.children) {
          if (folderFile.name.includes(file)) {
            measureFile = folderFile;
          }
          if (folderFile.name.includes('task-metas')) {
            metasFile = folderFile;
          }
        }
        const taskIdx = this.project.get('mediaFolder').indexOf(task)
        const annotationType = this.project.get('annotationType')[taskIdx];
        this.graphInfo = {
          participant: selectedMeasure.name,
          task: task,
          file: file,
          annotationType: annotationType,
          container: $graphDiv,
        };
        const filesPath = {
          metas: metasFile.path,
          measures: measureFile.path,
        }
        this.client.socket.send('filePath', filesPath);
        this.client.socket.addListener('parsedData', this.plotGraph);
      }
    }
    
    //Close button
    const $closeButton = document.createElement('sc-button');
    $closeButton.setAttribute('text', 'X');
    $closeButton.setAttribute('width', '20');
    $closeButton.setAttribute('height', '20');
    $closeButton.style.position = 'absolute';
    $closeButton.style.top = '0';
    $closeButton.style.right = '0%';
    $closeButton.addEventListener('input', e => e.target.parentElement.remove());
    $graphDiv.appendChild($closeButton);

    //New empty graph
    const $container = document.querySelector('#graphs-container');
    const $newEmptyGraph = document.createElement("div");
    $newEmptyGraph.style.position = 'relative';
    $newEmptyGraph.style.width = '90%';
    $newEmptyGraph.style.height = `${this.graphHeight}px`;
    $newEmptyGraph.style.marginTop = '5px';
    $newEmptyGraph.setAttribute("align", "center");
    $newEmptyGraph.setAttribute('id', 'empty-graph')
    $container.appendChild($newEmptyGraph);
    $newEmptyGraph.appendChild(this.$addButton);

    this.renderApp();
  }

  plotGraph(data) {
    const annotationType = this.graphInfo.annotationType;
    const tagsOrder = data.tagsOrder;
    console.log(tagsOrder);
    const measures = data.measures;
    this.client.socket.removeListener('parsedData', this.plotGraph);
    const bars = [];
    for (let i = 0; i < measures.length - 1; i++) {
      const line = measures[i+1];
      const prevLine = measures[i]
      const zone = this.getZone(line.position.x, line.position.y, annotationType);
      const bar = {
        x: [line.time - prevLine.time],
        orientation: 'h',
        name: zone,
        marker: {
          color: this.zoneColors[annotationType][zone],
          width: 1
        },
        showlegend: false,
        type: 'bar'
      }
      bars.push(bar);
    }

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
        text: this.graphInfo.participant+' '+this.graphInfo.task+' '+this.graphInfo.file,
        font: {
          size: 12,
        },
      },
      legend: {
        font: {
          color: '#FFFFFF',
        },
        bgcolor: "#232323"
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
    Plotly.newPlot(this.graphInfo.container, bars, layout);

  };

  getZone(x, y, annotationType) {
    switch (annotationType) {
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
        for (const pos of ['top', 'right', 'bottom', 'left']) {
        const  inEllipse = ((x - ellipses[pos]['xC']) ** 2 / ellipses[pos]['xRad'] ** 2) + ((y - ellipses[pos]['yC']) ** 2 / ellipses[pos]['yRad'] ** 2) < 1
          if (inEllipse) {
            return pos
          }
        }
        return 'center' 
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
        }
        const thresh = 0.75
        for (const pos of ['top', 'left', 'right']) {
          const norm = Math.sqrt((x - vertices[pos].x)**2 + (y - vertices[pos].y)**2);
          if (norm < thresh) {
            return pos;
          }
        }
        return 'center'
        break;
    }
  }
    


  renderApp() {
    const medias = this.fileSystem.state.get('medias');
    const recordingsOverview = medias.children;
    const participants = Array.from(this.participants).map(p => p.getValues());
    const project = this.project.getValues();

    render(html`
      <h1 style="margin: 0; padding: 20px; background-color: #232323;">
        ${this.config.app.name} - ${this.project.get('name')}
      </h1>
      <div class="controller" style="padding: 20px;">

        <!-- participants -->
        <div style="width: 50%; float:left;">
          <h2># project config</h2>
          ${Object.keys(project).map(key => {
            return html`<p>${key}: ${Array.isArray(project[key]) ?
              project[key].map(entry => html`
                <span style="display: block; margin-left: 40px">${JSON.stringify(entry)}</span>
              `) :
              html`${project[key]}`
              }</p>`
          })}

          <h2># media files</h2>
          ${recordingsOverview.map(folder => {
            return html`
              <p>- &emsp; ${folder.url}</p>
              ${folder.children.map(file => {
              return html`
                  <p>&emsp; &emsp; &emsp; &emsp;${file.name}</p>
                `
            })}
            `
          })}
        </div>

        <div style="width: 50%; float:left;">
          <h2># participants</h2>
          ${participants.map(participant => {
            return html`
              <div style="padding: 10px; margin: 0 20px 12px 0; background-color: #232323;">
              ${Object.keys(participant).map(key => {
              return html`
                  <p>
                    ${key}:
                    ${Array.isArray(participant[key]) ?
                  JSON.stringify(participant[key]) :
                  participant[key]
                }
                  </p>`
            })}
              </div>
            `;
          })}
        </div>

        <div id="graphs-container" style="width: 50%; float:top;">
          <h2># graphs</h2>
          <div 
            id="empty-graph"
            style="
             position: relative;
             width: 90%;
             height: ${this.graphHeight}px;
            "
            align="center"
          >
            <sc-button
              id="add-button"
              style="margin:0 auto;"
              text="add graph"
              @input="${e => {this.addGraph()}}"
            ></sc-button
          </div>
          
        </div>

      </div>
    `, this.$container);
  }
}

export default ControllerExperience;
