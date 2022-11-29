import 'source-map-support/register';
import { Server } from '@soundworks/core/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import serveStatic from 'serve-static';
import compile from 'template-literal';
import JSON5 from 'json5';
import prompts from 'prompts';
import QRCode from 'qrcode';
// services
import pluginFileSystemFactory from '@soundworks/plugin-filesystem/server';
import pluginLoggerFactory from '@soundworks/plugin-logger/server';
// schemas
import participantSchema from './schemas/participant.js';
import projectSchema from './schemas/project.js';
import globalsSchema from './schemas/globals.js';
// experiences
import PlayerExperience from './PlayerExperience.js';
import ControllerExperience from './ControllerExperience.js';

import getConfig from '../utils/getConfig';
const ENV = process.env.ENV || 'default';
const config = getConfig(ENV);
const server = new Server();

// html template and static files (in most case, this should not be modified)
server.templateEngine = { compile };
server.templateDirectory = path.join('.build', 'server', 'tmpl');
server.router.use(serveStatic('public'));
server.router.use('build', serveStatic(path.join('.build', 'public')));
server.router.use('vendors', serveStatic(path.join('.vendors', 'public')));


  console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
  `);

(async function launch() {
  let projectName = config.app.project;

  // WARNING
  // in dev mode this does not work, you MUST provide a  project in application.json
  // for testing, just run `node .build/server/index.js`
  if (projectName === undefined) {
    const dirnames = fs.readdirSync('projects');
    const projects = [];

    dirnames.forEach(dir => {
      const pathname = path.join('projects', dir);
      if (fs.lstatSync(pathname).isDirectory()) {
        projects.push(dir);
      }
    });

    const { selectProject } = await prompts([
      {
        type: 'select',
        name: 'selectProject',
        message: 'Select a project',
        choices: projects.map(project => {
          return {
            title: project,
            value: project,
          };
        }),
      },
    ]);

    projectName = selectProject;
  }

  // get project config
  const projectPath = path.join('projects', projectName);
  const projectConfigPath = path.join(projectPath, 'config.json');
  let projectConfig = null;

  if (fs.existsSync(path.join(projectConfigPath))) {
    try {
      projectConfig = JSON5.parse(fs.readFileSync(projectConfigPath));
    } catch(err) {
      console.error(`[A3PM] Invalid config file "${projectConfigPath}" for project "${projectName}"`);
      throw err;
    }
  } else {
    throw new Error(`[A3PM] no config file found for project "${projectName}", a config file should be located at "${projectConfigPath}"`);
  }

  const useHttps = config.env.useHttps || false;
  const protocol = useHttps ? 'https' : 'http';
  const port = config.env.port;
  const ifaces = os.networkInterfaces();
  let address = null;

  Object.keys(ifaces).forEach(dev => {
    ifaces[dev].forEach(details => {
      if (address !== null) {
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

  // -------------------------------------------------------------------
  // register plugin
  // -------------------------------------------------------------------

  // @note - we can't add directories dynamically for now (would imply dynamic schemas too)
  // so parse
  server.pluginManager.register('file-system', pluginFileSystemFactory, {
    directories: [{
      name: 'medias',
      path: path.join(projectPath, 'medias'),
      publicDirectory: 'medias',
      watch: true,
    },{
      name: 'measures',
      path: path.join(projectPath, 'measures'),
      publicDirectory: 'measures',
      watch: true,
    }],
  });

  server.router.use('medias', serveStatic(path.join(projectPath, 'medias')));

  server.pluginManager.register('logger', pluginLoggerFactory, {
    directory: path.join(projectPath, 'measures'),
  });

  // -------------------------------------------------------------------
  // register schemas
  // -------------------------------------------------------------------
  server.stateManager.registerSchema('project', projectSchema);
  server.stateManager.registerSchema('participant', participantSchema);
  server.stateManager.registerSchema('globals', globalsSchema);

  try {
    // -------------------------------------------------------------------
    // launch application
    // -------------------------------------------------------------------

    await server.init(config, (clientType, config, httpRequest) => {
      return {
        clientType: clientType,
        app: {
          name: config.app.name,
          author: config.app.author,
        },
        env: {
          type: config.env.type,
          websockets: config.env.websockets,
          assetsDomain: config.env.assetsDomain,
        }
      };
    });

    const playerExperience = new PlayerExperience(server, 'player');
    const controllerExperience = new ControllerExperience(server, 'controller');

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

        participant.subscribe((updates) => {
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
    });

    await server.start();
    playerExperience.start();
    controllerExperience.start();

    const logger = server.pluginManager.get('logger');
    const overviewLogger = logger.create('overview.txt');

    const fileSystem = server.pluginManager.get('file-system');

  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
