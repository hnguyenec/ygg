module.exports = {
  name: 'resource-ui',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/resource/ui',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};