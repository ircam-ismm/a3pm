import State from './State.js';
import { html } from 'lit-html';

export default class End extends State {
  async enter() {
    const { name, annotatedRecordings } = this.context.participant.getValues();
    const now = new Date().toString();

    this.overviewLogger.write(`${now} - ${name} - finished: ${annotatedRecordings}`);
    this.metasLogger.write(`${now} - end - annotatedRecordings: ${annotatedRecordings}`);

    setTimeout(() => window.location.reload(true), 8000);
  }

  render() {
    return html`
      <p
        style="text-align: center; margin-top: 200px;"
      >Thanks for your participation</p>
    `;
  }
}
