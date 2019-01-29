function provideConfigService(moduleName) {
    var mockConfigService = {
        frontendConfigs: {
            avatarBucket: 'junkBucket',
            defaultAvatarBucket: 'junkDefaultAvatarBucket',
            defaultAvatarPath: 'junkDefaultAvatarPath',
            defaultS3BaseUrl: 'junkS3Url',
            googleAnalyticsId: 'junkAnalyticsId',
            isI18nEnabled: true
        },
        getFrontendConfigs: function() {
            return {
                then: function(callback){
                    return callback(mockConfigService.frontendConfigs);
                }
            };
        },
        invalidateCachedConfigs: function() {}
    };

    beforeEach(function() {
        module(moduleName, function($provide) {
            $provide.value('configService', mockConfigService);
        });
    });
}