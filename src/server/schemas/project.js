export default {
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
  mediaType: {
    type: 'string',
    default: null,
    nullable: true,
  },
  annotationType: {
    type: 'string',
    default: null,
    nullable: true,
  },
  language: {
    type: 'string',
    default: 'fr',
  },
  tags: {
    type: 'any',
    default: null,
    nullable: true,
  },
}
