import State from './State.js';
import { html } from 'lit-html';

export default class ConfigureTags extends State {
  async setTagsOrder(tagsOrder) {
    await this.context.participant.set({
      tagsOrder,
      state: 'choose-file',
    });
  }

  async enter() {
    // if the participant has relaunched and we already have a tagsOrder
    // do not override the recorded value
    if (this.context.participant.get('tagsOrder')) {
      console.log('found tags order, bypass choice', this.context.participant.get('tagsOrder'));
      this.context.participant.set({ state: 'choose-file' });
    }

    // if we only have 1 tag list, just use it
    const tags = this.context.project.get('tags');

    if (tags.length === 1) {
      this.setTagsOrder(tags[0]);
    }
  }

  async exit() {
    const { name, tagsOrder } = this.context.participant.getValues();
    const now = new Date().toString();
    // log in shared to have an overview
    this.context.overviewLogger.write(`${now} - ${name} - tagsOrder: ${tagsOrder}`);
    this.context.metasLogger.write(`${now} - tagsOrder: ${tagsOrder}`);
  }

  render() {
    const tags = this.context.project.get('tags');

    return html`
      <div class="screen">
        <!-- @todo : handle 2d and 3d -->
        <p>Choose tags order (top, bottom-right, bottom-left):</p>
        ${tags.map(tagItems => {
          return html`
            <button
              @click=${e => this.setTagsOrder(tagItems)}
              style="display:block"
            >
              ${tagItems.join(' - ')}
            </button>
          `
        })}
      </div>
    `;
  }
}
