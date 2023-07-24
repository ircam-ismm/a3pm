import BaseContext from './BaseContext.js';
import { html } from 'lit';
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


export default class ConfigureName extends BaseContext {

  async setName(name) {
    // take control over the audio tag on a proper event and keep it around
    // cf. https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
    const playPromise = this.refs.$mediaPlayer.play();

    if (playPromise !== undefined) {
      await playPromise;
      this.refs.$mediaPlayer.pause();
    } else {
      this.refs.$mediaPlayer.pause();
    }

    if (name !== '') {
      const slug = slugify(name, { remove: /[*+~(),.`'"!:@]/g });
      const folder = `${date()}-${slug}-${this.refs.client.id}`;

      await this.refs.participant.set({
        name,
        slug,
        folder,
        context: 'start-task',
      });
    }
  }

  async exit() {
    const { folder, name, slug } = this.refs.participant.getValues();
    this.refs.metasLogger = await this.refs.logger.createWriter(`${folder}/${slug}.txt`);

    const now = new Date().toString();
    this.refs.overviewLogger.write(`[${now}] - ${name} - folder: ${folder}`);

    this.refs.metasLogger.write(`[${now}] - name: ${name}`);
    this.refs.metasLogger.write(`[${now}] - folder: ${folder}`);

    super.exit();
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
