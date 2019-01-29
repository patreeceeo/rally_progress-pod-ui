describe('ProgramPodCtrl', function() {
    var $q, $scope, $timeout, Fixtures, MissionHelpers, ProgressPodEventTypes, ProgramService;

    beforeEach(module('robo.progressPod'));

    beforeEach(angular.mock.inject(function ($controller, $injector, _$q_, $rootScope, _$timeout_, _ProgressPodEventTypes_, _ProgramService_) {
        Fixtures = {
            program: {
                syllabusId: 'foo1',
                completedMilestoneActivities: 2, //Number of activities completed for current milestone.
                milestones: [
                    {description: 'Enroll & Welcome Session', numberOfActivities: 6, activities: [{isComplete: false}]},
                    {description: 'Complete 9 Sessions', numberOfActivities: 3, activities: [{isComplete: false}]},
                    {description: 'Complete Something Else', numberOfActivities: 5, activities: [{isComplete: false}]}
                ]
            }
        };
        $q = _$q_;
        $timeout = _$timeout_;
        ProgramService = _ProgramService_;

        $scope = $rootScope.$new();
        $scope.pod = {program: Fixtures.program};
        $scope.podState = {isInitialized: false};
        $controller('ProgramPodCtrl', {
            $scope: $scope,
            TEMPLATEURLS: {},
            ProgramService: _ProgramService_
        });
    }));

    it('should get correct number of completed milestone', function() {
        Fixtures.program.milestones[0].isComplete = true;
        Fixtures.program.milestones[1].isComplete = true;
        Fixtures.program.milestones[2].isComplete = true;

        var expected = ProgramService.getCompletedMilestonesCount(Fixtures.program);
        expect(expected).toEqual(3);

        Fixtures.program.milestones[3] = {};
        Fixtures.program.milestones[3].isComplete = false;
        expected = ProgramService.getCompletedMilestonesCount(Fixtures.program);
        expect(expected).toEqual(3);

        Fixtures.program.milestones[3].isComplete = true;
        expected = ProgramService.getCompletedMilestonesCount(Fixtures.program);
        expect(expected).toEqual(4);
    });
});
