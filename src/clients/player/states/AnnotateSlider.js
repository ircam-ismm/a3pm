import AnnotateBase from './AnnotateBase.js';
import { html } from 'lit-html';

import '@ircam/simple-components/sc-slider.js';
import { getSliderArea } from '../utils/annotation-area-position.js';

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
    const sliderHeight = 60;
    const { recording, tagsOrder } = this.context.participant.getValues();
    const { size, left, top } = getSliderArea(sliderHeight);

    const view = html`
      <p>Annotating "${recording}"</p>

      <span
        style="position: absolute; top: ${top - 30}px; left: ${left}px; font-size: 1.2rem"
      >< ${tagsOrder[0]}</span>
      <sc-slider
        style="position: absolute; top: ${top}px; left: ${left}px"
        width="${size}"
        height="${sliderHeight}"
        min="0"
        max="1"
        value="${this.position}"
        @input="${e => this.recordPosition(e.detail.value)}"
      ></sc-slider>
      <span
        style="position: absolute; top: ${top - 50}px; right: ${left}px; font-size: 1.2rem"
      >${tagsOrder[1]} ></span>
    `;

    return super.render(view);
  }
}
