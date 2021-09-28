import State from './State.js';
import { html } from 'lit-html';

export default class AnnotateIdle extends State {
  async startAnnotation() {
    await this.context.participant.set({ state: 'annotate' })
  }

  render() {
    return html`
      <p
        style="margin-bottom: 30px"
      >Recording: ${this.context.participant.get('recording')}</p>
      <button
        @click="${e => this.startAnnotation()}"
      >start annotation</button>
    `
  }
}
