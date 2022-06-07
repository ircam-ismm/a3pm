import { AbstractExperience } from '@soundworks/core/client';
import { render, html, nothing } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-button.js';


import '@ircam/simple-components/sc-bang.js';

class ControllerExperience extends AbstractExperience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;
    this.participants = new Set();

    this.fileSystem = this.require('file-system');

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

<<<<<<< HEAD

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
    for (let t = 1; t <= this.project.get('taskNumber'); t++) {
      const $option = document.createElement('option');
      $option.value = `task${t}`;
      $option.text = `task${t}`;
      $selectTask.appendChild($option);
    }
    for (const el of measures.children) {
      if (el.type === 'directory') {
        const $option = document.createElement('option');
        $option.value = measures.children.indexOf(el);
        $option.text = el.name;
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
    // $selBlock.style.marginTop = '10px';
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
        for (const measureFile of taskFolder.children) {
          if (measureFile.name.includes(file)) {
            console.log(this.project.getValues()); 
            const taskIdx = this.project.get('mediaFolder').indexOf(task) 
            const annotationType = this.project.get('annotationType')[taskIdx];
            this.client.socket.send('filePath', measureFile.path);
          }
        }
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
    $newEmptyGraph.style.height = '100px';
    $newEmptyGraph.style.marginTop = '5px';
    $newEmptyGraph.setAttribute("align", "center");
    $newEmptyGraph.setAttribute('id', 'empty-graph')
    $container.appendChild($newEmptyGraph);
    $newEmptyGraph.appendChild(this.$addButton);

    this.renderApp();
  }

  // plotFile(filePath, annotationType) {
  //   this.client.socket.send('filePath', filePath);
  // };


  renderApp() {
=======
    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
>>>>>>> 4f1fd27b686b6f7b2d43c36ffec3687c7696d08b
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
<<<<<<< HEAD
=======
          <h2># participants</h2>
          ${participants.map(participant => {
            return html`
              <div style="
                padding: 10px;
                margin: 0 20px 12px 0;
                background-color: #232323;
                position: relative;
              ">
                <sc-bang
                  style="position: absolute; top: 4px; right: 4px"
                  id="packet-feedback-${participant.slug}"
                ></sc-bang>

                ${Object.keys(participant).map(key => {
                  if (key === 'annotationPacketSent') {
                    return nothing;
                  }

                  return html`
                    <p>
                      ${key}:
                      ${Array.isArray(participant[key]) ?
                        html`<pre>${JSON.stringify(participant[key], null, 2)}</pre>` :
                        participant[key]
                      }
                    </p>`
                })}
              </div>
            `;
          })}
        </div>

        <!-- config -->
        <div style="width: 50%; float:left;">
>>>>>>> 4f1fd27b686b6f7b2d43c36ffec3687c7696d08b
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
             height: 100px;
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
