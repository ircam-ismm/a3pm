import AnnotateBase from './AnnotateBase.js';
import { html } from 'lit';

import { getCircleArea } from '../utils/annotation-area-position.js';

export default class AnnotateTriangle extends AnnotateBase {
  constructor(name, context) {
    super(name, context);

    this.active = false;
    this.position = { x: 0, y: 0 };

    this.onInteractionStart = this.onInteractionStart.bind(this);
    this.onInteractionMove = this.onInteractionMove.bind(this);
    this.onInteractionEnd = this.onInteractionEnd.bind(this);
  }

  async enter() {
    await super.enter();

    document.body.addEventListener('touchmove', this.onInteractionMove);
    document.body.addEventListener('touchend', this.onInteractionEnd);
    document.body.addEventListener('touchcancel', this.onInteractionEnd);
    document.body.addEventListener('mousemove', this.onInteractionMove);
    document.body.addEventListener('mouseup', this.onInteractionEnd);
    document.body.addEventListener('mouseleave', this.onInteractionEnd);

    this.recordPeriodic(0.05);
  }

  async exit() {
    document.body.removeEventListener('touchmove', this.onInteractionMove);
    document.body.removeEventListener('touchend', this.onInteractionEnd);
    document.body.removeEventListener('touchcancel', this.onInteractionEnd);
    document.body.removeEventListener('mousemove', this.onInteractionMove);
    document.body.removeEventListener('mouseup', this.onInteractionEnd);
    document.body.removeEventListener('mouseleave', this.onInteractionEnd);

    await super.exit();
  }

  onInteractionStart(e) {
    e.preventDefault();

    if (!this.active) {
      this.active = true;
      this.onInteractionMove(e);
    }
  }

  onInteractionMove(e) {
    if (this.active) {
      const event = (e.type === 'touchmove' || e.type === 'touchstart') ? e.touches[0] : e;

      const { size, left, top } = getCircleArea();
      const relX = event.clientX - left;
      const relY = event.clientY - top;

      // noramlize in unit circle
      const normDotX = relX / size * 2 - 1;
      const normDotY = (relY / size * 2 - 1) * -1;

      // inscribe in circle
      const angle = Math.atan2(normDotY, normDotX);
      const correctedNormX = Math.cos(angle);
      const correctedNormY = Math.sin(angle);

      this.position.x = normDotX > 0 ?
        Math.min(normDotX, correctedNormX) :
        Math.max(normDotX, correctedNormX);

      this.position.y = normDotY > 0 ?
        Math.min(normDotY, correctedNormY) :
        Math.max(normDotY, correctedNormY);

      this.context.render();
    }
  }

  onInteractionEnd(e) {
    if (this.active) {
      e.preventDefault();
      this.active = false;
    }
  }

  render() {
    const { size, left, top } = getCircleArea();
    const { recording, tagsOrder, currentTaskIndex } = this.context.participant.getValues();

    const testing = this.context.participant.get('testing');
    let title = `${this.texts.title} "${recording}"`;

    if (testing) {
      title = `[test] ${title}`;
    }

    const view = html`
      <p>${title}"</p>
      <p>${this.context.project.get('instruction')[currentTaskIndex]}</p>

      <div style="
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        top: ${top}px;
        left: ${left}px;"

        @touchstart=${this.onInteractionStart}
        @mousedown=${this.onInteractionStart}
      >
        <!-- legend -->
        <!-- top -->
        <span
          style="
            width: ${size}px;
            font-size: 1.2rem;
            text-align: center;
            position: absolute;
            top: -20px;
          "
        >${tagsOrder[0]}</span>
        <!-- bottom right -->
        <span
          style="
            font-size: 1.2rem;
            position: absolute;
            bottom: ${size * ((1 - Math.sin(Math.PI / 6)) / 2)}px;
            left: ${size}px;
          "
        >${tagsOrder[1]}</span>
        <!-- bottom left -->
        <span
          style="
            font-size: 1.2rem;
            text-align: center;
            position: absolute;
            bottom: ${size * ((1 - Math.sin(Math.PI / 6)) / 2)}px;
            right: ${size}px;
          "
        >${tagsOrder[2]}</span>

        <!-- inner circle -->
        <div style="
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          top: 0;
          left: 0;
          border-radius: 50%;
          background: url(./images/triangle-bg.png) 50% 50% no-repeat;
          background-size: 100% 100%;
        "></div>

        <!-- dot -->
        <div
          style="
            background-color: #ffffff;
            width: 30px;
            height: 30px;
            margin-top: -15px;
            margin-left: -15px;
            border-radius: 50px;
            position: absolute;
            top: ${(-this.position.y + 1) / 2 * size}px;
            left: ${(this.position.x + 1) / 2 * size}px;
          "
        ></div>

      </div>
    `;

    return super.render(view);
  }
}



