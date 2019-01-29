/**
 * Utility for tests using ApiService. Usage:
 *
 * ApiTestProvider.provideModules(); //Must occur before inject()
 *
 * beforeEach(inject(function (_ApiService_, _$httpBackend_) {
 *     ApiService = _ApiService_;
 *     $httpBackend = _$httpBackend_;
 *
 *     ApiTestProvider.provideHttp($httpBackend);
 * }));
 *
 */
var ApiTestProvider = {
    // Load all dependent modules
    provideModules: function() {
        beforeEach(module('ui.router'));
        beforeEach(module('robo.session'));
        beforeEach(module('ngCookies'));
        beforeEach(module('robo.constants'));
        beforeEach(module('config'));
        beforeEach(module('robo.ui-bootstrap'));
    },
    // Mock all standard http calls
    provideHttp: function($httpBackend) {
        $httpBackend.whenGET(new RegExp('/play/rest/i18n/localeCountryLanguage\\?disableCache=.*')).respond(200);
        $httpBackend.whenGET(new RegExp('/play/rest/config\\?disableCache=.*')).respond(200);
        $httpBackend.whenGET('/vendors/bower_components/robo-ui/dist/templates/typeahead-match.html').respond(200);
        $httpBackend.whenGET('/templates/typeahead/typeahead-match.html').respond(200);
        $httpBackend.whenGET('/vendors/bower_components/robo-ui/dist/templates/window.html').respond(200);
        $httpBackend.whenGET('/vendors/bower_components/robo-ui/dist/templates/backdrop.html').respond(200);
        $httpBackend.whenPOST('/play/rest/session').respond(200);
    }
};
