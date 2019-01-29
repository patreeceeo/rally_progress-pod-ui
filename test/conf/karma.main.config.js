//Import your test modules here.
var progressPodModule = require('./karma.progressPod.config.js'),
    sharedConfigModule = require('./karma.shared.config.js');

module.exports = function (config) {
    var profile = progressPodModule(config),
        sharedConfigs = sharedConfigModule(config);

    var files = sharedConfigs.files.concat(
        profile.files
    );

    config.set({
        basePath: sharedConfigs.basePath,
        frameworks: sharedConfigs.frameworks,
        files: files,
        reporters: ['progress', 'coverage', 'html'],
        preprocessors: {
            'app/**/*.js': ['coverage']
        },
        coverageReporter: {
            type: 'html',
            dir: 'test/coverage'
        },
        htmlReporter: {
            outputFile: 'test/units.html'
        }
    });
};
