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
      const completedTasks = this.context.participant.get('completedTasks');
      const projectFiles = this.context.fileSystem.get('medias');
      const taskFiles = projectFiles.children
        .filter(leaf => leaf.name === this.context.project.get('mediaFolder')[completedTasks])[0];
      const recordingsOverview = taskFiles.children
        .filter(leaf => leaf.name !== this.context.project.get('testRecording')[completedTasks])
        .map(leaf => leaf.url); 
      const annotatedRecordings = this.context.participant.get('annotatedRecordings');
      const remainingRecordings = recordingsOverview.filter(recording => {
        return !annotatedRecordings.includes(recording);
      });

      const testRecording = taskFiles.children
        .find(leaf => leaf.name === this.context.project.get('testRecording')[completedTasks]);

      if (remainingRecordings.length === 0) {
        // we don't want to await here as the exit would never be called
        this.context.participant.set({ state: 'end' });
      } else {
        //
        if (
          this.context.project.get('testRecording')[completedTasks] !== null &&
          this.context.participant.get('testDone') === false
        ) {
          this.context.participant.set({ testing: true });
          this.setRecording(testRecording.url);
        } else {
          // pick next recording
          const mediaOrder = this.context.project.get('mediaOrder')[completedTasks];
          let index;
          switch (mediaOrder) {
            case 'alphabetical':
              index = 0;
              break;
            case 'random':
            default:
              index = Math.floor(Math.random() * remainingRecordings.length);
              break;
          }
          const recording = remainingRecordings[index];
          // we don't want to await here as the exit would never be called
          this.setRecording(recording);
        }
      }
    }
  }
  

  render() {
    // @note - only in DEBUG mode
    const completedTasks = this.context.participant.get('completedTasks');
    const projectFiles = this.context.fileSystem.get('medias');
    const taskFiles = projectFiles.children
      .filter(leaf => leaf.name === this.context.project.get('mediaFolder')[completedTasks])[0];
    const recordingsOverview = taskFiles.children.map(leaf => leaf.url);

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
