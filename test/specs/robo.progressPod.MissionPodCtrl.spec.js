describe('MissionPodCtrl', function(){
    var $q, $scope, $timeout, Fixtures, MissionsApiService, MissionHelpers, ProgressPodEventTypes;

    beforeEach(module('robo.progressPod'));

    beforeEach(angular.mock.inject(function($controller, $injector, $rootScope, _$q_, _$timeout_, _ProgressPodEventTypes_){
        Fixtures = {
            mission: {
                data: {
                    mission: {
                        missionId: 'ind34',
                        successCriteria: {
                            daily: 5,
                            weekly: 5
                        }
                    },
                    instance: {
                        instanceId: 'asdf123',
                        stats: {
                            currentDay: { amount: 1 },
                            currentInterval: { completedDays: 5 }
                        },
                        previousCheckedInDate: moment().subtract({ hours: 23 }),
                        history: [
                            { startDate: moment().subtract({ hours: 24 }), completedDays: 5 },
                            { startDate: moment().subtract({ hours: 48 }), completedDays: 1 },
                            { startDate: moment().subtract({ hours: 72 }), completedDays: 6 },
                            { startDate: moment().subtract({ hours: 96 }), completedDays: 0 }
                        ]
                    }
                }
            },
            MissionRewardCoins: {
                FinalCompletion: 999,
                WeeklyCompletion: 333,
                DailyCompletion: 100
            }
        };
        $q = _$q_;
        $timeout = _$timeout_;
        ProgressPodEventTypes = _ProgressPodEventTypes_;
        MissionHelpers = jasmine.createSpyObj('MissionHelpers', ['isMissionComplete']);
        MissionsApiService = jasmine.createSpyObj('MissionsApiService', ['quitMission']);
        MissionHelpers.isMissionComplete.and.returnValue(false);
        MissionsApiService.quitMission.and.returnValue($q.when(Fixtures.data));
        spyOn($injector, 'get').and.callFake(function(serviceName) {
            switch (serviceName) {
                case 'MissionHelpers':
                    return MissionHelpers;
                case 'MissionsApiService':
                    return MissionsApiService;
                case 'MissionRewardCoins':
                    return Fixtures.MissionRewardCoins;
                default:
                    return null;
            }
        });

        $scope = $rootScope.$new();
        $scope.cardData = Fixtures.mission.data;
        $controller('MissionPodCtrl', {
            $scope: $scope,
            TEMPLATEURLS: {}
        });
    }));

     it('should determine the correct congratulatory state', function() {
        // whole mission complete
        MissionHelpers.isMissionComplete.and.returnValue(true);
        $scope.determineCongratulatoryState(Fixtures.mission.data);
        expect($scope.rewardCoins).toEqual(Fixtures.MissionRewardCoins.FinalCompletion);

        // weekly completion
        MissionHelpers.isMissionComplete.and.returnValue(false);
        $scope.determineCongratulatoryState(Fixtures.mission.data);
        expect($scope.rewardCoins).toEqual(Fixtures.MissionRewardCoins.WeeklyCompletion);

        // daily completion
        var dailyCompletionMission = JSON.parse(JSON.stringify(Fixtures.mission.data)); // non-mutating copy
        dailyCompletionMission.instance.stats.currentInterval.completedDays = 0;
        dailyCompletionMission.instance.stats.currentDay.amount = 5;
        $scope.determineCongratulatoryState(dailyCompletionMission);
        expect($scope.rewardCoins).toEqual(Fixtures.MissionRewardCoins.DailyCompletion);
    });

     it('should emit an event when mission is completed', function() {
        spyOn($scope, '$emit');
        // whole mission complete
        MissionHelpers.isMissionComplete.and.returnValue(true);
        expect($scope.isMissionComplete).toEqual(false);
        $scope.determineCongratulatoryState(Fixtures.mission.data);
        $timeout.flush();
        expect($scope.$emit).toHaveBeenCalledWith(ProgressPodEventTypes.MissionCompletion);
        expect($scope.isMissionComplete).toEqual(true);
    });

    it('should not emit an event when for weekly or daily completions', function() {
        spyOn($scope, '$emit');

         // weekly completion
        MissionHelpers.isMissionComplete.and.returnValue(false);
        $scope.determineCongratulatoryState(Fixtures.mission.data);
        $timeout.flush();
        expect($scope.$emit).not.toHaveBeenCalled();

        // daily completion
        var dailyCompletionMission = JSON.parse(JSON.stringify(Fixtures.mission.data)); // non-mutating copy
        dailyCompletionMission.instance.stats.currentInterval.completedDays = 0;
        dailyCompletionMission.instance.stats.currentDay.amount = 5;
        $scope.determineCongratulatoryState(dailyCompletionMission);
        $timeout.flush();
        expect($scope.$emit).not.toHaveBeenCalledWith(ProgressPodEventTypes.MissionCompletion);
    });

    it('should go to next mission after unflipping the reward state', function() {
        spyOn($scope, '$emit');
        $scope.showRewardBack = true;
        $scope.flipped = true;
        $scope.flip();
        $timeout.flush();
        expect($scope.$emit).toHaveBeenCalledWith(ProgressPodEventTypes.ScrollToNextMission);
    });

    it('should not go to next mission after unflipping regularly', function() {
        spyOn($scope, '$emit');
        $scope.showRewardBack = false;
        $scope.flipped = true;
        $scope.flip();
        $timeout.verifyNoPendingTasks();
        expect($scope.$emit).not.toHaveBeenCalledWith(ProgressPodEventTypes.ScrollToNextMission);

        $scope.showRewardBack = true;
        $scope.flipped = false;
        $scope.flip();
        $timeout.verifyNoPendingTasks();
        expect($scope.$emit).not.toHaveBeenCalledWith(ProgressPodEventTypes.ScrollToNextMission);
    });

    it('should correctly compile a history of completed weeks', function() {
        expect($scope.cardData.weeklyStats.length).toEqual(2);
    });

    it('should disable button and call missionsApiService.quitMission when scope.quitMission is called', function() {
        $scope.quitMission();
        expect($scope.quitButtonDisabled).toBe(true);
        expect(MissionsApiService.quitMission).toHaveBeenCalledWith(Fixtures.mission.data.instance.instanceId);
    });
});