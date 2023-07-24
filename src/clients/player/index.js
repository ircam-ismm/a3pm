import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import createLayout from './layout.js';
import { render, html, nothing } from 'lit';

import pluginLogger from '@soundworks/plugin-logger/client.js';
import pluginFilesystem from '@soundworks/plugin-filesystem/client.js';

import StateMachine from './contexts/StateMachine.js';
import i18n from './i18n/index.js';

window.SILENCE = 'audio/silence-4s.wav';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

/**
 * Grab the configuration object written by the server in the `index.html`
 */
const config = window.SOUNDWORKS_CONFIG;

/**
 * If multiple clients are emulated you might to want to share some resources
 */
// const audioContext = new AudioContext();

async function main($container) {
  /**
   * Create the soundworks client
   */
  const client = new Client(config);

  /**
   * Register some soundworks plugins, you will need to install the plugins
   * before hand (run `npx soundworks` for help)
   */
  // client.pluginManager.register('my-plugin', plugin);
  client.pluginManager.register('logger', pluginLogger);
  client.pluginManager.register('filesystem-medias', pluginFilesystem, {});
  client.pluginManager.register('filesystem-measures', pluginFilesystem, {});

  /**
   * Register the soundworks client into the launcher
   *
   * The launcher will do a bunch of stuff for you:
   * - Display default initialization screens. If you want to change the provided
   * initialization screens, you can import all the helpers directly in your
   * application by doing `npx soundworks --eject-helpers`. You can also
   * customise some global syles variables (background-color, text color etc.)
   * in `src/clients/components/css/app.scss`.
   * You can also change the default language of the intialization screen by
   * setting, the `launcher.language` property, e.g.:
   * `launcher.language = 'fr'`
   * - By default the launcher automatically reloads the client when the socket
   * closes or when the page is hidden. Such behavior can be quite important in
   * performance situation where you don't want some phone getting stuck making
   * noise without having any way left to stop it... Also be aware that a page
   * in a background tab will have all its timers (setTimeout, etc.) put in very
   * low priority, messing any scheduled events.
   */
  launcher.register(client, { initScreensContainer: $container });

  /**
   * Launch application
   */
  await client.start();

  // The `$layout` is provided as a convenience and is not required by soundworks,
  // its full source code is located in the `./views/layout.js` file, so feel free
  // to edit it to match your needs or even to delete it.
  const $layout = createLayout(client, $container);

  // do your own stuff!
  const $mediaPlayer = new Audio();
  $mediaPlayer.src = window.SILENCE;

  //loggers 
  const logger = await client.pluginManager.get('logger');
  const overviewLogger = await logger.createWriter('overview'); // global to all clients, owned by server
  const metasLogger = null; // created when client set id for all participant session
  const annotationLogger = null; // created for each annotation

  //filesystem 
  const filesystemMedias = await client.pluginManager.get('filesystem-medias');

  const project = await client.stateManager.attach('project');
  console.log(project.getValues());

  const participant = await client.stateManager.create('participant');
  participant.onUpdate(async updates => {
    if ('context' in updates) {
      const currentTaskIndex = participant.get('currentTaskIndex');
      let context;

      if (updates.context === 'annotate') {
        const annotationType = project.get('annotationType')[currentTaskIndex];

        switch (annotationType) {
          case 'triangle':
            context = 'annotate-triangle';
            break;
          case 'square':
            context = 'annotate-square';
            break;
          case 'slider':
            context = 'annotate-slider';
            break;
          case 'audio-player':
            context = 'audio-player';
        }
      } else {
        context = updates.context;
      }

      stateMachine.setContext(context);
    }

    $layout.requestUpdate();
  });

  filesystemMedias.onUpdate(updates => {
    if (participant.get('state') === 'choose-file') {
      $layout.requestUpdate();
    }
  });
  

  const language = project.get('language');
  const texts = i18n[language];

  const refs = {
    client,
    logger,
    metasLogger,
    overviewLogger,
    annotationLogger,
    filesystemMedias,
    project,
    participant,
    texts,
    $layout,
    $mediaPlayer,
  }

  const stateMachine = new StateMachine(refs);

  const FORCE_ANNOTATION = false;
  if (FORCE_ANNOTATION) {
    // @testing - test annotationPage
    const testAnnotationPage = async () => {
      document.removeEventListener('click', testAnnotationPage);

      const currentTaskIndex = participant.get('currentTaskIndex');
      const mediaFolder = project.get('mediaFolder')[currentTaskIndex];
      const tags = project.get('tags')[currentTaskIndex];
      const projectFiles = filesystemMedias.get('medias');

      const recordings = projectFiles.children
        .find(leaf => leaf.name === mediaFolder)
        .children
        .map(leaf => leaf.url);

      metasLogger = { write: (msg) => console.log(msg) };

      participant.set({
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
    participant.set({ context: 'configure-name' });
  }
  
  $layout.addComponent(html`
    <h1 class="header">
      ${config.app.name} - ${project.get('name')}
    </h1>
    ${participant.get('name') ?
      html`<span class="username">[${this.participant.get('name')}]</span>` :
      nothing
    }
  `)

}

// The launcher enables instanciation of multiple clients in the same page to
// facilitate development and testing.
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});
