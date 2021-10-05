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
  folder: {
    type: 'string',
    default: null,
    nullable: true,
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
};
