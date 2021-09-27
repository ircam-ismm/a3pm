import AnnotateBase from './AnnotateBase.js';
import { html } from 'lit-html';

import '@ircam/simple-components/sc-slider.js';

function getAreaSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const size = Math.min(width, height) * 0.7;
  const top = (height - size) / 2 + 60; // 60 is the header
  const left = (width - size) / 2;

  // console.log(size, left, top);
  return { size, left, top };
}

export default class AnnotateSlider extends AnnotateBase {
  constructor(name, context) {
    super(name, context);

    this.position = 0;
  }

  recordPosition(value) {
    this.position = value;

    const data = {
      time: this.context.$mediaPlayer.currentTime,
      position: this.position,
    };

    this.context.annotationLogger.write(data);
    this.context.render();
  }

  render() {
    const { recording, tagsOrder } = this.context.participant.getValues();
    const { size, left, top } = getAreaSize();

    const view = html`
      <p>Annotating "${recording}"</p>

      <p
        style="position: absolute; top: ${top}px; right: ${left + size + 100}px;"
      >${tagsOrder[0]}</p>
      <sc-slider
        style="position: absolute; top: ${top}px; left: ${left}px"
        width="${size}"
        height="60"
        min="0"
        max="1"
        value="${this.position}"
        @input="${e => this.recordPosition(e.detail.value)}"
      ></sc-slider>
      <p
        style="position: absolute; top: ${top}px; left: ${left + size + 100}px"
      >${tagsOrder[1]}</p>
    `;

    return super.render(view);
  }
}
