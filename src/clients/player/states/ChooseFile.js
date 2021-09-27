import State from './State.js';
import { html } from 'lit-html';

export default class ChooseFile extends State {
  async setRecording(recording) {
    await this.context.participant.set({
      recording,
      state: 'annotate-idle',
    });
  }

  async enter() {
    if (!window.DEBUG) {
      const audioFiles = this.context.fileSystem.get('medias');
      const recordingsOverview = audioFiles.children.map(leaf => leaf.url);
      const annotatedRecordings = this.context.participant.get('annotatedRecordings');
      const remainingRecordings = recordingsOverview.filter(recording => {
        return !annotatedRecordings.includes(recording);
      });

      if (remainingRecordings.length === 0) {
        await this.context.participant.set({ state: 'thanks' });
      } else {
        // pick a random recording
        const index = Math.floor(Math.random() * remainingRecordings.length);
        const recording = remainingRecordings[index];

        await this.setRecording(recording);
      }
    }
  }

  // async exit() {

  // }

  render() {
    // @note - only in DEBUG mode
    const audioFiles = this.context.fileSystem.state.get('medias');
    const recordingsOverview = audioFiles.children.map(leaf => leaf.url);

    return html`
      <p>Choose the recording to annotate:</p>
      ${recordingsOverview.map(recording => {
        return html`
          <button
            @click=${e => this.setRecording(recording)}
            style="display:block"
          >
            ${recording}
            ${this.context.participant.get('annotatedRecordings').indexOf(recording) !== -1 ?
              ' - (annotated)': ''
            }
          </button>
        `
      })}
    `
  }
}
