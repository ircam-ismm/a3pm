import '@soundworks/helpers/polyfills.js';
import { Server } from '@soundworks/core/server.js';

import { loadConfig } from '../utils/load-config.js';
import '../utils/catch-unhandled-errors.js';

import path from 'path';
import fs from 'fs';
import os from 'os';
import serveStatic from 'serve-static';
import compile from 'template-literal';
import JSON5 from 'json5';
import prompts from 'prompts';
import QRCode from 'qrcode';
import readline from 'readline';

import pluginPlatformInit from '@soundworks/plugin-platform-init/server.js';
import pluginSync from '@soundworks/plugin-sync/server.js';
import pluginLogger from '@soundworks/plugin-logger/server.js';
import pluginFilesystem from '@soundworks/plugin-filesystem/server.js'

import participantSchema from './schemas/participant.js';
import projectSchema from './schemas/project.js';
import globalsSchema from './schemas/globals.js';
import controllerSchema from './schemas/controller.js';


// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = loadConfig(process.env.ENV, import.meta.url);

let projectName = config.app.project;
const projectPath = path.join('projects', projectName);
const projectConfigPath = path.join(projectPath, 'config.json');
let projectConfig = null;
if (fs.existsSync(path.join(projectConfigPath))) {
  try {
    projectConfig = JSON5.parse(fs.readFileSync(projectConfigPath));
  } catch (err) {
    console.error(`[A3PM] Invalid config file "${projectConfigPath}" for project "${projectName}"`);
    throw err;
  }
} else {
  throw new Error(`[A3PM] no config file found for project "${projectName}", a config file should be located at "${projectConfigPath}"`);
}

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${process.env.ENV || 'default'}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

/**
 * Create the soundworks server
 */
const server = new Server(config);
// configure the server for usage within this application template
server.useDefaultApplicationTemplate();

/**
 * Register plugins and schemas
 */
// server.pluginManager.register('my-plugin', plugin);
// server.stateManager.registerSchema('my-schema', definition);

server.pluginManager.register('platform-init', pluginPlatformInit);
server.pluginManager.register('sync', pluginSync);
server.pluginManager.register('logger', pluginLogger, {
  dirname: path.join(projectPath, 'measures'),
});
server.pluginManager.register('filesystem-medias', pluginFilesystem, {
  dirname: path.join(projectPath, 'medias'),
  publicPath: 'medias',
});
server.pluginManager.register('filesystem-measures', pluginFilesystem, {
  dirname: path.join(projectPath, 'measures'),
  publicPath: 'measures',
});


server.stateManager.registerSchema('globals', globalsSchema);
server.stateManager.registerSchema('participant', participantSchema);
server.stateManager.registerSchema('project', projectSchema);
server.stateManager.registerSchema('controller', controllerSchema);

/**
 * Launch application (init plugins, http server, etc.)
 */
await server.start();

// and do your own stuff!



/////// KEEP THIS?
// if (projectName === undefined) {
//   const dirnames = fs.readdirSync('projects');
//   const projects = [];

//   dirnames.forEach(dir => {
//     const pathname = path.join('projects', dir);
//     if (fs.lstatSync(pathname).isDirectory()) {
//       projects.push(dir);
//     }
//   });

//   const { selectProject } = await prompts([
//     {
//       type: 'select',
//       name: 'selectProject',
//       message: 'Select a project',
//       choices: projects.map(project => {
//         return {
//           title: project,
//           value: project,
//         };
//       }),
//     },
//   ]);

//   projectName = selectProject;
// }

const useHttps = config.env.useHttps || false;
const protocol = useHttps ? 'https' : 'http';
const port = config.env.port;
const ifaces = os.networkInterfaces();
let address = null;

Object.keys(ifaces).forEach(dev => {
  ifaces[dev].forEach(details => {
    if (details.address !== '10.10.0.1' && address !== null) {
      return;
    }

    if (details.family === 'IPv4') {
      if (details.address === '10.10.0.1') {
        address = 'apps.ismm.ircam.fr';
      } else if (details.address !== '127.0.0.1') {
        address = details.address;
      }
    }
  });
});

const link = `${protocol}://${address}:${port}`;
const terminalQrCode = await QRCode.toString(link, { type: 'terminal', small: true });
console.log('> connect clients to:', link);
console.log('');
console.log(terminalQrCode);

const imageQrCode = await QRCode.toDataURL(link);


const globals = await server.stateManager.create('globals', {
  link: link,
  QRCode: imageQrCode,
});

