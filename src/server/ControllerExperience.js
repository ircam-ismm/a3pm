import { AbstractExperience } from '@soundworks/core/server';
import fs from 'fs';
import readline from 'readline';
import { async } from 'regenerator-runtime';

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

    client.socket.addListener('getAnnotations', async data => {
      
      const readData = data;

      for (const key of Object.keys(data)) {
        const parsed = [];

        var rdMeasures = readline.createInterface({
          input: fs.createReadStream(data[key].path),
          output: process.stdout,
          console: false
        });

        

        for await (const line of rdMeasures) {
          parsed.push(JSON.parse(line));
        }

        readData[key].data = parsed;
        readData[key].numPoints = parsed.length;
      }

      client.socket.send('receiveDataAnim', readData);

    })

    client.socket.addListener('getGraph', async data => {
      // console.log(path);
      // const fileContent = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
      // console.log(JSON.parse(fileContent));
      
      // fetch tags order
      let tagsOrder;
      const fileContent = fs.readFileSync(data.filesPath.metas, {encoding: 'utf8'});
      tagsOrder = fileContent.split(': ')[1].split(','); // better remove space with regexp ?


      // fetch measures
      const parsedData = [];

      var rdMeasures = readline.createInterface({
        input: fs.createReadStream(data.filesPath.measures),
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
        graphId: data.graphId,
        tagsOrder,
        data: parsedData
      });
    });
  }

  exit(client) {
    super.exit(client);
  }
}

export default PlayerExperience;
