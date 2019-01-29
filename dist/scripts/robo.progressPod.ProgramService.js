(function() {
    'use strict';

    function ProgramService(){
        var self = this;
        self.getCompletedMilestonesCount = getCompletedMilestoneCount;

        function getCompletedMilestoneCount(program) {
            return program.milestones.filter(function(milestone) {
                return milestone.isComplete;
            }).length;
        }
    }

    angular
        .module('robo.progressPod')
        .service('ProgramService', ProgramService);
})();
