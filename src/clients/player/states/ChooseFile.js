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
      const recordingsOverview = audioFiles.children
        .filter(leaf => leaf.name !== this.context.project.get('testRecording'))
        .map(leaf => leaf.url);
      const annotatedRecordings = this.context.participant.get('annotatedRecordings');
      const remainingRecordings = recordingsOverview.filter(recording => {
        return !annotatedRecordings.includes(recording);
      });

      const testRecording = audioFiles.children
        .find(leaf => leaf.name === this.context.project.get('testRecording'))
        .url;

      console.log(remainingRecordings, testRecording);

      if (remainingRecordings.length === 0) {
        // we don't want to await here as the exit would never be called
        this.context.participant.set({ state: 'end' });
      } else {
        //
        if (
          this.context.project.get('testRecording') !== null &&
          this.context.participant.get('testDone') === false
        ) {
          this.context.participant.set({ testing: true });
          this.setRecording(testRecording);
        } else {
          // pick a random recording
          const index = Math.floor(Math.random() * remainingRecordings.length);
          const recording = remainingRecordings[index];
          // we don't want to await here as the exit would never be called
          this.setRecording(recording);
        }
      }
    }
  }

  render() {
    // @note - only in DEBUG mode
    const audioFiles = this.context.fileSystem.state.get('medias');
    const recordingsOverview = audioFiles.children.map(leaf => leaf.url);

    return html`
      <p>${this.texts.title}</p>
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
