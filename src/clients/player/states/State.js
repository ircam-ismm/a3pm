import { html } from 'lit';

export default class State {
  constructor(name, context) {
    this.name = name
    this.context = context;
    this.texts = this.context.texts[name];

    this.status = 'idle';
  }

  async enter() {}

  async exit() {}

  render() {
    return html`<h1>${this.name}</h1>`;
  }
}
