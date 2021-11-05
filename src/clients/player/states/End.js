import State from './State.js';
import { html } from 'lit-html';

export default class End extends State {
  async enter() {
    const { name, annotatedRecordings, completedTasks } = this.context.participant.getValues();
    const now = new Date().toString();

    this.context.overviewLogger.write(`${now} - ${name} - task: ${completedTasks+1} - finished: ${annotatedRecordings}`);
    this.context.metasLogger.write(`${now} - task: ${completedTasks+1} - end - annotatedRecordings: ${annotatedRecordings}`);

    const taskNumber = this.context.project.get('taskNumber');

    if (completedTasks+1 < taskNumber ) {
      //reset : tagsOrder, recording, annotatedRecordings, testDone, testing
      const initValues = this.context.participant.getInitValues();
      this.context.participant.set({
        tagsOrder: initValues.tagsOrder,
        recording: initValues.recording,
        annotatedRecordings: initValues.annotatedRecordings,
        testDone: initValues.testDone,
        testing: initValues.testing,
        completedTasks: completedTasks+1,
        state: 'start-task',
      });
    } else {
      setTimeout(() => window.location.reload(true), 30 * 1000);
    }
  }

  render() {
    return html`
      <p
        style="text-align: center; margin-top: 20%;"
      >${this.texts.title}</p>
    `;
  }
}
