import { html } from 'lit';
import { Context } from '@soundworks/core/client.js';


export default class BaseContext extends Context {
  constructor(name, refs) {
    super(refs.client); 

    this.contextName = name;
    this.refs = refs;
    this.texts = refs.texts[name];

    this.status = 'idle';
  }

  get name () {
    return this.contextName;
  }

  async enter() { 
    this.refs.$layout.addComponent(this);
  }

  async exit() { 
    this.refs.$layout.deleteComponent(this);
  }

  render() {
    return html`<h1>${this.name}</h1>`;
  }
}
