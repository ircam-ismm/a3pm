import { AbstractExperience } from '@soundworks/core/client';
import { render, html, nothing } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import StateMachine from './states/StateMachine.js';
import i18n from './i18n/index.js';

window.DEBUG = false;
window.SILENCE = 'audio/silence-4s.wav';

class PlayerExperience extends AbstractExperience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;
    // require services
    this.logger = this.require('logger');
    this.fileSystem = this.require('file-system');

    // default initialization views
    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.$mediaPlayer = new Audio();
    // we need that to take control over the tag, so that the first, play can resolve
    // cf. configureName state
    this.$mediaPlayer.src = window.SILENCE;

    // loggers
    this.overviewLogger = await this.logger.attach('overview.txt'); // global to all clients, owned by server
    this.metasLogger = null; // created when client set id for all participant session
    this.annotationLogger = null; // created for each annotation

    this.stateMachine = new StateMachine(this);

    this.project = await this.client.stateManager.attach('project');
    console.log(this.project.getValues());

    this.participant = await this.client.stateManager.create('participant');
    this.participant.subscribe(async updates => {
      if ('state' in updates) {
        const currentTaskIndex = this.participant.get('currentTaskIndex');
        let state;

        if (updates.state === 'annotate') {
          const annotationType = this.project.get('annotationType')[currentTaskIndex];

          switch (annotationType) {
            case 'triangle':
              state = 'annotate-triangle';
              break;
            case 'square':
              state = 'annotate-square';
              break;
            case 'slider':
              state = 'annotate-slider';
              break;
            // case 'markers':
            //   state = 'annotate-markers';
              break;
            case 'audio-player':
              state = 'audio-player';
          }
        } else {
          state = updates.state;
        }

        this.stateMachine.setState(state);
      }

      this.render();
    });

    // update media list if we are in choose-file state
    this.fileSystem.state.subscribe(() => {
      if (this.participant.get('state') === 'choose-file') {
        this.render();
      }
    });

    const language = this.project.get('language');
    this.texts = i18n[language];

    const FORCE_ANNOTATION = false;

    if (FORCE_ANNOTATION) {
      // @testing - test annotationPage
      const testAnnotationPage = async () => {
        document.removeEventListener('click', testAnnotationPage);

        const currentTaskIndex = this.participant.get('currentTaskIndex');
        const mediaFolder = this.project.get('mediaFolder')[currentTaskIndex];
        const tags = this.project.get('tags')[currentTaskIndex];
        const projectFiles = this.fileSystem.get('medias');

        const recordings = projectFiles.children
          .find(leaf => leaf.name === mediaFolder)
          .children
          .map(leaf => leaf.url);

        this.metasLogger = { write: (msg) => console.log(msg) };

        this.participant.set({
          name: 'test-user',
          slug: 'test-user',
          folder: 'test-user-42',
          recording: recordings[0],
          tagsOrder: tags[0],
          state: 'annotate',
        });
      }

      document.addEventListener('click', testAnnotationPage);
    } else {
      // default state machine initialization
      this.participant.set({ state: 'configure-name' });
    }


    window.addEventListener('resize', () => this.render());

    this.render();
  }

  render() {
    render(html`
      <h1 class="header">
        ${this.config.app.name} - ${this.project.get('name')}
      </h1>
      <div class="main">
        ${this.stateMachine.state ?
          this.stateMachine.state.render() :
          nothing
        }
      </div>
      ${this.participant.get('name') ?
        html`<span class="username">[${this.participant.get('name')}]</span>` :
        nothing
      }
    `, this.$container);
  }
}

export default PlayerExperience;
