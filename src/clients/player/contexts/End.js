import BaseContext from './BaseContext.js';
import { html } from 'lit';

export default class End extends BaseContext {
  async enter() {
    const { name, annotatedRecordings, currentTaskIndex } = this.refs.participant.getValues();
    const now = new Date().toString();

    this.refs.overviewLogger.write(
      `${now} - ${name} - task: ${currentTaskIndex + 1} - finished: ${annotatedRecordings}`);
    this.refs.metasLogger.write(
      `${now} - task: ${currentTaskIndex + 1} - end - annotatedRecordings: ${annotatedRecordings}`);

    const numTasks = this.refs.project.get('numTasks');

    if (currentTaskIndex + 1 < numTasks) {
      // reset : tagsOrder, recording, annotatedRecordings, testDone, testing
      const initValues = this.refs.participant.getInitValues();

      this.refs.participant.set({
        tagsOrder: initValues.tagsOrder,
        recording: initValues.recording,
        annotatedRecordings: initValues.annotatedRecordings,
        testDone: initValues.testDone,
        testing: initValues.testing,
        currentTaskIndex: currentTaskIndex + 1,
        context: 'start-task',
      });
    } else {
      setTimeout(() => window.location.reload(true), 30 * 1000);
    }

    super.enter();
  }

  render() {
    return html`
      <p
        style="text-align: center; margin-top: 20%;"
      >${this.texts.title}</p>
    `;
  }
}
