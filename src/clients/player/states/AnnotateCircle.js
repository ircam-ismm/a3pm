import AnnotateBase from './AnnotateBase.js';
import { html } from 'lit-html';

function getAreaSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const size = Math.min(width, height) * 0.7;
  const top = (height - size) / 2 + 60; // 60 is the header
  const left = (width - size) / 2;

  return { size, left, top };
}

export default class AnnotateCircle extends AnnotateBase {
  constructor(name, context) {
    super(name, context);

    this.active = false;
    this.position = { x: 0, y: 0 };

    this.onInteractionStart = this.onInteractionStart.bind(this);
    this.onInteractionMove = this.onInteractionMove.bind(this);
    this.onInteractionEnd = this.onInteractionEnd.bind(this);
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

      const { size, left, top } = getAreaSize();
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

      const data = {
        time: this.context.$mediaPlayer.currentTime,
        position: Object.assign({}, this.position),
      };

      this.context.annotationLogger.write(data);
      this.context.render();
    }
  }

  onInteractionEnd(e) {
    if (this.active) {
      e.preventDefault();
      this.active = false;
    }
  }

  async enter() {
    await super.enter();

    document.body.addEventListener('touchmove', this.onInteractionMove);
    document.body.addEventListener('touchend', this.onInteractionEnd);
    document.body.addEventListener('touchcancel', this.onInteractionEnd);
    document.body.addEventListener('mousemove', this.onInteractionMove);
    document.body.addEventListener('mouseup', this.onInteractionEnd);
    document.body.addEventListener('mouseleave', this.onInteractionEnd);
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

  render() {
    const { size, left, top } = getAreaSize();
    const { recording, tagsOrder } = this.context.participant.getValues();

    const view = html`
      <p>Annotating "${recording}"</p>

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
        <p
          style="
            font-size: 20px;
            width: 120px;
            text-align: center;
            position: absolute;
            top: -60px;
            left: ${size / 2 - 60}px;
          "
        >${tagsOrder[0]}</p>
        <!-- bottom right -->
        <p
          style="
            font-size: 20px;
            width: 120px;
            text-align: center;
            position: absolute;
            top: ${size  * 2 / 3 + 30}px;
            left: ${size - 30}px;
          "
        >${tagsOrder[1]}</p>
        <!-- bottom left -->
        <p
          style="
            font-size: 20px;
            width: 120px;
            text-align: center;
            position: absolute;
            top: ${size  * 2 / 3 + 30}px;
            left: ${-120 + 30}px;
          "
        >${tagsOrder[2]}</p>

        <!-- inner circle -->
        <div style="
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          top: 0;
          left: 0;
          border-radius: 50%;
          background: url(./images/bg.png) 50% 50% no-repeat;
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



