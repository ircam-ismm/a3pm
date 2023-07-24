import { LitElement, html, css } from 'lit';

class SwMonitoring extends LitElement {
  static properties = {
    participants: {
      type: 'any',
      default: null,
    },
    project: {
      type: 'any',
      default: null,
    },
    globals: {
      type: 'any',
      default: null,
    },
    filesystemMedias: {
      type: 'any',
      default: null,
    },
  }

  static styles = css`
    #qr-code {
      position: absolute;
      top: 38px; 
      right: 10px; 
      text-align: right;
    }  

    #left {
      width: 49%;
      float: left;
    }

    #right {
      width: 50%;
      float: right;
    }
  `;

  get participants() {
    return this._participants;
  }

  set participants(value) {
    this._participants = value;
  }

  constructor() {
    super();

    this.project = null;
    this.globals = null;
    this.filesystemMedias = null;
    this._participants = null;
  }

  requestUpdate() {
    super.requestUpdate();
  }

  render() {
    const participants = Array.from(this.participants).map(p => p.getValues());
    const project = this.project.getValues();

    return html`
      <div id="qr-code">
        <p style="font-size: 10px;">${this.globals.get('link')}</p>
        <img src="${this.globals.get('QRCode')}" />
      </div>

      <!-- project -->
      <div id="left">
        <h2># project config</h2>
        ${Object.keys(project).map(key => {
          return html`
            <p>
              <span style="display: inline-block; width: 100px;">${key}:</span>
              ${Array.isArray(project[key]) ?
                project[key].map(entry => html`
                  <p style="display: block; margin-left: 40px">${JSON.stringify(entry, null, 2)}</p>
                `) :
                html`${project[key]}`
              }
            </p>
          `;
        })}

        <h2># media files</h2>
        ${this.filesystemMedias.getTree().children.map(folder => {
          return html`
            <p>- &emsp; ${folder.url}</p>
            ${folder.children.map(file => {
            return html`
                <p>&emsp; &emsp; &emsp; &emsp;${file.name}</p>
              `
          })}
          `
        })}
      </div>

      <div id="right">
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
    `
  } 
}

customElements.define('sw-monitoring', SwMonitoring);