angular.module('robo.summaryProgramPod', [])
    .directive('summaryProgramPod', ["$timeout", "TEMPLATEURLS", function ProgressPod(
        $timeout,
        TEMPLATEURLS
    ) {
        return {
            templateUrl: TEMPLATEURLS.bowerPath + '/progress-pod-ui/dist/partials/summary-program-pod.html',
            scope: {
                program: '=program'
            }
        };
    }]);