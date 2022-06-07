import { AbstractExperience } from '@soundworks/core/server';
import { readFile } from 'fs/promises';
const path = require('path');
const nodeWav = require('node-wav');



class PlayerExperience extends AbstractExperience {
  constructor(server, clientTypes, options = {}) {
    super(server, clientTypes);

    this.path = require('path');
    this.logger = this.require('logger');
    this.fileSystem = this.require('file-system');
  }

  start() {
    super.start();
  }

  enter(client) {
    super.enter(client);


    client.socket.addListener('sendFilename', async (...data) => {
      const [filename, width, height] = data;
      // const filepath = path.resolve(__dirname, '../../../projects', this.server.config.app.name,filename);
      this.svgBuilder = new WaveformSvgBuilder(this.server.config.app.project, width, height);
      await this.svgBuilder.loadFile(filename);
      client.socket.send('fileLoaded', 'file loaded', this.svgBuilder.getFileDuration());
    });

    client.socket.addListener('requestWaveform', async (...args) => {
      const [startTime, endTime] = args;
      this.svgBuilder.setTimeLimits(startTime, endTime);
      client.socket.send("sendWaveformLimits", this.svgBuilder.getWaveformLimits());
    });
  }

  exit(client) {
    super.exit(client);
  }

}

class WaveformSvgBuilder {
  constructor(project, width, height) {
    this.project = project;
    this.width = width;
    this.height = height;
  }

  async loadFile(filename) {
    const filepath = path.resolve(__dirname, '../../projects', this.project, filename.slice(1));
    const wavBuffer = await readFile(filepath);
    this.wavData = nodeWav.decode(wavBuffer);

    this.bufferDuration = this.wavData.channelData[0].length/this.wavData.sampleRate;
    this.startTime = 0;
    this.endTime = this.bufferDuration;
  }

  getFileDuration() {
    return this.bufferDuration;
  }

  setTimeLimits(start, end) {
    this.startTime = start;
    this.endTime = end;
  }

  ordinateToPix(y) {
    return (1 - y)*this.height/2;
  }

  getWaveformLimits() {
    const chan1 = this.wavData.channelData[0];
    const chan2 = this.wavData.channelData[1];

    //average and normalize
    let maxVal = 0;
    const avgBuffer = [];
    for (let i = 0; i < chan1.length; i++){
      const val1 = chan1[i];
      const val2 = chan2[i];
      const avg = (val1+val2)/2;
      if (maxVal < Math.abs(avg)) {
        maxVal = Math.abs(avg);
      }
      avgBuffer.push(avg);
    }
    const normBuffer = avgBuffer.map(val => {
      return val/maxVal;
    });

    const startIdx = this.startTime*this.wavData.sampleRate;
    const endIdx = this.endTime*this.wavData.sampleRate;
    const idxStep = Math.floor((endIdx-startIdx)/this.width);
    
    const waveformLimits = [];
    
    for (let pix = 0; pix < this.width; pix++) {
      let sliceData
    
      if (pix === this.width-1){
        sliceData = normBuffer.slice(startIdx + pix*idxStep, endIdx);
      } else {
        sliceData = normBuffer.slice(startIdx + pix*idxStep, startIdx + (pix+1)*idxStep);
      }

      let min = 1;
      let max = -1;

      //get min/max of average
      for (let i = 0; i<sliceData.length; i++) {
        const val = sliceData[i];
        if (val < min) {
          min = val;
        }
        if (val > max) {
          max = val;
        }
      }

      waveformLimits.push([this.ordinateToPix(min), this.ordinateToPix(max)]);
    }

    return waveformLimits;
  }
}

export default PlayerExperience;
