describe('ProgramPodCtrl', function(){
    var $controller,
        $q, 
        $rootScope,
        $scope, 
        $timeout,
        FirstTimeExperienceApiService,
        Fixtures, 
        FollowLinkService,
        forceFocus,
        ProgressPodEventTypes, 
        ProgressPodFTUE,
        ProgramService,
        safeInject;

      Fixtures = {
        program: {
            syllabusId: 'foo1',
            name: 'Lose Weight',
            potentialRewards: 500,
            graphicUrl: '/img/missions/detailsBottomAligned/ind34.svg',
            completedMilestoneActivities: 2, //Number of activities completed for current milestone.
            completedMilestones: 0,
            milestones: [
                {description: 'Enroll & Welcome Session', numberOfActivities: 6, activities: [{isComplete: true}, {isComplete: true}]},
                {description: 'Complete 9 Sessions', numberOfActivities: 3, activities: [{isComplete: true}, {isComplete: true}]},
                {description: 'Complete Something Else', numberOfActivities: 5, activities: [{isComplete: true}, {isComplete: true}, {isComplete: true}, {isComplete: true}, {isComplete: true}]}
            ],
            card: {
                description: 'A Real Appeal Transformation Coach will help you set realistic weight loss goals and offer tools to help you stay on track for 52 weeks.',
                backgroundColor: 'EF5B4B',
                ctaUrl: '/sso/v1/zipongo',
                ctaText: 'Go To Real Appeal',
                logoUrl: 'https://image.ibb.co/bxL7t6/Real_Appeal_Logo.png'
            }
        }
    };

    beforeEach(module('robo.progressPod'));
    // $provide values for everything thats being safeInjected
    beforeEach(
      angular.mock.module(function($provide) {
        $provide.value('FirstTimeExperienceApiService', {
            exists: function(key){ return $q.when(true) },
            consume: function(){ return $q.when({}) }
        }),
        $provide.value('FollowLinkService', {
            followLink: function(){}
        }),
        $provide.factory('forceFocus', function() {
          return jasmine.createSpy('forceFocus')
        })
      })
    )
    beforeEach(angular.mock.inject(function(
      _$controller_, 
      _$q_, 
      _$rootScope_,
      _$timeout_,
      _FirstTimeExperienceApiService_,
      _FollowLinkService_,
      _forceFocus_,
      _ProgressPodEventTypes_, 
      _ProgressPodFTUE_,
      _ProgramService_,
      _safeInject_
    ){
        $controller = _$controller_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        FirstTimeExperienceApiService = _FirstTimeExperienceApiService_;
        FollowLinkService = _FollowLinkService_;
        forceFocus = _forceFocus_;
        ProgressPodEventTypes = _ProgressPodEventTypes_;
        ProgressPodFTUE = _ProgressPodFTUE_;
        ProgramService = _ProgramService_;
        safeInject = _safeInject_;
    }));

    var getCtrl = function() {
      $scope = $rootScope.$new();
  
      $scope.pod = {program: Fixtures.program};
      $scope.podState = {isInitialized: false};
      $controller('ProgramPodCtrl', {
          $q: $q,
          $scope: $scope,
          $timeout: $timeout,
          ProgressPodEventTypes: ProgressPodEventTypes,
          ProgressPodFTUE: ProgressPodFTUE,
          ProgramService: ProgramService,
          safeInject: safeInject,
          TEMPLATEURLS: {bowerPath: 'bower'}
        });
  
      $scope.$digest();
    }

    describe('isExternalLink', function() {
      it('should tell if link is external', function() {
        getCtrl();
        expect($scope.isExternalLink('http://google.com')).toEqual(true);
        expect($scope.isExternalLink('https://www.google.com')).toEqual(true);
        expect($scope.isExternalLink('/sso/v1/zipongo')).toEqual(true);
        expect($scope.isExternalLink('www.google.com')).toEqual(false);
        expect($scope.isExternalLink('/rewards')).toEqual(false);
        expect($scope.isExternalLink('foobar')).toEqual(false);
      })
    })

    describe('followLink', function() {
      it('should call followLink properly', function() {
        var event = {
          preventDefault: jasmine.createSpy('preventDefault')
        },
        url = 'www.asdf.com';
        getCtrl();
        spyOn(FollowLinkService, 'followLink');
        $scope.followLink(event, url);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(FollowLinkService.followLink).toHaveBeenCalledWith(url, false, false, true, Fixtures.program.card.logoUrl)
      });
    });

    describe('getActivitiesCount', function() {
      it('should return milestone.completionMin', function() {
        getCtrl();
        expect($scope.getActivitiesCount({completionMinimum: 3})).toBe(3);
      })

      it('should return milestone.numberOfActivities', function() {
        getCtrl();
        expect($scope.getActivitiesCount({numberOfActivities: 3})).toBe(3);
      })
    })

    describe('getCurrentMilestone', function() {
      it('should get the current milestone', function() {
        getCtrl();

        Fixtures.program.completedMilestones = 0;
        expect($scope.getCurrentMilestone()).toEqual(Fixtures.program.milestones[0]);
        Fixtures.program.milestones[0].isComplete = true;
        $scope.pod.program.milestones[0].isComplete = true;

        Fixtures.program.completedMilestones = 1;
        expect($scope.getCurrentMilestone()).toEqual(Fixtures.program.milestones[1]);
        Fixtures.program.milestones[1].isComplete = true;
        $scope.pod.program.milestones[1].isComplete = true;

        Fixtures.program.completedMilestones = 2;
        expect($scope.getCurrentMilestone()).toEqual(Fixtures.program.milestones[2]);
        Fixtures.program.milestones[2].isComplete = true;
        $scope.pod.program.milestones[2].isComplete = true;

        Fixtures.program.completedMilestones = 3;
        expect($scope.getCurrentMilestone()).toEqual(Fixtures.program.milestones[2]);
      });
    });

    describe('getCompletedActivityCount', function() {
      it('should get the completed activity count for a milestone', function() {
        getCtrl();
        Fixtures.program.completedMilestoneActivities = 2;
        Fixtures.program.completedMilestones = 0;

        expect($scope.getCompletedActivityCount(0)).toEqual(Fixtures.program.completedMilestoneActivities);
        expect($scope.getCompletedActivityCount(1)).toEqual(0);
        expect($scope.getCompletedActivityCount(2)).toEqual(0);

        Fixtures.program.milestones[0].isComplete = true;
        Fixtures.program.completedMilestones = 1;
        expect($scope.getCompletedActivityCount(0)).toEqual(Fixtures.program.milestones[0].numberOfActivities);
        expect($scope.getCompletedActivityCount(1)).toEqual(Fixtures.program.completedMilestoneActivities);
        expect($scope.getCompletedActivityCount(2)).toEqual(0);

        Fixtures.program.milestones[1].isComplete = true;
        Fixtures.program.milestones[2].isComplete = true;
        Fixtures.program.completedMilestones = 99;
        expect($scope.getCompletedActivityCount(0)).toEqual(Fixtures.program.milestones[0].numberOfActivities);
        expect($scope.getCompletedActivityCount(1)).toEqual(Fixtures.program.milestones[1].numberOfActivities);
        expect($scope.getCompletedActivityCount(2)).toEqual(Fixtures.program.milestones[2].numberOfActivities);
      });
    })

    describe('revertCardBack', function() {
      it('should set showRewardBack to false', function() {
        getCtrl();
        $scope.revertCardBack();
        $timeout.flush();
        $timeout.verifyNoPendingTasks();
        expect($scope.showRewardBack).toBe(false);
      });
    });

    describe('flip', function() {
      it('should flip $scope.flipped and call forceFocus on front', function() {
        var event = {
          preventDefault: jasmine.createSpy('preventDefault'),
          stopPropagation: jasmine.createSpy('stopPropagation')
        };
        getCtrl();
        $scope.flipped = true;  
        $scope.uniqueId = 'asdf';
        $scope.flip(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect($scope.flipped).toBe(false);
        expect(forceFocus).toHaveBeenCalledWith('goalPodFrontHeaderText-asdf');
      });

      it('should flip $scope.flipped and call forceFocus on back', function() {
        getCtrl();
        var event = {
          preventDefault: jasmine.createSpy('preventDefault'),
          stopPropagation: jasmine.createSpy('stopPropagation')
        };
        $scope.flipped = false;  
        $scope.uniqueId = 'asdf';
        $scope.flip(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect($scope.flipped).toBe(true);
        expect(forceFocus).toHaveBeenCalledWith('goalPodBackHeaderText-asdf');
      });
    });

    describe('showMilestoneCompletionRewardBack', function(){
      it('should emit a program completion event when all milestones are complete', function() {
        getCtrl();
        spyOn($scope, '$emit');
        $scope.showMilestoneCompletionRewardBack(Fixtures.program.milestones.length); 
        expect($scope.$emit).toHaveBeenCalledWith(ProgressPodEventTypes.ProgramCompletion);
        expect($scope.rewardTitle).toBe('Congratulations!');
        expect($scope.rewardDescription).toBe('You finished all your milestones!');
        expect($scope.rewardImgUrl).toBe('bower/progress-pod-ui/dist/img/Mission_Complete_icon.svg');
      });

      it('should not emit event when there are milestones remaining', function() {
        getCtrl();
        spyOn($scope, '$emit');
        $scope.showMilestoneCompletionRewardBack(1); 
        expect($scope.$emit).not.toHaveBeenCalled();
        expect($scope.rewardTitle).toBe('Great work!');
        expect($scope.rewardDescription).toBe('You completed your milestone.');
        expect($scope.rewardImgUrl).toBe('bower/progress-pod-ui/dist/img/Weekly_Complete_icon.svg');
      })

      it('should flip $scope.flipped', function() {
        $scope.flipped = false;
        $scope.showMilestoneCompletionRewardBack(1); 
        
        expect($scope.showRewardBack).toBe(true);
        expect($scope.milestoneRemaining).toBe(Fixtures.program.milestones.length - 1);
        expect($scope.flipped).toBe(true);
      });
    });

    describe('checkLastSeenState', function() {
      it('defaults to true when havent completed anything', function() {
        getCtrl();
        spyOn($scope, 'getCompletedActivitiesCount').and.returnValue(0);
        spyOn(ProgramService, 'getCompletedMilestonesCount').and.returnValue(0);
        var result = $scope.checkLastSeenState();
        $scope.$digest();

        result.then(function(lastSeenRsp) {
            expect(lastSeenRsp.seenCurrentMilestone).toBe(true);
            expect(lastSeenRsp.seenCurrentActivity).toBe(true);
            done();
        });
      });

      it('calls FirstTimeExperienceApiService properly ', function() {
        getCtrl();
        spyOn($scope, 'getCompletedActivitiesCount').and.returnValue(1);
        spyOn(ProgramService, 'getCompletedMilestonesCount').and.returnValue(1);
        spyOn(FirstTimeExperienceApiService, 'exists').and.returnValue($q.when({
          data: {
            success: false
          }
        }));
        spyOn(FirstTimeExperienceApiService, 'consume');

        var result = $scope.checkLastSeenState();
        $scope.$digest();

        expect(FirstTimeExperienceApiService.exists).toHaveBeenCalledWith('seen_syllabus_'+ Fixtures.program.syllabusId + '_milestone_1_activity_1');
        expect(FirstTimeExperienceApiService.exists).toHaveBeenCalledWith('seen_syllabus_'+ Fixtures.program.syllabusId + '_milestone_1');
        result.then(function(lastSeenRsp) {
          expect(FirstTimeExperienceApiService.consume).toHaveBeenCalledWith('seen_syllabus_'+ Fixtures.program.syllabusId + '_milestone_1_activity_1');
          expect(FirstTimeExperienceApiService.consume).toHaveBeenCalledWith('seen_syllabus_'+ Fixtures.program.syllabusId + '_milestone_1');
    
          expect(lastSeenRsp.seenCurrentMilestone).toBe(false);
          expect(lastSeenRsp.seenCurrentActivity).toBe(false);
          done();
        });
      });
    });
    describe('startMilestoneCheckinAnimation', function() {
      it('correctly stars the animation', function() {
        getCtrl();
        spyOn($scope, 'showMilestoneCompletionRewardBack');
        $scope.startMilestoneCheckinAnimation();
        $timeout.flush();
        expect($scope.isAnimating).toBe(true);
        $timeout.flush();
        expect($scope.isAnimating).toBe(false);
        $timeout.flush();
        $timeout.verifyNoPendingTasks();
        expect($scope.showMilestoneCompletionRewardBack).toHaveBeenCalled();
      });
    });

    describe('startActivityCheckinAnimation', function() {
      it('correctly stars the animation', function() {
        getCtrl();
        $scope.startActivityCheckinAnimation();
        $timeout.flush();
        expect($scope.isAnimating).toBe(true);
        $timeout.flush();
        expect($scope.isAnimating).toBe(false);
        $timeout.verifyNoPendingTasks();
      });
    });

    describe('init', function() {
      it('should start the appropiate animation based on last seen state', function() {
        getCtrl();

        spyOn($scope, 'startMilestoneCheckinAnimation');
        spyOn($scope, 'startActivityCheckinAnimation');
        spyOn($scope, 'checkLastSeenState');

        $scope.checkLastSeenState.and.returnValue($q.when({seenCurrentMilestone: true, seenCurrentActivity: true}));
        $scope.startMilestoneCheckinAnimation.calls.reset();
        $scope.startActivityCheckinAnimation.calls.reset();
        $scope.init();
        $scope.$digest();
        expect($scope.startMilestoneCheckinAnimation).not.toHaveBeenCalled();
        expect($scope.startActivityCheckinAnimation).not.toHaveBeenCalled();

        $scope.checkLastSeenState.and.returnValue($q.when({seenCurrentMilestone: false, seenCurrentActivity: true}));
        $scope.startMilestoneCheckinAnimation.calls.reset();
        $scope.startActivityCheckinAnimation.calls.reset();
        $scope.init();
        $scope.$digest();
        expect($scope.startMilestoneCheckinAnimation).toHaveBeenCalled();
        expect($scope.startActivityCheckinAnimation).not.toHaveBeenCalled();

        $scope.checkLastSeenState.and.returnValue($q.when({seenCurrentMilestone: true, seenCurrentActivity: false}));
        $scope.startMilestoneCheckinAnimation.calls.reset();
        $scope.startActivityCheckinAnimation.calls.reset();
        $scope.init();
        $scope.$digest();
        expect($scope.startMilestoneCheckinAnimation).not.toHaveBeenCalled();
        expect($scope.startActivityCheckinAnimation).toHaveBeenCalled();

        $scope.checkLastSeenState.and.returnValue($q.when({seenCurrentMilestone: false, seenCurrentActivity: false}));
        $scope.startMilestoneCheckinAnimation.calls.reset();
        $scope.startActivityCheckinAnimation.calls.reset();
        $scope.init();
        $scope.$digest();
        expect($scope.startMilestoneCheckinAnimation).toHaveBeenCalled();
        expect($scope.startActivityCheckinAnimation).not.toHaveBeenCalled();
      });
    }); 
});
