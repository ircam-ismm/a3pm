import State from './State.js';
import { html } from 'lit-html';

export default class End extends State {
  async enter() {
    const { name, annotatedRecordings } = this.context.participant.getValues();
    const now = new Date().toString();

    this.context.overviewLogger.write(`${now} - ${name} - finished: ${annotatedRecordings}`);
    this.context.metasLogger.write(`${now} - end - annotatedRecordings: ${annotatedRecordings}`);

    setTimeout(() => window.location.reload(true), 30 * 1000);
  }

  render() {
    return html`
      <p
        style="text-align: center; margin-top: 20%;"
      >${this.texts.title}</p>
    `;
  }
}
