import ConfigureName from './ConfigureName.js';
import ConfigureTags from './ConfigureTags.js';
import ChooseFile from './ChooseFile.js';
import AnnotateIdle from './AnnotateIdle.js';
import AnnotateSlider from './AnnotateSlider.js';
import AnnotateTriangle from './AnnotateTriangle.js';
import AnnotateSquare from './AnnotateSquare.js';
import End from './End.js';
import StartTask from './startTask.js';
// import AudioPlayer from './AudioPlayer.js';

const contexts = {
  'configure-name': ConfigureName,
  'configure-tags': ConfigureTags,
  'choose-file': ChooseFile,
  'annotate-idle': AnnotateIdle,
  'annotate-slider': AnnotateSlider,
  'annotate-triangle': AnnotateTriangle,
  'annotate-square': AnnotateSquare,
  // 'audio-player': AudioPlayer,
  'start-task': StartTask,
  'end': End,
};

class StateMachine {
  constructor(refs) {
    this.refs = refs;
    this.context = null;
  }

  async setContext(name) {
    if (name === this.name) {
      return;
    }

    if (this.context !== null) {
      console.log(`> exit ${this.context.name}`);
      this.context.status = 'exited';
      await this.context.exit();
      this.context = null;
      // this.context.render(); //TODO
    }

    const ctor = contexts[name];
    const context = new ctor(name, this.refs);

    console.log(`> enter ${name}`);
    await context.enter();
    context.status = 'entered';
    this.context = context;

    this.context.render();
  }
}

export default StateMachine;