const { tasks, ...globalConfig } = projectConfig;
const project = await server.stateManager.create('project', {
  ...globalConfig,
  folder: projectPath,
  numTasks: tasks.length,
});

tasks.forEach(task => {
  for (let key in task) {
    const projectValue = project.get(key);
    projectValue.push(task[key]);

    const toSet = {};
    toSet[key] = projectValue;
    project.set(toSet);
  }

  if (!('testRecording' in task)) {
    const projectValue = project.get('testRecording');
    projectValue.push(null);
    project.set({ testRecording: projectValue });
  }
});


// if for some reason, a participant reload we want to restore it's state
// according to its given name.
const participantStates = [];

// in an hook, check if participant name already exists
server.stateManager.registerUpdateHook('participant', updates => {
  if ('name' in updates) {
    const storedParticipant = participantStates.find(s => s.name === updates.name);

    if (storedParticipant) {
      return {
        ...updates,
        ...storedParticipant
      }
    }
  }
});

server.stateManager.observe(async (schemaName, stateId, nodeId) => {
  if (schemaName === 'participant') {
    const participant = await server.stateManager.attach(schemaName, stateId, nodeId);

    participant.onUpdate((updates) => {
      // we only store name, folder, tagsOrder, annotatedRecordings
      if (
        'name' in updates ||
        'folder' in updates ||
        'tagsOrder' in updates ||
        'annotatedRecordings' in updates ||
        'testDone' in updates
      ) {
        const index = participantStates.findIndex(s => s.name === participant.get('name'));

        // cherry pick values we want to store
        const {
          name,
          folder,
          tagsOrder,
          annotatedRecordings,
          testDone,
          currentTaskIndex
        } = participant.getValues();

        const values = {
          name,
          folder,
          tagsOrder,
          annotatedRecordings,
          testDone,
          currentTaskIndex
        };

        if (index !== -1) {
          participantStates[index] = values;
        } else {
          participantStates.push(values);
        }
      }
    });
  }
  if (schemaName === 'controller') {
    const controller = await server.stateManager.attach(schemaName, stateId, nodeId);

    controller.onUpdate(async updates => {
      if ('getGraphRequest' in updates) {
        const graphInfo = updates.getGraphRequest;

        let tagsOrder;
        let fileContent = fs.readFileSync(graphInfo.metasPath, { encoding: 'utf8' });
        fileContent = fileContent.replace(/\n/, '');
        tagsOrder = fileContent.split(': ')[1].split(','); // better remove space with regexp ?

        const parsedData = [];
        const rdMeasures = readline.createInterface({
          input: fs.createReadStream(graphInfo.measuresPath),
          output: process.stdout,
          console: false
        });

        for await (const line of rdMeasures) {
          parsedData.push(JSON.parse(line));
        }

        controller.set({parsedGraphData: {
          graphIdx: graphInfo.graphIdx, 
          tagsOrder,
          parsedData,
        }});
      }
      if ('getAnimationRequest' in updates) {
        const animData = updates.getAnimationRequest;

        for (let key in animData) {
          const value = animData[key];
          if (!(value.path.measures)) {
            delete animData[key];
          } else {
            // fetch tags order
            let fileContent = fs.readFileSync(value.path.metas, { encoding: 'utf8' });
            fileContent = fileContent.replace(/\n/, '');
            const tagsOrder = fileContent.split(': ')[1].split(','); // better remove space with regexp ?

            //fetch measures
            const parsed = [];

            const rdMeasures = readline.createInterface({
              input: fs.createReadStream(value.path.measures),
              output: process.stdout,
              console: false
            });

            for await (const line of rdMeasures) {
              parsed.push(JSON.parse(line));
            }

            animData[key].tagsOrder = tagsOrder;
            animData[key].data = parsed;
            animData[key].numPoints = parsed.length;
          }
        }


        controller.set({ parsedAnimData: animData });
      }
    });

  }
});
 

/*
const participants = await server.stateManager.getCollection('participant');

server.stateManager.onUpdateHook('project', (updates) => {
  // split in two command
  // - forceTaskIndex -> pass all participants on AnnotateIdle
  // - startTask (event)
  //    -> pass all particpants on AnnotateTask
  //    -> record start time
  //    -> send OSC message -> launch media (even if media is a person)

  if ('forceTaskIndex' in updates) {
    const currentTaskIndex = updates['forceTaskIndex'];
    const currentTaskIndexStartTime = syncPlugin.getSyncTime();

    participants.set({ currentTaskIndex, currentTaskIndexStartTime });

    // send OSC msg
  }
});
*/