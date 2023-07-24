import AnnotateBase from './AnnotateBase.js';
import { html } from 'lit';

import '@ircam/sc-components/sc-slider.js';
import { getSliderArea } from '../utils/annotation-area-position.js';

export default class AnnotateSlider extends AnnotateBase {
  constructor(name, refs) {
    super(name, refs);

    this.position = { x: 0.5 };
  }

  async enter() {
    await super.enter();
    this.recordPeriodic(0.05);
  }

  setPosition(value) {
    this.position.x = value;
    this.refs.$layout.requestUpdate();
  }

  render() {
    const sliderHeight = 60;
    const { recording, tagsOrder, currentTaskIndex } = this.refs.participant.getValues();
    const { size, left, top } = getSliderArea(sliderHeight);

    const testing = this.refs.participant.get('testing');
    let title = `${this.texts.title} "${recording}"`;

    if (testing) {
      title = `[test] ${title}`;
    }

    return html`
      <p>${title}"</p>
      <p>${this.refs.project.get('instruction')[currentTaskIndex]}</p>

      <span
        style="position: absolute; top: ${top - 30}px; left: ${left}px; font-size: 1.2rem"
      >< ${tagsOrder[0]}</span>
      <sc-slider
        style="
          position: absolute;
          top: ${top}px; 
          left: ${left}px;
          width: ${size}px;
          height: ${sliderHeight}px;
        "
        min="0"
        max="1"
        value="${this.position.x}"
        @input="${e => this.setPosition(e.detail.value)}"
      ></sc-slider>
      <span
        style="position: absolute; top: ${top - 50}px; right: ${left}px; font-size: 1.2rem"
      >${tagsOrder[1]} ></span>
    `;

    // return super.render(view);
  }
}
