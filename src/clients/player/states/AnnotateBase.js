import State from './State.js';
import { html } from 'lit';
import slugify from 'slugify';

function cleanBasename(path) {
  const basename = path.split('/').reverse()[0];
  return slugify(basename, { remove: /[*+~(),`'"!:@]/g });
}

export default class AnnotateBase extends State {
  constructor(name, context) {
    super(name, context);

    this._periodRecordTimeoutId = null;
  }

  async enter() {
    // @note - this should belong to a Annotate parent class
    const {
      name,
      recording,
      folder,
      currentTaskIndex,
    } = this.context.participant.getValues();

    const now = new Date().toString();
    const testing = this.context.participant.get('testing');

    this.context.overviewLogger.write(
      `[${now}] - ${name} - task: ${currentTaskIndex + 1} - recording: ${recording} (test: ${testing})`);
    this.context.metasLogger.write(
      `[${now}] - task: ${currentTaskIndex + 1} - recording: ${recording} (test: ${testing})`);

    const mediaFolder = this.context.project.get('mediaFolder')[currentTaskIndex];
    const filename = testing ?
      `${folder}/task${currentTaskIndex + 1}/${name}_${cleanBasename(recording)}-test.txt` :
      `${folder}/task${currentTaskIndex + 1}/${name}_${cleanBasename(recording)}.txt`;

    this.context.annotationLogger = await this.context.logger.create(filename, {
      bufferSize: 20 * 2, // send a buffer every two seconds
    });

    // feedback for controller
    this.context.annotationLogger.addEventListener('packetsend', () => {
      this.context.participant.set({ annotationPacketSent: true });
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
    // stop periodic record
    clearTimeout(this._periodRecordTimeoutId);

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

  // defaults to 50ms
  recordPeriodic(period = 0.05) {
    // - don't try to access logger when entering or exiting
    // - don't log if the media is paused
    if (this.status === 'entered' && !this.context.$mediaPlayer.paused) {
      // make a copy to be sure to record every move
      const position = Object.assign({}, this.position);
      const time = this.context.$mediaPlayer.currentTime;

      this.context.annotationLogger.write({ time, position });
    }

    this._periodRecordTimeoutId = setTimeout(() => this.recordPeriodic(period), period * 1000);
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
