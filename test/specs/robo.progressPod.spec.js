'use strict';

describe('ProgressPodCtrl', function(){
  var $rootScope, $scope, $timeout, $q, ProgressPodEventTypes, generateMission, generateProgram, Fixtures, MissionRewardCoins;

  beforeEach(function() {
    generateMission = function(amount, dailyRequirement, completedWeeks, totalWeeks) {
      completedWeeks = completedWeeks || 0;
      totalWeeks = totalWeeks || 10;
      return {
        instance: {
          stats: {
            currentDay: {
              amount: amount
            },
            completedIntervals: completedWeeks
          }
        },
        mission: {
          successCriteria: {
            daily: dailyRequirement,
            numWeeks: totalWeeks
          }
        }
      };
    };
    generateProgram = function(completedMilestoneCount, totalMilestones, potentialRewards) {
      potentialRewards = potentialRewards || 0;
      var milestones = [];
      for (var i = 0; i < totalMilestones; i++) {
        milestones.push({
          name: 'Foobar_' + i
        });
      }
      for (var i = 0; i < completedMilestoneCount; i++) {
        milestones[i].isComplete = true;
      }
      return {
        completedMilestones: completedMilestoneCount,
        milestones: milestones,
        potentialRewards: potentialRewards
      };
    };
    Fixtures = {
      $scrollable: {
        getIndex: function() {
          return 2;
        },
        seekTo: function(){}
      }
    };
  });

  beforeEach(angular.mock.module(function ($provide) {
    $provide.value('MissionRewardCoins', {
      MissionPackCompletion: 555
    });
  }));

  beforeEach(module('robo.progressPod'));

  beforeEach(angular.mock.inject(function($controller, _$timeout_, _$q_, _$rootScope_, _MissionRewardCoins_, _ProgressPodEventTypes_){
    ProgressPodEventTypes = _ProgressPodEventTypes_;
    MissionRewardCoins = _MissionRewardCoins_;
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $scope.pod = {
      progressBar: {
        percentage: null
      },
      missions: [
        generateMission(10, 10),
        generateMission(0, 10),
        generateMission(10, 10)
      ],
    };
    $scope.getScrollable = jasmine.createSpy('getScrollable');
    $scope.getScrollable.and.returnValue($q.resolve(Fixtures.$scrollable));
    $timeout = _$timeout_;
    $controller('ProgressPodCtrl', {
      $scope: $scope,
      gettext: function(i) {return i;},
      gettextCatalog: {getString: function(i) {return i;}},
      TEMPLATEURLS: {}
    });
  }));

  it('should get the pod\'s card array', function() {
    var cards = [{id: 1}, {id: 2}, {id: 3}];
    var pod1 = {checklistTasks: cards};
    var pod2 = {missions: cards};
    var pod3 = {};
    expect($scope.getCardArray(pod1)).toEqual(cards);
    expect($scope.getCardArray(pod2)).toEqual(cards);
    expect($scope.getCardArray(pod3)).toEqual([1]);
  });

  it('should emit a completion event when last mission is completed', function() {
    spyOn($scope, 'getProgressBarPercentage').and.returnValue(1);
    spyOn($scope, '$emit');
    $rootScope.$broadcast(ProgressPodEventTypes.MissionCompletion);
    expect($scope.$emit).toHaveBeenCalledWith(ProgressPodEventTypes.MissionPackCompletion);
  });

  it('should not emit a completion event when some missions aren\'t finished', function() {
    spyOn($scope, 'getProgressBarPercentage').and.returnValue(0.5);
    spyOn($scope, '$emit');
    $rootScope.$broadcast(ProgressPodEventTypes.MissionCompletion);
    expect($scope.$emit).not.toHaveBeenCalled();
  });

  it('should emit an ScrollToNextMission event initially', function() {
    spyOn($scope, '$emit');
    $timeout.flush();
    expect($scope.$emit).toHaveBeenCalledWith(ProgressPodEventTypes.ScrollToNextMission);
  });

  it('should listen for ScrollToNextMission events', function() {
    spyOn($scope, 'getNextIncompleteMissionIndex').and.returnValue(3);
    spyOn(Fixtures.$scrollable, 'seekTo');
    $rootScope.$broadcast(ProgressPodEventTypes.ScrollToNextMission);
    $rootScope.$digest();

    expect($scope.getScrollable).toHaveBeenCalled();
    expect($scope.getNextIncompleteMissionIndex).toHaveBeenCalledWith(2);
    expect(Fixtures.$scrollable.seekTo).toHaveBeenCalledWith(3);
  });

  it('should not seekTo if all missions are complete', function() {
    spyOn($scope, 'getNextIncompleteMissionIndex').and.returnValue(-1);
    spyOn(Fixtures.$scrollable, 'seekTo');
    $rootScope.$broadcast(ProgressPodEventTypes.ScrollToNextMission);
    $rootScope.$digest();

    expect($scope.getScrollable).toHaveBeenCalled();
    expect($scope.getNextIncompleteMissionIndex).toHaveBeenCalledWith(2);
    expect(Fixtures.$scrollable.seekTo).not.toHaveBeenCalled();
  });

  it('should get the next daily incomplete mission', function() {
    $scope.pod.missions = [
      generateMission(10, 10),
      generateMission(0, 10),
      generateMission(0, 10),
      generateMission(10, 10),
    ];
    expect($scope.getNextIncompleteMissionIndex()).toBe(1);
    expect($scope.getNextIncompleteMissionIndex(1)).toBe(1);
    expect($scope.getNextIncompleteMissionIndex(2)).toBe(2);
    expect($scope.getNextIncompleteMissionIndex(3)).toBe(1);
    expect($scope.getNextIncompleteMissionIndex(9999)).toBe(1);
  });

  it('should return -1 if no incomplete missions found', function() {
    $scope.pod.missions = [
      generateMission(10, 10),
      generateMission(10, 10),
      generateMission(10, 10)
    ];

    expect($scope.getNextIncompleteMissionIndex()).toBe(-1);

    $scope.pod.missions = null;

    expect($scope.getNextIncompleteMissionIndex()).toBe(-1);
  });

  it('should get the correct completion coin total for mission packs', function() {
    $scope.pod.missions = [
      generateMission(0, 10),
      generateMission(0, 10),
      generateMission(10, 10)
    ];
    $scope.pod.program = null;
    expect($scope.getCompletionCoins()).toBe(MissionRewardCoins.MissionPackCompletion);
  });

  it('should get the correct completion coin total for programs', function() {
    $scope.pod.missions = null;
    $scope.pod.program = generateProgram(0, 10, 999);
    expect($scope.getCompletionCoins()).toBe(999);
  });

  it('should not return any coins if not a mission pack or program', function() {
    $scope.pod.missions = null;
    $scope.pod.program = null;
    expect($scope.getCompletionCoins()).toBe(null);
  });

  it('should return the progress percentage for missions', function() {
    $scope.pod.missions = [
      generateMission(0, 10, 5, 10),
      generateMission(0, 10, 6, 10),
      generateMission(0, 10, 3, 10)
    ];
    $scope.pod.program = null;
    expect($scope.getProgressBarPercentage()).toBe(14/30);

    $scope.pod.missions = [
      generateMission(0, 10, 10, 10),
      generateMission(0, 10, 10, 10),
      generateMission(0, 10, 10, 10)
    ];
    expect($scope.getProgressBarPercentage()).toBe(1);

    $scope.pod.missions = [
      generateMission(0, 10, 0, 10),
      generateMission(0, 10, 0, 10),
      generateMission(0, 10, 0, 10)
    ];
    expect($scope.getProgressBarPercentage()).toBe(0);
  });

  it('should return the progress percentage for programs', function() {
    $scope.pod.missions = null;
    $scope.pod.program = generateProgram(4, 10);
    expect($scope.getProgressBarPercentage()).toBe(4/10);

    $scope.pod.program = generateProgram(0, 10);
    expect($scope.getProgressBarPercentage()).toBe(0);

    $scope.pod.program = generateProgram(10, 10);
    expect($scope.getProgressBarPercentage()).toBe(1);
  });

  it('should return the progress percentage for non-program or mission packs', function() {
    $scope.pod.missions = null;
    $scope.pod.program = null;

    $scope.pod.progressBar.percentage = 0.4;
    expect($scope.pod.progressBar.percentage).toBe(0.4);
  });

  it('should set showCompleteProgressCircle to true when progress reaches 100%', function() {
    $timeout.flush();
    $scope.pod.missions = null;
    $scope.pod.program = null;
    $scope.pod.progressBar.percentage = 1;
    expect($scope.showCompleteProgressCircle).toBe(false);

    expect($scope.getProgressBarPercentage()).toBe(1);
    $timeout.flush();
    expect($scope.showCompleteProgressCircle).toBe(true);
  });

  it('should only set a $timeout once when progress reaches 100%', function() {
    $timeout.flush();
    $scope.pod.missions = null;
    $scope.pod.program = null;
    $scope.pod.progressBar.percentage = 1;

    $scope.getProgressBarPercentage();
    $timeout.flush();

    $scope.getProgressBarPercentage();
    $timeout.verifyNoPendingTasks();
  });

  it('should provide the an event label based on the program data, if available', function() {
    $scope.pod.program = {
      syllabusId: 'foo',
      nextRewardDescription: 'bar'
    };

    // dubbed "getProgramEventLabel" for lack of a better name...
    expect($scope.getProgramEventLabel()).toEqual(angular.toJson({
      syllabusId: 'foo',
      isIncentivized: true
    }));
  });

  it('should provide the mission pack event label if no program data is available', function() {
    $scope.missionPackEventLabel = 'foo';

    expect($scope.getProgramEventLabel()).toEqual('foo');
  });
});




