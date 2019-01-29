angular.module('robo.progressPod', [])
  .directive('progressPod', ["$q", "$timeout", "TEMPLATEURLS", function ProgressPod(
    $q,
    $timeout,
    TEMPLATEURLS
  ) {
    return {
      templateUrl: TEMPLATEURLS.bowerPath + '/progress-pod-ui/dist/partials/progress-pod.html',
      scope: {
        pod: '=progressPod',
        eventCategory: '=eventCategory'
      },
      link: function ($scope, element) {
        //Promise for getting access to jquery scrollable plugin.
        var scrollableDeferred = $q.defer();

        $scope.scrollNext508 = function() {
          $scope.getScrollable().then(function($scrollable) {
            $scrollable.next();
            element.find('.508ProgressPodPrevBtn').focus();
          });
        };

        $scope.scrollPrev508 = function() {
          $scope.getScrollable().then(function($scrollable) {
            $scrollable.prev();
            element.find('.508ProgressPodNextBtn').focus();
          });
        };

        /**
         * Gets a reference to the jQuery scrollable plugin.
         * @returns Promise.<Object> Returns a $scrollable reference.
         */
        $scope.getScrollable = function() {
          return scrollableDeferred.promise;
        };

        //Gets access to jQuery scrollable plugin.
        $timeout(function() {
          var $scrollable = element.find('.508ProgressPodScrollable').data('scrollable');
          scrollableDeferred.resolve($scrollable);
        });
      },
      controller: 'ProgressPodCtrl'
    };
  }])
  .controller('ProgressPodCtrl', ["$scope", "$timeout", "gettext", "gettextCatalog", "ProgressPodEventTypes", "ProgressPodTypes", "ProgramService", "safeInject", "TEMPLATEURLS", function(
    $scope,
    $timeout,
    gettext,
    gettextCatalog,
    ProgressPodEventTypes,
    ProgressPodTypes,
    ProgramService,
    safeInject,
    TEMPLATEURLS
  ){
    var MissionRewardCoins = safeInject('MissionRewardCoins');
    var isProgressBarComplete = false;

    $scope.getProgramEventLabel = function getProgramEventLabel() {
      var program = $scope.pod.program;
      return program ? angular.toJson({
        syllabusId: program.syllabusId,
        isIncentivized: Boolean(program.nextRewardDescription)
      }) : $scope.missionPackEventLabel;
    };

    if ($scope.pod.programOverview) {
      $scope.completionPercentText =
        $scope.pod.programOverview.rewardLabel + ': ' +
        $scope.pod.programOverview.rewardValueNow +
        ///e.g 30 of 100 items
        ' ' + gettextCatalog.getString('of') + ' ' +
        $scope.pod.programOverview.rewardValueMax;
    } else {
      $scope.completionPercentText = '';
    }

    $scope.missionPackEventLabel = 'MissionPack';
    $scope.changeGoalText = {
      title: gettext('Stop working on this goal?'),
      description: gettext("If you change your goal, you won't see your progress for this goal anymore. You won't lose any coins though, so don't worry about that."),
      confirm: gettext('Change Goal'),
      cancel: gettext('Keep Goal')
    };
    $scope.quitGoalText = {
      title: gettext('Stop working on this goal?'),
      description: gettext("If you quit this goal, you won't see your progress for this goal anymore. You won't lose any coins though, so don't worry about that."),
      confirm: gettext('Quit Goal'),
      cancel: gettext('Keep Goal')
    };
    $scope.bowerPath = TEMPLATEURLS.bowerPath;
    $scope.ProgressPodTypes = ProgressPodTypes;
    $scope.TEMPLATEURLS = TEMPLATEURLS;
    $scope.podState = {isInitialized: $scope.pod.type !== ProgressPodTypes.Program};

    if ($scope.pod.progressBar.extraBars) {
      $scope.multiBars = [{id: 1}, {id: 2}].slice(0, $scope.pod.progressBar.extraBars);
    }

    $scope.getCardArray = function(pod) {
      return pod.checklistTasks || pod.missions || [1];
    };

    $scope.quitGoal = function() {
      $scope.$emit(ProgressPodEventTypes.QuitGoal);
    };

    $scope.changeGoal = function() {
      $scope.$emit(ProgressPodEventTypes.ChangeGoal);
    };

    $scope.getProgressBarPercentage = function() {
      var value;
      if ($scope.pod.missions) {
        var completedWeeks = getMissionWeeksCompleted($scope.pod.missions);
        var totalWeeks = getMissionWeeksTotal($scope.pod.missions);
        value = completedWeeks / totalWeeks;
      } else if ($scope.pod.program && $scope.pod.program.milestones) {
        value = ProgramService.getCompletedMilestonesCount($scope.pod.program) / $scope.pod.program.milestones.length;
      } else {
        value = $scope.pod.progressBar.percentage;
      }

      if (value >= 1 && !isProgressBarComplete && !$scope.showCompleteProgressCircle) {
        isProgressBarComplete = true;
        $timeout(function() {
          $scope.showCompleteProgressCircle = true;
        }, 300);
      }

      return value;
    };

    $scope.getCompletionCoins = function() {
      if ($scope.pod.missions) {
        return MissionRewardCoins.MissionPackCompletion;
      } else if ($scope.pod.program) {
        return $scope.pod.program.potentialRewards;
      } else {
        return null;
      }
    };

    $scope.getSubtitleText = function() {
      if ($scope.pod.missions && $scope.pod.progressBar.extraBars) {
        return gettextCatalog.getPlural(
          $scope.pod.progressBar.extraBars,
          'Add 1 more Mission to reach your goal',
          'Add {{$count}} more Missions to reach your goal',
          {}
        );
      } else if ($scope.pod.missions) {
        var completedWeeks = getMissionWeeksCompleted($scope.pod.missions);
        var totalWeeks = getMissionWeeksTotal($scope.pod.missions);
        if (completedWeeks < totalWeeks) {
          return gettextCatalog.getPlural(completedWeeks, '1 Successful Week Complete', '{{$count}} Successful Weeks Complete', {});
        } else {
          return gettext('Goal Complete');
        }
      } else if ($scope.pod.program && $scope.pod.program.milestones) {
        ///e.g. 1 of 2
        var milestoneCountStr = ProgramService.getCompletedMilestonesCount($scope.pod.program) + ' ' +  gettextCatalog.getString('of') + ' ' + $scope.pod.program.milestones.length;
        ///e.g. 1 of 2 Milestones Complete
        return milestoneCountStr + ' ' + gettextCatalog.getString('Milestones Complete');
      } else {
        return $scope.pod.progressBar.subtitle;
      }
    };

    /**
     * Gets the index of the next mission that's incomplete for the day.
     * @param {Integer} [startIndex=0] Searches for missions starting from the provided index. Will loop back from 0 if none are found.
     * @return {Integer} Returns the index of the next incomplete mission, returns -1 if none found.
     */
    $scope.getNextIncompleteMissionIndex = function(startIndex) {
      startIndex = startIndex || 0;
      var podMissions = $scope.pod.missions || [];

      //Search for incomplete missions from the startIndex.
      for (var i = 0; i < podMissions.length; i++) {
        var index = (startIndex + i) % podMissions.length;
        var isDailyComplete = podMissions[index].instance.stats.currentDay.amount >= podMissions[index].mission.successCriteria.daily;
        if (!isDailyComplete) {
          return index;
        }
      }

      //If not found, return -1.
      return -1;
    };

    var getMissionWeeksTotal = function(missions) {
      return missions.reduce(function(total, missionData){
        return total + missionData.mission.successCriteria.numWeeks;
      }, 0);
    };
    var getMissionWeeksCompleted = function(missions) {
      return missions.reduce(function(total, missionData){
        return total + Math.min(missionData.instance.stats.completedIntervals, missionData.mission.successCriteria.numWeeks);
      }, 0);
    };

    $scope.showCompleteProgressCircle = $scope.getProgressBarPercentage() >= 1;

    $scope.$on(ProgressPodEventTypes.MissionCompletion, function() {
      if ($scope.getProgressBarPercentage() >= 1) {
        $scope.$emit(ProgressPodEventTypes.MissionPackCompletion);
      }
    });

    $scope.$on(ProgressPodEventTypes.ScrollToNextMission, function() {
      $scope.getScrollable().then(function($scrollable) {
        var index = $scrollable.getIndex();
        var nextIndex = $scope.getNextIncompleteMissionIndex(index);
        if (nextIndex !== -1) {
          $scrollable.seekTo(nextIndex);
        }
      });
    });

    if ($scope.pod.missions && $scope.pod.missions.length) {
      //Scrolls to the next daily incomplete mission on page load.
      $timeout(function() {
        $scope.$emit(ProgressPodEventTypes.ScrollToNextMission);
      }, 3000);
    }
  }])
//Injects optional dependencies with a fallback value if not available.
//This is so program manager can display the UI without importing all the business logic.
  .factory('safeInject', ["$injector", function($injector) {
    return function(serviceName, fallbackValue) {
      fallbackValue = fallbackValue !== undefined ? fallbackValue : {};
      try {
        return $injector.get(serviceName) || fallbackValue;
      } catch(err) {
        return fallbackValue;
      }
    };
  }])
  .constant('ProgressPodEventTypes', {
    QuitGoal: 'progressPodQuitGoal',
    ChangeGoal: 'progressPodChangeGoal',
    ScrollToNextIncompleteMission: 'progressPodScrollToNextIncompleteMission',
    ProgressBarCompletion: 'progressBarCompletion',
    MissionPackCompletion: 'missionPackCompletion',
    MissionCompletion: 'missionCompletion',
    ProgramCompletion: 'programCompletion'
  })
  .constant('ProgressPodTypes', {
    RallyAge: 'rallyAge',
    Mission: 'mission',
    Program: 'program',
    Checklist: 'checklist',
    Incentives: 'incentives',
    FinishSurvey: 'finishSurvey',
    GoalSignup: 'goalSignup',
    GoalCompletionSignup: 'goalCompletionSignup'
  });
