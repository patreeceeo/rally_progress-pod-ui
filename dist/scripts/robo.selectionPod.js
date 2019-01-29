angular.module('robo.selectionPod', [])
    /**
     * Directive for readiness cards used in ftue + non-ftue readiness screens.
     * @example <div selection-pod="card" selected-property="isSelected" card-type="goals"></div>
     * @param {Object} selection-pod The health card object to render.
     * @param {String} selectedProperty The property on the health card to determine if selected, e.g. "isSelected" === readinessCard.isSelected
     * @param {String} cardType Specifies which layout to use on the card face, e.g. "goals" or "programs"
     */
    .directive('selectionPod', ["$timeout", "TEMPLATEURLS", function SelectionPod(
        $timeout,
        TEMPLATEURLS
    ) {
        return {
            templateUrl: TEMPLATEURLS.bowerPath + '/progress-pod-ui/dist/partials/selection-pod.html',
            scope: {
                card: '=selectionPod',
                cardType: '@',
                selectedProperty: '@'
            },
            controller: 'SelectionPodCtrl'
        };
    }])
    .controller('SelectionPodCtrl', ["$scope", "TopicColors", function(
        $scope,
        TopicColors
    ){
        $scope.topicColor = function(topic) {
            return TopicColors[topic];
        };
    }])
    .constant('TopicColors', {
        alcohol: '#D04F41',
        exercise: '#009AC4',
        mood: '#F79549',
        nicotineUse: '#289385',
        nutrition: '#289385',
        sleep: '#009AC4',
        stress: '#D04F41',
        weight: '#289385'
    });