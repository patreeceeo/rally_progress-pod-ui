describe('selectionPodCtrl', function(){
    var $rootScope, $scope, TopicColors;

        beforeEach(module('robo.selectionPod'));

        beforeEach(angular.mock.inject(function($controller, _$rootScope_, _TopicColors_){
            $rootScope = _$rootScope_;
            TopicColors = _TopicColors_;
            $scope = $rootScope.$new();
            $scope.pod = {
                topic: 'nicotineUse'
            };
            $controller('SelectionPodCtrl', {
                $scope: $scope,
                TEMPLATEURLS: {}
            });
        }));

    it('should select the correct topic color', function() {
        expect($scope.topicColor($scope.pod.topic)).toEqual(TopicColors['nicotineUse']);
    });

});