import BaseContext from './BaseContext.js';
import { html } from 'lit';

export default class ConfigureTags extends BaseContext {
  async setTagsOrder(tagsOrder) {
    await this.refs.participant.set({
      tagsOrder,
      context: 'choose-file',
    });
  }

  async enter() {
    // if the participant has relaunched and we already have a tagsOrder
    // do not override the recorded value
    if (this.refs.participant.get('tagsOrder')) {
      console.log('+ reconnecting client, bypass tag choice', this.refs.participant.get('tagsOrder'));
      this.refs.participant.set({ context: 'choose-file' });
    }

    const currentTaskIndex = this.refs.participant.get('currentTaskIndex');
    const tags = this.refs.project.get('tags')[currentTaskIndex];

    // if we only have 1 tag list, just use it
    if (tags.length <= 1) {
      console.log('+ only 1 tag choice, bypass choice', tags[0]);
      this.setTagsOrder(tags[0]);
    }

    super.enter();
  }

  async exit() {
    const { name, tagsOrder, currentTaskIndex } = this.refs.participant.getValues();
    const now = new Date().toString();
    // log in shared to have an overview
    this.refs.overviewLogger.write(
      `${now} - ${name} - task: ${currentTaskIndex + 1} - tagsOrder: ${tagsOrder}`);
    this.refs.metasLogger.write(
      `${now} - task: ${currentTaskIndex + 1} - tagsOrder: ${tagsOrder}`);
    this.refs.taskMetasLogger.write(
      `tagsOrder: ${ tagsOrder }`); 

    super.exit();
  }

  render() {
    const currentTaskIndex = this.refs.participant.get('currentTaskIndex');
    const tags = this.refs.project.get('tags')[currentTaskIndex];
    const annotationType = this.refs.project.get('annotationType')[currentTaskIndex];
    let title = null;

    if (annotationType === 'slider') {
      title = this.texts.titleSlider;
    } else if (annotationType === 'triangle') {
      title = this.texts.titleTriangle;
    } else if (annotationType === 'square') {
      title = this.texts.titleSquare;
    }


    return html`
      <div class="screen">
        <p>${title}</p>
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
