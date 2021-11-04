import State from './State.js';
import { html } from 'lit-html';
import slugify from 'slugify';

export function pad(prefix, radical) {
  const string = typeof radical === 'string' ? radical : radical.toString();
  const slice = string.length > prefix.length ? prefix.length : -prefix.length;

  return (prefix + string).slice(slice);
}

export function date() {
  const date = new Date();

  const year = date.getFullYear();
  const month = pad('00', date.getMonth() + 1); // Month starts at 0
  const day = pad('00', date.getDate());

  const hours = pad('00', date.getHours());
  const minutes = pad('00', date.getMinutes());
  const seconds = pad('00', date.getSeconds());
  const millisec = pad('000', date.getMilliseconds());

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export default class ConfigureName extends State {

  async setName(name) {
    // take control over the audio tag on a proper event and keep it around
    // cf. https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
    const playPromise = this.context.$mediaPlayer.play();

    if (playPromise !== undefined) {
      await playPromise;
      this.context.$mediaPlayer.pause();
    } else {
      this.context.$mediaPlayer.pause();
    }

    if (name !== '') {
      const folder = `${date()}-${name}-${this.context.client.id}`;

      await this.context.participant.set({
        name,
        folder,
        state: 'start-task',
      });
    }
  }

  async exit() {
    const { folder, name } = this.context.participant.getValues();
    this.context.metasLogger = await this.context.logger.create(`${folder}/${name}.txt`);

    const now = new Date().toString();
    this.context.overviewLogger.write(`[${now}] - ${name} - folder: ${folder}`);

    this.context.metasLogger.write(`[${now}] - name: ${name}`);
    this.context.metasLogger.write(`[${now}] - folder: ${folder}`);
  }

  render() {
    return html`
      <p>${this.texts.title}</p>
      <input type="text" />
      <button
        @click="${e => this.setName(e.target.previousElementSibling.value)}"
      >${this.texts.btn}</button>
    `;
  }
}
