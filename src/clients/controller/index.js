import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import pluginLogger from '@soundworks/plugin-logger/client.js';
import pluginFilesystem from '@soundworks/plugin-filesystem/client.js';

import {html} from 'lit';
import createLayout from './layout.js';

import '../components/sw-monitoring.js';
import '../components/sw-graph.js';
import '../components/sw-anim.js';

// import { html } from 'lit';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = window.SOUNDWORKS_CONFIG;

async function main($container) {
  const client = new Client(config);

  launcher.register(client, {
    initScreensContainer: $container,
    reloadOnVisibilityChange: false,
  });

  client.pluginManager.register('logger', pluginLogger);
  client.pluginManager.register('filesystem-medias', pluginFilesystem, {});
  client.pluginManager.register('filesystem-measures', pluginFilesystem, {});

  
  const participants = new Set();  

  await client.start();


  const $layout = createLayout(client, $container);  
  
  const globals = await client.stateManager.attach('globals');
  const project = await client.stateManager.attach('project');
  const controller = await client.stateManager.create('controller');

  const filesystemMedias = await client.pluginManager.get('filesystem-medias');
  const filesystemMeasures = await client.pluginManager.get('filesystem-measures');
  

  client.stateManager.observe(async (schemaName, stateId) => {
    if (schemaName === 'participant') {
      const participant = await client.stateManager.attach(schemaName, stateId);

      participant.onDetach(() => {
        participants.delete(participant);
        $layout.requestUpdate();
      });

      let $packetFeedbackBang = null;

      participant.onUpdate(updates => {
        if (!$packetFeedbackBang) {
          const id = `#packet-feedback-${participant.get('slug')}`;
          $packetFeedbackBang = document.querySelector(id);
        }

        if (updates.annotationPacketSent) {
          $packetFeedbackBang.active = true;
        }

        $layout.requestUpdate();
      });

      participants.add(participant);
      $layout.requestUpdate();
    }
  });
  
  filesystemMedias.onUpdate(() => $layout.requestUpdate());
  filesystemMeasures.onUpdate(() => $layout.requestUpdate());
  

  $layout.addComponent({
    render() {
      const $panelTab = $layout.querySelector('sc-tab');
      const panelDisplayed = $panelTab.value;
      switch (panelDisplayed) {
        case 'monitoring': 
          return html`
            <sw-monitoring
              .project=${project}
              .globals=${globals}
              .filesystemMedias=${filesystemMedias}
              .participants=${participants}
            ></sw-monitoring>
          `
        case 'animation': 
          return html`
            <sw-anim
              .controller=${controller}
              .project=${project}
              .filesystemMedias=${filesystemMedias}
              .filesystemMeasures=${filesystemMeasures}
            ></sw-anim>
          `
        case 'graphs':
          return html`
            <sw-graph
              .controller=${controller}
              .project=${project}
              .filesystemMedias=${filesystemMedias}
              .filesystemMeasures=${filesystemMeasures}
            ></sw-graph>
          `
      }
    }
  });

  const $panelTab = document.querySelector('sc-tab');
  $panelTab.value = 'monitoring';

  // ...
  // $layout.addComponent(html`<h1>ok</h1>`);

  // setTimeout(() => {
  //   console.log($layout.querySelector('h1'));
  // }, 100);
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
