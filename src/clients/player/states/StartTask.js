import State from './State.js';
import { html } from 'lit-html';

export default class StartTask extends State {

  render() {
    const completedTasks = this.context.participant.get('completedTasks');

    return html`
      <p>${this.texts.title} ${completedTasks + 1}</p>
      <button
        @click="${e => this.context.participant.set({state: 'configure-tags'})}"
      >${this.texts.btn}</button>
    `;
  }
}