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
      console.log('+ reconnecting client, bypass tag choice', this.context.participant.get('tagsOrder'));
      this.context.participant.set({ state: 'choose-file' });
    }

    const currentTaskIndex = this.context.participant.get('currentTaskIndex');
    const tags = this.context.project.get('tags')[currentTaskIndex];

    // if we only have 1 tag list, just use it
    if (tags.length <= 1) {
      console.log('+ only 1 tag choice, bypass choice', tags[0]);
      this.setTagsOrder(tags[0]);
    }
  }

  async exit() {
    const { name, tagsOrder, currentTaskIndex } = this.context.participant.getValues();
    const now = new Date().toString();
    // log in shared to have an overview
    this.context.overviewLogger.write(
      `${now} - ${name} - task: ${currentTaskIndex + 1} - tagsOrder: ${tagsOrder}`);
    this.context.metasLogger.write(
      `${now} - task: ${currentTaskIndex + 1} - tagsOrder: ${tagsOrder}`);
    this.context.taskMetasLogger.write(
      `tagsOrder: ${ tagsOrder }`); 
  }

  render() {
    const currentTaskIndex = this.context.participant.get('currentTaskIndex');
    const tags = this.context.project.get('tags')[currentTaskIndex];
    const annotationType = this.context.project.get('annotationType')[currentTaskIndex];
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
