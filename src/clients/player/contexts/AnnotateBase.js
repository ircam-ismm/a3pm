import BaseContext from './BaseContext.js';
import { html } from 'lit';
import slugify from 'slugify';

function cleanBasename(path) {
  const basename = path.split('/').reverse()[0];
  return slugify(basename, { remove: /[*+~(),`'"!:@]/g });
}

export default class AnnotateBase extends BaseContext {
  constructor(name, refs) {
    super(name, refs);

    this._periodRecordTimeoutId = null;
  }

  async enter() {
    const {
      name,
      recording,
      folder,
      currentTaskIndex,
    } = this.refs.participant.getValues();

    const now = new Date().toString();
    const testing = this.refs.participant.get('testing');

    this.refs.overviewLogger.write(
      `[${now}] - ${name} - task: ${currentTaskIndex + 1} - recording: ${recording} (test: ${testing})`);
    this.refs.metasLogger.write(
      `[${now}] - task: ${currentTaskIndex + 1} - recording: ${recording} (test: ${testing})`);

    const mediaFolder = this.refs.project.get('mediaFolder')[currentTaskIndex];
    const filename = testing ?
      `${folder}/task${currentTaskIndex + 1}/${name}_${cleanBasename(recording)}-test.txt` :
      `${folder}/task${currentTaskIndex + 1}/${name}_${cleanBasename(recording)}.txt`;

    this.refs.annotationLogger = await this.refs.logger.createWriter(filename, {
      bufferSize: 20 * 2, // send a buffer every two seconds
    });

    // feedback for controller
    this.refs.annotationLogger.onPacketSend(() => {
      this.refs.participant.set({ annotationPacketSent: true });
    });

    this.refs.$mediaPlayer.src = recording;
    this.refs.$mediaPlayer.pause();

    this.refs.$mediaPlayer.addEventListener('ended', () => {
      this.refs.participant.set({ context: 'choose-file' });
    });

    setTimeout(() => {
      this.refs.$mediaPlayer.play();
    }, 500);

    super.enter();
  }

  async exit() {
    // stop periodic record
    clearTimeout(this._periodRecordTimeoutId);

    this.refs.annotationLogger.close();
    this.refs.annotationLogger = null;

    this.refs.$mediaPlayer.pause();
    this.refs.$mediaPlayer.src = window.SILENCE;

    const testing = this.refs.participant.get('testing');

    if (testing) {
      await this.refs.participant.set({
        testing: false,
        testDone: true,
      });
    } else {
      const {
        annotatedRecordings,
        recording
      } = this.refs.participant.getValues();

      annotatedRecordings.push(recording);

      await this.refs.participant.set({ annotatedRecordings });
    }

    super.exit();
  }

  // defaults to 50ms
  recordPeriodic(period = 0.05) {
    // - don't try to access logger when entering or exiting
    // - don't log if the media is paused
    if (this.status === 'entered' && !this.refs.$mediaPlayer.paused) {
      // make a copy to be sure to record every move
      const position = Object.assign({}, this.position);
      const time = this.refs.$mediaPlayer.currentTime;

      this.refs.annotationLogger.write({ time, position });
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
            @click="${e => this.refs.participant.set({ context: 'choose-file' }) }">
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
