import State from './State.js';
import { html } from 'lit-html';

function basename(path) {
  return path.split('/').reverse()[0];
}

export default class AnnotateBase extends State {
  constructor(name, context) {
    super(name, context);
  }

  async enter() {
    // @note - this should belong to a Annotate parent class
    const { name, recording, folder } = this.context.participant.getValues();
    const now = new Date().toString();

    const testing = this.context.participant.get('testing');

    this.context.overviewLogger.write(`[${now}] - ${name} - recording: ${recording} (test: ${testing})`);
    this.context.metasLogger.write(`[${now}] - recording: ${recording} (test: ${testing})`);

    let filename = testing ?
      `${folder}/${name}_${basename(recording)}-test.txt` :
      `${folder}/${name}_${basename(recording)}.txt`;

    this.context.annotationLogger = await this.context.logger.create(filename, {
      bufferSize: 200,
    });

    this.context.$mediaPlayer.src = recording;
    this.context.$mediaPlayer.pause();

    this.context.$mediaPlayer.addEventListener('ended', () => {
      this.context.participant.set({ state: 'choose-file' });
    });

    setTimeout(() => {
      this.context.$mediaPlayer.play();
    }, 500);
  }

  async exit() {
    this.context.annotationLogger.close();
    this.context.annotationLogger = null;

    this.context.$mediaPlayer.pause();
    this.context.$mediaPlayer.src = window.SILENCE;

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

  render(childView) {
    return window.DEBUG ?
      html`
        <div style="
          position: absolute;
          bottom: 20px;
          left: 20px;
          background-color: #363636;
          padding: 20px;
          width: 250px;
        ">
          <button
            style="width: 120px;"
            @click="${e => this.context.participant.set({ state: 'choose-file' }) }">
            back
          </button>
          <pre><code>
${JSON.stringify(this.position, null, 2)}
          </code></pre>
        </div>
        ${childView}
        ` :
      childView;
  }
}
