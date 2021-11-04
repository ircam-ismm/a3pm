import ConfigureName from './ConfigureName.js';
import ConfigureTags from './ConfigureTags.js';
import ChooseFile from './ChooseFile.js';
import AnnotateIdle from './AnnotateIdle.js';
import AnnotateSlider from './AnnotateSlider.js';
import AnnotateTriangle from './AnnotateTriangle.js';
import AnnotateSquare from './AnnotateSquare.js';
import End from './End.js';
import StartTask from './startTask.js';

const states = {
  'configure-name': ConfigureName,
  'configure-tags': ConfigureTags,
  'choose-file': ChooseFile,
  'annotate-idle': AnnotateIdle,
  'annotate-slider': AnnotateSlider,
  'annotate-triangle': AnnotateTriangle,
  'annotate-square': AnnotateSquare,
  'start-task': StartTask,
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
      this.state.status = 'exited';
      await this.state.exit();
      this.state = null;
      this.context.render();
    }

    const ctor = states[name];
    const state = new ctor(name, this.context);

    console.log(`> enter ${name}`);
    await state.enter();
    state.status = 'entered';
    this.state = state;

    this.context.render();
  }
}

export default StateMachine;
