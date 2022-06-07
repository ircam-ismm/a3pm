import State from './State.js';
import { html } from 'lit-html';

export default class StartTask extends State {

  render() {
    const currentTaskIndex = this.context.participant.get('currentTaskIndex');

    return html`
      <p>${this.texts.title} ${currentTaskIndex + 1}</p>
      <button
        @click="${e => this.context.participant.set({state: 'configure-tags'})}"
      >${this.texts.btn}</button>
    `;
  }
}
