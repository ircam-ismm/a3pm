export default {
  name: {
    type: 'string',
    nullable: true,
    default: null,
  },
  folder: {
    type: 'string',
    nullable: true,
    default: null,
  },
  mediaType: {
    type: 'string',
    nullable: true,
    default: null,
  },
  annotationType: {
    type: 'string',
    nullable: true,
    default: null,
  },
  language: {
    type: 'string',
    default: 'fr',
  },
  instruction: {
    type: 'string',
    default: '',
  },
  tags: {
    type: 'any',
    nullable: true,
    default: null,
  },
  testRecording: {
    type: 'string',
    nullable: true,
    default: null,
  },
}
