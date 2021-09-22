import ConfigureName from './ConfigureName.js';
import ConfigureTags from './ConfigureTags.js';
import ChooseFile from './ChooseFile.js';
import AnnotateIdle from './AnnotateIdle.js';
import AnnotateSlider from './AnnotateSlider.js';
import AnnotateCircle from './AnnotateCircle.js';
import End from './End.js';

const states = {
  'configure-name': ConfigureName,
  'configure-tags': ConfigureTags,
  'choose-file': ChooseFile,
  'annotate-idle': AnnotateIdle,
  'annotate-slider': AnnotateSlider,
  'annotate-circle': AnnotateCircle,
  'end': End,
};

class StateMachine {
  constructor(context) {
    this.context = context;
    this.state = null;
  }

  async setState(name) {
    if (name === this.name) {
      return;
    }

    if (this.state !== null) {
      console.log(`> exit ${this.state.name}`);
      await this.state.exit();
      this.state = null;
      this.context.render();
    }

    const ctor = states[name];
    const state = new ctor(name, this.context);

    console.log(`> enter ${name}`);
    await state.enter();
    this.state = state;
    this.context.render();
  }
}

export default StateMachine;
