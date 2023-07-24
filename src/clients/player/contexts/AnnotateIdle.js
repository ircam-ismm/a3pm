import BaseContext from './BaseContext.js';
import { html } from 'lit';

export default class AnnotateIdle extends BaseContext {
  async startAnnotation() {
    await this.refs.participant.set({ context: 'annotate' })
  }

  render() {
    const testing = this.refs.participant.get('testing');
    let title = `${this.texts.title} ${this.refs.participant.get('recording')}`;

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
