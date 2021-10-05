import State from './State.js';
import { html } from 'lit-html';

export default class AnnotateIdle extends State {
  async startAnnotation() {
    await this.context.participant.set({ state: 'annotate' })
  }

  render() {
    const testing = this.context.participant.get('testing');
    let title = `${this.texts.title} ${this.context.participant.get('recording')}`;

    if (testing) {
      title = `[test] ${title}`;
    }

    return html`
      <p
        style="margin-bottom: 30px"
      >${title}</p>
      <button
        @click="${e => this.startAnnotation()}"
      >${this.texts.btn}</button>
    `
  }
}
