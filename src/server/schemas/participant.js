export default {
  state: {
    type: 'string',
    default: null,
    nullable: true,
  },
  name: {
    type: 'string',
    default: null,
    nullable: true,
  },
  slug: {
    type: 'string',
    default: null,
    nullable: true,
  },
  folder: {
    type: 'string',
    default: null,
    nullable: true,
  },
  currentTaskIndex: {
    type: 'integer',
    default: 0,
  },
  tagsOrder: {
    type: 'any',
    default: null,
    nullable: true,
  },
  recording: {
    type: 'string',
    default: null,
    nullable: true,
  },
  annotatedRecordings: {
    type: 'any',
    default : [],
  },
  testDone: {
    type: 'boolean',
    default: false,
  },
  testing: {
    type: 'boolean',
    default: false,
  },
  annotationPacketSent: {
    type: 'boolean',
    event: true,
  },
};
