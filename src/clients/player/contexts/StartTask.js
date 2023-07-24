import BaseContext from './BaseContext.js';
import { html } from 'lit';

export default class StartTask extends BaseContext {

  async exit() {
    const { folder, slug, currentTaskIndex } = this.refs.participant.getValues();
    this.refs.taskMetasLogger = await this.refs.logger.createWriter(
      `${folder}/task${currentTaskIndex + 1}/task-metas-${slug}.txt`);

    super.exit();
  }

  render() {
    const currentTaskIndex = this.refs.participant.get('currentTaskIndex');

    return html`
      <p>${this.texts.title} ${currentTaskIndex + 1}</p>
      <button
        @click="${e => this.refs.participant.set({context: 'configure-tags'})}"
      >${this.texts.btn}</button>
    `;
  }
}