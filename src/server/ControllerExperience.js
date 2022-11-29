import { AbstractExperience } from '@soundworks/core/server';
import fs from 'fs';
import readline from 'readline';

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

    client.socket.addListener('filePath', async paths => {
      // console.log(path);
      // const fileContent = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
      // console.log(JSON.parse(fileContent));
      
      // fetch tags order
      let tagsOrder;
      const fileContent = fs.readFileSync(paths.metas, {encoding: 'utf8'});
      tagsOrder = fileContent.split(': ')[1].split(','); // better remove space with regexp ?


      // fetch measures
      const parsedData = [];

      var rdMeasures = readline.createInterface({
        input: fs.createReadStream(paths.measures),
        output: process.stdout,
        console: false
      });

      // rd.on('line', function (line) {
      //   parsedData.push(JSON.parse(line));
      // });

      for await (const line of rdMeasures) {
        parsedData.push(JSON.parse(line));
      }
    
      
      // console.log(parsedData);
      // setTimeout(() => console.log(parsedData), 1000);
      client.socket.send('parsedData', {
        tagsOrder,
        measures: parsedData
      });
    });
  }

  exit(client) {
    super.exit(client);
  }
}

export default PlayerExperience;
