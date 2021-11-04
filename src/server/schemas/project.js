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
    type: 'any',
    nullable: true,
    default: [],
  },
  mediaFolder: {
    type: 'any',
    nullable: true,
    default: [],
  },
  annotationType: {
    type: 'any',
    nullable: true,
    default: [],
  },
  language: {
    type: 'string',
    default: 'fr',
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
