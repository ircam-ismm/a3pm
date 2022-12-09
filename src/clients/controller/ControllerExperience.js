import { AbstractExperience } from '@soundworks/core/client';
import { render, html, nothing } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
// import '@ircam/simple-components/sc-button.js';
import '@ircam/simple-components/sc-bang.js';
import '@ircam/simple-components/sc-transport.js';
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

    this.animSelectedTask = 1;
    this.animAnnotationType = null;
    this.animSelectedFile = null;
    this.animationSelectedFilePath = null;
    this.animationWidth = 500;
    this.animationHeight = 500;
    this.animationBg = {
      square: "./images/square-bg.png",
      triangle: "./images/triangle-bg.png",
    }
    this.$mediaPlayer = new Audio();

    this.graphCounter = 0;
    this.graphInfos = {};

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

    this.rotSym = {
      slider: {
        normal: 1,
        sym: -1 
      },
      triangle: {
        normal: [[1, 0],[0, 1]],
        rot120: [[-0.5, - Math.sqrt(3) / 2], [Math.sqrt(3)/2, -0.5]], 
        rot240: [[-0.5, Math.sqrt(3) / 2], [- Math.sqrt(3) / 2, -0.5]],
        symTop: [[1, 0], [0, -1]],
        rot120SymTop: [[-0.5, Math.sqrt(3) / 2], [Math.sqrt(3) / 2, 0.5]],
        rot240SymTop: [[-0.5, -Math.sqrt(3) / 2], [- Math.sqrt(3) / 2, 0.5]]
      } 
    } 


    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.globals = await this.client.stateManager.attach('globals');
    this.project = await this.client.stateManager.attach('project');

    console.log(this.project.getValues())

    this.client.socket.addListener('parsedData', e => {
      this.graphInfos[e.graphId].tagsOrder = e.tagsOrder;
      this.graphInfos[e.graphId].data = e.data;
      this.plotGraph(e.graphId);
    });

    this.client.socket.addListener('receiveDataAnim', e => {
      this.animData = e;
    });

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


    // this.animationTask = 'task1';
    // this.animationTaskType = this.project.

    // const measures = this.fileSystem.state.get('measures');
    // console.log(measures)

    window.addEventListener('resize', () => this.render());
    this.render();

    const $selectTaskAnimation = document.getElementById('select-task-animation');
    const $selectFileAnimation = document.getElementById('select-file-animation');
    this.animSelectedTask = $selectTaskAnimation.value;
    this.animSelectedFile = $selectFileAnimation.value;
    this.animChangeTask(this.animSelectedTask, this.animSelectedFile);
    $selectTaskAnimation.addEventListener('change', e => {
      if (e.target.value) {
        this.animSelectedTask = e.target.value;
        this.render();
        this.animSelectedFile = $selectFileAnimation.value;
        this.animChangeTask(this.animSelectedTask, this.animSelectedFile);
      }
    });
    $selectFileAnimation.addEventListener('change', e => {
      if (e.target.value) {
        this.animSelectedFile = e.target.value;
        this.animChangeTask(this.animSelectedTask, this.animSelectedFile);
      }
    })


    this.render();
  }

  addGraph() {
    this.$addButton = document.querySelector('#add-button');
    this.$addButton.remove();

    const $newGraph = document.querySelector('#empty-graph');
    $newGraph.style.backgroundColor = '#1d1d1d';
    $newGraph.id = `graph-${this.graphCounter}`;
    this.graphCounter++;

    // add selects
    const mediaFolders = this.project.get('mediaFolder');
    const measures = this.fileSystem.state.get('measures');
    const medias = this.fileSystem.state.get('medias');
    const $selBlock = document.createElement('div');
    const $selectTask = document.createElement('select');
    const $selectName = document.createElement("select");
    const $selectFile = document.createElement("select");

    for (let t = 1; t <= this.project.get('numTasks'); t++) {
      const $option = document.createElement('option');
      $option.value = `${t}`;
      $option.text = `task-${t}`;
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
    const selectedTaskNum = $selectTask.value;
    const taskMediaFolder = mediaFolders[selectedTaskNum-1];
    let mediaFilesTask;
    for (const folder of medias.children) {
      if (folder.name === taskMediaFolder) {
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
      const taskMediaFolder = mediaFolders[e.target.value - 1];
      let mediaFilesTask;
      for (const folder of medias.children) {
        if (folder.name === taskMediaFolder) {
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

    this.render();
  }

  selectGraph(folderIndex, taskNum, file, $graphDiv, $selBlock) {
    $selBlock.remove();
    //Open file
    const measures = this.fileSystem.state.get('measures');
    const selectedMeasure = measures.children[folderIndex];
    for (const taskFolder of selectedMeasure.children) {
      if (taskFolder.name === `task${taskNum}`) {
        let metasFile, measureFile;
        for (const folderFile of taskFolder.children) {
          if (folderFile.name.includes(file)) {
            measureFile = folderFile;
          }
          if (folderFile.name.includes('task-metas')) {
            metasFile = folderFile;
          }
        }
        const annotationType = this.project.get('annotationType')[taskNum-1];
        const graphId = $graphDiv.id;
        this.graphInfos[graphId] = {
          participant: selectedMeasure.name,
          task: taskNum,
          file: file,
          annotationType: annotationType,
          container: $graphDiv,
          colorType: 'solid',
        };
        const filesPath = {
          metas: metasFile.path,
          measures: measureFile.path,
        }
        this.client.socket.send('getGraph', {
          graphId,
          filesPath
        });
        
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

    // switch color mode
    const $colorModeButton = document.createElement('sc-button');
    $colorModeButton.setAttribute('text', 'color mode');
    $colorModeButton.setAttribute('width', '120');
    $colorModeButton.setAttribute('height', '20');
    $colorModeButton.style.position = 'absolute';
    $colorModeButton.style.top = '0';
    $colorModeButton.style.left = '0%';
    $colorModeButton.addEventListener('input', e => {
      Plotly.purge($graphDiv);
      const graphId = e.target.parentElement.id;
      const curColorMode = this.graphInfos[graphId].colorType;
      this.graphInfos[graphId].colorType = curColorMode === 'solid' ? 'transparent' : 'solid'; 
      this.plotGraph(graphId);
    });
    $graphDiv.appendChild($colorModeButton);

    this.render();
  }

  plotGraph(graphId) {
    const graphInfo = this.graphInfos[graphId];
    const annotationType = graphInfo.annotationType;
    const tagsOrder = graphInfo.tagsOrder;
    this.client.socket.removeListener('parsedData', this.plotGraph);
    const bars = [];
    for (let i = 0; i < graphInfo.data.length - 1; i++) {
      const line = graphInfo.data[i+1];
      const prevLine = graphInfo.data[i]
      const { zone, color } = this.getZoneColor(line.position.x, line.position.y, annotationType, graphInfo.colorType);
      const bar = {
        x: [line.time - prevLine.time],
        orientation: 'h',
        name: zone,
        marker: {
          color: color,
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
    Plotly.newPlot(graphInfo.container, bars, layout, {responsive: true});

  };

  getZoneColor(x, y, annotationType, colorType) {
    let zone, color;
    switch (annotationType) {
      case 'slider':
        if (x > 0.5) {
          zone = 'right'
        } else if (x < 0.5) {
          zone = 'left'
        } else {
          zone = 'center'
          color = this.zoneColors[annotationType][zone];
        }
        if (colorType === "solid") {
          color = this.zoneColors[annotationType][zone];
        } else {
          if (zone === 'right') {
            const alpha = 2*(x - 0.5) * 255;
            let alphaString = parseInt(alpha).toString(16);
            alphaString = alphaString.length === 1 ? `0${alphaString}` : alphaString;
            color = `${this.zoneColors[annotationType][zone]}${alphaString}`;
          } else if (zone === 'left') {
            const alpha = 2 * (0.5 - x) * 255;
            let alphaString = parseInt(alpha).toString(16);
            alphaString = alphaString.length === 1 ? `0${alphaString}` : alphaString;
            color = `${this.zoneColors[annotationType][zone]}${alphaString}`;
          }
        }
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
        color = this.zoneColors[annotationType][zone];
        // check if in another zone
        for (const pos of ['top', 'right', 'bottom', 'left']) {
          const distVertex = ((x - ellipses[pos]['xC']) ** 2 / ellipses[pos]['xRad'] ** 2) + ((y - ellipses[pos]['yC']) ** 2 / ellipses[pos]['yRad'] ** 2);
          if (distVertex < 1) {
            zone = pos;
            if (colorType === 'solid') {
              color = this.zoneColors[annotationType][zone];
            } else {
              const alpha = (1-distVertex) * 255;
              let alphaString = parseInt(alpha).toString(16);
              alphaString = alphaString.length === 1 ? `0${alphaString}` : alphaString;
              color = `${this.zoneColors[annotationType][zone]}${alphaString}`;
            }
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
        color = this.zoneColors[annotationType][zone];
        // check if in another zone
        for (const pos of ['top', 'left', 'right']) {
          const norm = Math.sqrt((x - vertices[pos].x) ** 2 + (y - vertices[pos].y) ** 2);
          if (norm < thresh) {
            zone = pos;
            if (colorType === 'solid') {
              color = this.zoneColors[annotationType][zone];
            } else {
              const alpha = (thresh - norm)/thresh * 255;
              let alphaString = parseInt(alpha).toString(16);
              alphaString = alphaString.length === 1 ? `0${alphaString}` : alphaString;
              color = `${this.zoneColors[annotationType][zone]}${alphaString}`;
            }
          }
        }
        break;
    }
    return {
      zone,
      color
    }
  }

  animChangeTask(task, file) {
    this.animData = null;

    const $animCanvasBgCtx = document.querySelector("#animationCanvasBg").getContext("2d");
    $animCanvasBgCtx.clearRect(0, 0, this.animationWidth, this.animationHeight);
    const $animCanvas = document.querySelectorAll(".animationCanvas");
    for (const $cv of $animCanvas) {
      $cv.getContext("2d").clearRect(0, 0, this.animationWidth, this.animationHeight);
    }
    

    // change background image
    this.animAnnotationType = this.project.get('annotationType')[task - 1];
    const animBgUrl = this.animationBg[this.animAnnotationType];
    const img = new Image();   // Create new img element
    img.onload = () => {
      $animCanvasBgCtx.drawImage(img, 0, 0, this.animationWidth, this.animationHeight);
    };
    img.src = animBgUrl; // Set source path
    // fetch sound file
    const medias = this.fileSystem.state.get('medias');
    const projectMediaFolder = this.project.get('mediaFolder');
    const taskMediaFolder = projectMediaFolder[task-1];
    const taskFiles = medias.children.find(el => el.name === taskMediaFolder);
    const recordingFile = taskFiles.children.find(el => el.name === file);
    this.animationSelectedFileUrl = recordingFile.url;
    this.$mediaPlayer.src = this.animationSelectedFileUrl;
    // fetch data
    const animData = {};
    const measures = this.fileSystem.state.get('measures');
    for (const measureDir of measures.children) {
      if (measureDir.type === 'directory') {
        for (const taskDir of measureDir.children) {
          if (taskDir.name === `task${task}`) {
            for (const measureFile of taskDir.children) {
              if (measureFile.name.includes(file)) {
                animData[measureDir.name] = { 
                  path: measureFile.path,
                  drawIndex: 0,
                  timer: null,
                };
              }
            }
          }
        }
      }
    }
    this.client.socket.send('getAnnotations', animData);

  }

  setupAnim() {
    const $animCanvas = document.querySelectorAll(".animationCanvas");
    for (const $cv of $animCanvas) {
      $cv.getContext("2d").clearRect(0, 0, this.animationWidth, this.animationHeight);
    }

    this.animSelectedParticipants = [];
    const participantCheckboxes = document.getElementsByName("anim-participant");
    for (const box of participantCheckboxes) {
      if (box.checked) {
        this.animSelectedParticipants.push(box.value);
      }
    }

    for (const name of this.animSelectedParticipants) {
      this.animDrawMeasure(name);
    }
  
  }

  animDrawMeasure(name) {
    const $animCanvasCtx = document.querySelector(`#animationCanvas-${name}`).getContext("2d");
    $animCanvasCtx.clearRect(0, 0, this.animationWidth, this.animationHeight);
    $animCanvasCtx.font = '16px sans-serif';

    const participantData = this.animData[name];
    const drawIndex = participantData.drawIndex;
    const point = participantData.data[drawIndex];
    if (this.animAnnotationType === 'slider') {
      const idxParticipant = this.animSelectedParticipants.indexOf(name);
      $animCanvasCtx.fillText(name.split('-')[2], 20, 20 + 100 * idxParticipant);
      $animCanvasCtx.beginPath();
      $animCanvasCtx.rect(20, 40 + 100 * idxParticipant, this.animationWidth - 20, 50);
      $animCanvasCtx.strokeStyle = 'white';
      $animCanvasCtx.stroke();
      $animCanvasCtx.beginPath();
      $animCanvasCtx.rect(20, 40 + 100 * idxParticipant, (this.animationWidth-40) * point.position.x, 50);
      $animCanvasCtx.fillStyle = 'white';
      $animCanvasCtx.fill();
    } else {
      $animCanvasCtx.beginPath();
      $animCanvasCtx.arc(this.animationWidth/2 * (1-point.position.x), this.animationHeight/2*(1-point.position.y), 7, 0, 2 * Math.PI);
      $animCanvasCtx.fillStyle = 'white';
      $animCanvasCtx.fill();
    }
    this.animData[name].drawIndex++;

    if (drawIndex < participantData.numPoints-1) {
      const currTime = point.time;
      const nextTime = this.animData[name].data[drawIndex + 1].time;


      this.animData[name].timer = setTimeout(() => {
        this.animDrawMeasure(name);
      }, (nextTime - currTime) * 1000);
    }
    
  }

  


  animationTransport(state) {
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
    


  render() {
    const medias = this.fileSystem.state.get('medias');
    const recordingsOverview = medias.children;
    const participants = Array.from(this.participants).map(p => p.getValues());
    const project = this.project.getValues();
    const measures = this.fileSystem.state.get('measures');
    const animMediaDir = project.mediaFolder[this.animSelectedTask-1];
    let animMediaFiles;
    for (const mediaDir of medias.children) {
      if (mediaDir.name === animMediaDir) {
        animMediaFiles = mediaDir.children;
      }
    }
    const measuresNames = [];
    for (const el of measures.children) {
      if (el.type === 'directory') {
        measuresNames.push(el.name);
      }
    }


    render(html`
      <header>
        <h1 style="margin: 0; padding: 20px; background-color: #232323;">
          ${this.config.app.name} - ${this.project.get('name')}
        </h1>
        <div style="position: absolute; top: 0; right: 10px; text-align: right;">
          <p style="font-size: 10px;">${this.globals.get('link')}</p>
          <img src="${this.globals.get('QRCode')}" />
        </div>
      </header>
      <div class="controller" style="padding: 20px;">

        <!-- project -->
        <div style="width: 49%; float:left;">
          <h2># project config</h2>
          ${Object.keys(project).map(key => {
            return html`
              <p>
                <span style="display: inline-block; width: 100px;">${key}:</span>
                ${Array.isArray(project[key]) ?
                  project[key].map(entry => html`
                    <p style="display: block; margin-left: 40px">${JSON.stringify(entry, null, 2)}</p>
                  `) :
                  html`${project[key]}`
                }
              </p>
            `;
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

        <div style="width: 50%; float:right;">
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

        

        <div
          style="
            width: 100%;
            height: ${this.animationHeight}px;
            clear: both;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid white;
          "
        >
          <h2># animation</h2>
          <div
            id="animation-container"
            style="
             position: relative;
             width: 100%;
             height: ${this.graphHeight}px;
             display: flex;
            "
            align="center"
          >
            <div style="width: 20%">
              <div style="
                  display: flex;
                  flex-direction: column;
                  flex-wrap: wrap;
                "
              >
                task:
                <select id="select-task-animation" style="margin-bottom: 20px; width: ">
                  ${Array(project.numTasks).fill(0).map((x, i) => {
                    return html`<option value="${i+1}">task${i+1}</option>`
                  })}
                </select> 
                file: 
                <select id="select-file-animation" style="margin-bottom: 20px;">
                  ${animMediaFiles.map((x, i) => {
                    return html`<option value="${x.name}">${x.name}</option>`
                  })}
                </select> 
              </div>

              <div>
                <fieldset id="anim-selected-participants">
                  <legend>Participants</legend>
                  ${measures.children.map(el => {
                    if (el.type === 'directory') {
                      return html`
                        <div style="display: flex; align-items: center">
                          <div style="margin-right: 10px;">
                            <input type="checkbox" name="anim-participant" value="${el.name}" />
                          </div>
                          <label for="${el.name}">${el.name.split('-')[2]}</label>
                        </div>
                      `
                    }
                  })}
                </fieldset>
              </div>
            </div>

            <div style="margin-left: 30px;">
              <sc-transport
                buttons="[play, pause, stop]"
                @change="${e => this.animationTransport(e.detail.value)}"
              >
              </sc-transport>


              <div style="position: relative">
                <canvas 
                  id="animationCanvasBg" 
                  width="${this.animationWidth}" 
                  height="${this.animationHeight}"
                  style="
                    position: absolute; 
                    left: 0; 
                    top: 0
                  "
                >
                </canvas>
                ${measuresNames.map(name => {
                  return html`
                    <canvas
                      class="animationCanvas"
                      id="animationCanvas-${name}"
                      width="${this.animationWidth}"
                      height="${this.animationHeight}"
                      style="
                        position: absolute; 
                        left: 0; 
                        top: 0
                      "
                    >
                    </canvas>
                  `
                })}
                
              </div>
            </div>

          </div>
          
        </div>


        <div id="graphs-container"
          style="
            width: 100%;
            clear: both;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid white;
          "
        >
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
              @input="${e => { this.addGraph() }}"
            ></sc-button
          </div>
          
        </div>

      </div>
    `, this.$container);
  }
}

export default ControllerExperience;
