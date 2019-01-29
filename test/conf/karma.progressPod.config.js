'use strict';

module.exports = function (config) {
    var sharedConfigModule = require('./karma.shared.config.js');
    var sharedConfig = sharedConfigModule(config);

    var profileFiles = [
        {pattern: 'app/scripts/*.js', included: true},
        {pattern: 'app/scripts/**/*.js', included: true},
        {pattern: 'test/specs/*.js'}
    ];

    sharedConfig.setConfig(profileFiles);

    return {
        files: profileFiles
    }
};
