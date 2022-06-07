import State from './State.js';
import { html } from 'lit-html';
import '@ircam/simple-components/sc-number.js';

export default class AudioPlayer extends State {
  constructor(name, context) {
    super(name, context);

    this.fileDuration = 0.0;
    this.startTime = 0.0;
    this.endTime = 0.0;
    this.currentTime = 0.0;

    this.wvWidth = Math.round(0.9*window.innerWidth);
    this.wvHeight = 150;
  }

  enter() {
    const { name, recording, folder, completedTasks } = this.context.participant.getValues();
    const now = new Date().toString();

    this.context.client.socket.send('sendFilename', recording, this.wvWidth, this.wvHeight);
    this.context.client.socket.addListener('fileLoaded', (...message) => {
      this.fileDuration = message[1];
      this.endTime = this.fileDuration;
      this.setPlayerLimits(0, this.fileDuration);
      this.context.render();
    });

    
    this.$wvSvg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.$wvSvg.setAttributeNS(null, 'fill', 'none');
    this.$wvSvg.setAttributeNS(null, 'shape-rendering', 'crispEdges');
    this.$wvSvg.setAttributeNS(null, 'stroke', 'blue');
    this.$wvSvg.style.opacity = 1;

    this.$cursor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.$cursor.setAttributeNS(null, 'fill', 'none');
    this.$cursor.setAttributeNS(null, 'shape-rendering', 'crispEdges');
    this.$cursor.setAttributeNS(null, 'stroke', 'black');
    this.$cursor.style.opacity = 1;

    function animCursor() {
      const d = `M ${this.currentTime}, 0 L ${this.currentTime}, ${this.wvHeight}`;
      this.$cursor.setAttributeNS(null, 'd', d);
      window.requestAnimationFrame(animCursor.call(this));
    }
    window.requestAnimationFrame(animCursor.call(this));
  
    
    console.log(document.body.querySelector("#audioPlayer"));
    // console.log($wvContainer);
    // $wvContainer.addEventListener('click', (e) => {console.log(e);});

    function test(value) {console.log(35, this.startTime)};
    test.call(this);

    this.context.overviewLogger.write(`[${now}] - ${name} - task: ${completedTasks+1} - recording: ${recording}`);
    this.context.metasLogger.write(`[${now}] - task: ${completedTasks+1} - recording: ${recording}`);

    this.context.render();
  }
  

  async exit() {
    const testing = this.context.participant.get('testing');

    if (testing) {
      await this.context.participant.set({
        testing: false,
        testDone: true,
      });
    } else {
      const {
        annotatedRecordings,
        recording
      } = this.context.participant.getValues();

      annotatedRecordings.push(recording);

      await this.context.participant.set({ annotatedRecordings });
   }
  }

  cursorAnim() {
    const d = `M ${this.currentTime}, 0 L ${this.currentTime}, ${this.wvHeight}`
    this.$cursor.setAttributeNS(null, 'd', d);
    window.requestAnimationFrame(this.cursorAnim)
  }

  setPlayerLimits(startTime, endTime){
    this.startTime = startTime;
    this.endTime = endTime;

    this.context.client.socket.send('requestWaveform', startTime, endTime);

    this.context.client.socket.addListener('sendWaveformLimits', (waveformLimits) => {
      let instructions = waveformLimits.map((datum, index) => {
        const x  = index;
        let y1 = Math.round(datum[0]);
        let y2 = Math.round(datum[1]);
        // return `${x},${ZERO}L${x},${y1}L${x},${y2}L${x},${ZERO}`;
        return `${x},${y1}L${x},${y2}`;
      });

      const d = 'M' + instructions.join('L');
      // const d = 'M 0,0 L 100,100';
      this.$wvSvg.setAttributeNS(null, 'd', d);
    });
  }

  renderNumbers(){
    return html`
      
    `
  }

  render() {
    const { recording, tagsOrder, completedTasks } = this.context.participant.getValues();

    const testing = this.context.participant.get('testing');
    let title = `${this.texts.title} "${recording}"`;

    if (testing) {
      title = `[test] ${title}`;
    }

    return html`
      <p>${title}"</p>
      <p>${this.context.project.get('instruction')[completedTasks]}</p>

      <div 
        style="
        position: relative;
          width: 100%;
        " 
      >
        <audio
          style="
            position: absolute;
            display: block;
            margin: auto; 
            width: 100%;
          "
          id="audioPlayer"
          controls
          src=${this.context.participant.get('recording')}
        ></audio>
      </div>

      <svg 
        id="waveformContainer"
        width=${this.wvWidth}
        height=${this.wvHeight}
        style="
          position: relative;
          top: 70px;
          background-color: white
        "
        @click=${e => console.log(e)}
      >
        ${this.$wvSvg}
      </svg>

      <div
        style="
          position: relative;
          top: 150px;
        "
      >
        <sc-number
          style="
            position: absolute;
            left: 10px;
          "
          min=0
          max=${this.fileDuration}
          value=0
          @change=${e => this.setPlayerLimits(e.detail.value, this.endTime)};
        ></sc-number>
        <sc-number
          style="
              position: absolute;
              left: 200px;
          "
          min=0
          max=${this.fileDuration}
          value=0
          @change=${e => this.setPlayerLimits(this.startTime, e.detail.value)};
        ></sc-number>
      </div>

      <button
        style="
          position: relative;
          top: 200px;
        "
        @click="${e => this.context.participant.set({state: 'choose-file'})}"
      >${this.texts.btn}</button>
    `
  }
}