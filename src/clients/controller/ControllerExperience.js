import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class ControllerExperience extends AbstractExperience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;
    this.participants = new Set();

    this.fileSystem = this.require('file-system');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.project = await this.client.stateManager.attach('project');

    this.client.stateManager.observe(async (schemaName, stateId) => {
      if (schemaName === 'participant') {
        const participant = await this.client.stateManager.attach(schemaName, stateId);

        participant.onDetach(() => {
          this.participants.delete(participant);
          this.renderApp();
        });

        participant.subscribe(update => this.renderApp());

        this.participants.add(participant);
        this.renderApp();
      }
    });

    this.fileSystem.state.subscribe(() => this.renderApp());

    window.addEventListener('resize', () => this.renderApp());
    this.renderApp();
  }

  renderApp() {
    const medias = this.fileSystem.state.get('medias');
    const recordingsOverview = medias.children.map(leaf => leaf.url);
    const participants = Array.from(this.participants).map(p => p.getValues());
    const project = this.project.getValues();

    render(html`
      <h1 style="margin: 0; padding: 20px; background-color: #232323;">
        ${this.config.app.name} - ${this.project.get('name')}
      </h1>
      <div class="controller" style="padding: 20px;">
        <div style="width: 50%; float:left;">
          <h2># participants</h2>
          ${participants.map(participant => {
            return html`
              <div style="padding: 10px; margin: 0 20px 12px 0; background-color: #232323;">
              ${Object.keys(participant).map(key => {
                return html`
                  <p>
                    ${key}:
                    ${Array.isArray(participant[key]) ?
                      JSON.stringify(participant[key]) :
                      participant[key]
                    }
                  </p>`
              })}
              </div>
            `;
          })}
        </div>

        <div style="width: 50%; float:left;">
          <h2># project config</h2>
          ${Object.keys(project).map(key => {
            return html`<p>${key}: ${Array.isArray(project[key]) ?
              project[key].map(entry => html`
                <span style="display: block; margin-left: 40px">${JSON.stringify(entry)}</span>
              `) :
              html`${project[key]}`
            }</p>`
          })}

          <h2># media files</h2>
          ${recordingsOverview.map(filename => {
            return html`<p>- ${filename}</p>`
          })}
        </div>
      </div>
    `, this.$container);
  }
}

export default ControllerExperience;
