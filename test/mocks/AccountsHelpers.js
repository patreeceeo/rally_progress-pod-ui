function AcceptSessionDeleteRequest($httpBackend){
    $httpBackend.when('DELETE', '/play/rest/session').respond(200, '');
}
