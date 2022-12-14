import State from './State.js';
import { html } from 'lit';

export default class StartTask extends State {

  async exit() {
    const { folder, slug, currentTaskIndex } = this.context.participant.getValues();
    this.context.taskMetasLogger = await this.context.logger.create(
      `${folder}/task${currentTaskIndex + 1}/task-metas-${slug}.txt`);
  }

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
