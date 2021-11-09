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


    // client.socket.addListener('sendFilename', async (filename) => {
    //   // const filepath = path.resolve(__dirname, '../../../projects', this.server.config.app.name,filename);
    //   this.svgBuilder = new WaveformSvgBuilder(this.server.config.app.project, 100, 100);
    //   await this.svgBuilder.loadFile(filename);
    //   client.socket.send('fileLoaded', 'file loaded', this.svgBuilder.getFileDuration());
    // });

    // client.socket.addListener('requestWaveform', async (...args) => {
    //   const [startTime, endTime] = args;
    //   this.svgBuilder.setTimeLimits(startTime, endTime);
    //   client.socket.send("sendWaveformLimits", this.svgBuilder.getWaveformLimits());
    // });
  }

  exit(client) {
    super.exit(client);
  }

}

// class WaveformSvgBuilder {
//   constructor(project, width, height) {
//     this.project = project;
//     this.width = width;
//     this.height = height;
//   }

//   async loadFile(filename) {
//     const filepath = path.resolve(__dirname, '../../projects', this.project, filename.slice(1));
//     const wavBuffer = await readFile(filepath);
//     this.wavData = nodeWav.decode(wavBuffer);

//     this.bufferDuration = this.wavData.channelData[0].length/this.wavData.sampleRate;
//     this.startTime = 0;
//     this.endTime = this.bufferDuration;
//   }

//   getFileDuration() {
//     return this.bufferDuration;
//   }

//   setTimeLimits(start, end) {
//     this.startTime = start;
//     this.endTime = end;
//   }

//   getWaveformLimits() {
//     const chan1 = this.wavData.channelData[0];
//     const chan2 = this.wavData.channelData[1];

//     const startIdx = this.startTime*this.wavData.sampleRate;
//     const endIdx = this.endTime*this.wavData.sampleRate;
//     const idxStep = Math.floor((endIdx-startIdx)/this.width);
    
//     const waveformLimits = [];
    
//     for (let pix = 0; pix < this.width; pix++) {
//       let sliceData1, sliceData2;
    
//       if (pix === this.width-1){
//         sliceData1 = chan1.slice(startIdx + pix*idxStep, endIdx);
//         sliceData2 = chan2.slice(startIdx + pix*idxStep, endIdx);
//       } else {
//         sliceData1 = chan1.slice(startIdx + pix*idxStep, startIdx + (pix+1)*idxStep);
//         sliceData2 = chan2.slice(startIdx + pix*idxStep, startIdx + (pix+1)*idxStep);
//       }

//       let min = 1;
//       let max = -1;

//       //get min/max of average
//       for (let i = 0; i<sliceData1.length; i++) {
//         const avg = (sliceData1[i] + sliceData2[i])/2;
//         if (avg < min) {
//           min = avg;
//         }
//         if (avg > max) {
//           max = avg;
//         }
//       }

//       waveformLimits.push([min, max]);
//     }

//     return waveformLimits;
//   }
// }

export default PlayerExperience;
