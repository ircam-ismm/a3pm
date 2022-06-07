import { AbstractExperience } from '@soundworks/core/server';
import fs from 'fs';

class PlayerExperience extends AbstractExperience {
  constructor(server, clientTypes, options = {}) {
    super(server, clientTypes);

    this.fileSystem = this.require('file-system');
  }

  start() {
    super.start();
  }

  enter(client) {
    super.enter(client);

    client.socket.addListener('filePath', async path => {
      console.log(path);
    });
  }

  exit(client) {
    super.exit(client);
  }
}

export default PlayerExperience;
