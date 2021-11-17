import State from './State.js';
import { html } from 'lit-html';
import '@ircam/simple-components/sc-number.js';

export default class AudioPlayer extends State {
  constructor(name, context) {
    super(name, context);

    this.fileDuration = 0.0;
    this.startTime = 0.0;
    this.endTime = 0.0;
  }

  enter() {
    const { name, recording, folder, currentTaskIndex } = this.context.participant.getValues();
    const now = new Date().toString();

    // this.context.client.socket.send('sendFilename', recording);
    // this.context.client.socket.addListener('fileLoaded', (...message) => {
    //   this.fileDuration = message[1];
    //   this.endTime = this.fileDuration;
    //   this.context.render();
    //   this.setPlayerLimits(0, this.duration);
    // });

    this.context.overviewLogger.write(
        `[${now}] - ${name} - task: ${currentTaskIndex + 1} - recording: ${recording}`);
    this.context.metasLogger.write(
      `[${now}] - task: ${currentTaskIndex + 1} - recording: ${recording}`);
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

  // setPlayerLimits(startTime, endTime){
  //   this.context.client.socket.send('requestWaveform', startTime, endTime);

  //   this.context.client.socket.addListener('sendWaveformLimits', (waveformLimits) => {
  //     console.log(waveformLimits);
  //   });
  // }

  // renderNumbers(){
  //   return html`
  //     <div
  //       style="
  //         position: relative;
  //         top: 70px;
  //       "
  //     >
  //       <p>${this.fileDuration}</p>
  //       <sc-number
  //         style="
  //           position: absolute;
  //           left: 10px;
  //         "
  //         min=0
  //         value=0
  //         @change=${e => this.setPlayerLimits(e.detail.value, this.endTime)};
  //       ></sc-number>
  //       <sc-number
  //         style="
  //             position: absolute;
  //             left: 200px;
  //         "
  //         min=0
  //         value=0
  //         @change=${e => this.setPlayerLimits(this.startTime, e.detail.value)};
  //       ></sc-number>
  //     </div>
  //   `
  // }

  render() {
    const { recording, tagsOrder, currentTaskIndex } = this.context.participant.getValues();

    const testing = this.context.participant.get('testing');
    let title = `${this.texts.title} "${recording}"`;

    if (testing) {
      title = `[test] ${title}`;
    }

    console.log(this.fileDuration); 

    return html`
      <p>${title}"</p>
      <p>${this.context.project.get('instruction')[currentTaskIndex]}</p>

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
          controls
          src=${this.context.participant.get('recording')}
        ></audio>
      </div>

      <button
        style="
          position: relative;
          top: 100px;
        "
        @click="${e => this.context.participant.set({state: 'choose-file'})}"
      >${this.texts.btn}</button>
    `
  }
}
