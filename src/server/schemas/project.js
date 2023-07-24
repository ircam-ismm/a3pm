export default {
  name: {
    type: 'string',
    nullable: true,
    default: null,
  },
  language: {
    type: 'string',
    default: 'fr',
  },
  folder: {
    type: 'string',
    nullable: true,
    default: null,
  },
  numTasks: {
    type: 'integer',
    nullable: true,
    default: null,
  },
  mediaType: {
    type: 'any',
    nullable: true,
    default: [],
  },
  mediaFolder: {
    type: 'any',
    nullable: true,
    default: [],
  },
  mediaOrder: {
    type: 'any',
    nullable: true,
    default: [],
  },
  annotationType: {
    type: 'any',
    nullable: true,
    default: [],
  },
  instruction: {
    type: 'any',
    nullable: true,
    default: [],
  },
  tags: {
    type: 'any',
    nullable: true,
    default: [],
  },
  testRecording: {
    type: 'any',
    nullable: true,
    default: [],
  },
}
