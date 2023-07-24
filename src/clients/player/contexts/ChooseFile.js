import BaseContext from './BaseContext.js';
import { html } from 'lit';

export default class ChooseFile extends BaseContext {
  async setRecording(recording) {
    await this.refs.participant.set({
      recording,
      context: 'annotate-idle',
    });
  }

  async enter() {
    if (!window.DEBUG) {
      const currentTaskIndex = this.refs.participant.get('currentTaskIndex');
      const mediaFolder = this.refs.project.get('mediaFolder')[currentTaskIndex];
      const testRecording = this.refs.project.get('testRecording')[currentTaskIndex];
      const mediaOrder = this.refs.project.get('mediaOrder')[currentTaskIndex];

      const projectFiles = this.refs.filesystemMedias.getTree();
      const taskFiles = projectFiles.children
        .find(leaf => leaf.name === mediaFolder);

      console.log(currentTaskIndex, mediaFolder, testRecording, mediaOrder);
      console.log(projectFiles);
      const recordingsOverview = taskFiles.children
        .filter(leaf => leaf.name !== testRecording)
        .map(leaf => leaf.url); 

      const annotatedRecordings = this.refs.participant.get('annotatedRecordings');
      const remainingRecordings = recordingsOverview.filter(recording => {
        return !annotatedRecordings.includes(recording);
      });

      const testRecordingFile = taskFiles.children
        .find(leaf => leaf.name === testRecording);

      // if no remaining recordings jump to next task or to end
      if (remainingRecordings.length === 0) {
        // we don't want to await here as the exit would never be called
        this.refs.participant.set({ context: 'end' });
      } else {
        //
        if (
          this.refs.project.get('testRecording')[currentTaskIndex] !== null &&
          this.refs.participant.get('testDone') === false
        ) {
          this.refs.participant.set({ testing: true });
          this.setRecording(testRecordingFile.url);
        } else {
          // pick next recording
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

      super.enter();
    }

  }
  

  render() {
    // @note - only in DEBUG mode
    const currentTaskIndex = this.refs.participant.get('currentTaskIndex');
    const projectFiles = this.refs.filesystemMedias.getTree();
    const taskFiles = projectFiles.children
      .filter(leaf => leaf.name === this.refs.project.get('mediaFolder')[currentTaskIndex])[0];
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
            ${this.refs.participant.get('annotatedRecordings').indexOf(recording) !== -1 ?
              ' - (annotated)': ''
            }
          </button>
        `
      })}
    `
  }
}
