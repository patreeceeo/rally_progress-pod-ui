angular.module('robo.progressPod')
    .controller('ProgramPodCtrl', ["$q", "$scope", "$timeout", "ProgressPodEventTypes", "ProgressPodFTUE", "ProgramService", "safeInject", "TEMPLATEURLS", function(
        $q,
        $scope,
        $timeout,
        ProgressPodEventTypes,
        ProgressPodFTUE,
        ProgramService,
        safeInject,
        TEMPLATEURLS
    ){
        var FirstTimeExperienceApiService = safeInject('FirstTimeExperienceApiService', null);
        var FollowLinkService = safeInject('FollowLinkService');
        var forceFocus = safeInject('forceFocus', function(){});
        var gettext = safeInject('gettext', function(text){ return text; });

        var program = $scope.pod.program;

        $scope.uniqueId = $scope.pod.program.syllabusId;

        /**
         * Checks if a url is an external link. SSO links are considered external.
         * @param {String} url Url to test
         * @return {Boolean} True/false if external link.
         */
        $scope.isExternalLink = function(url) {
            return url.lastIndexOf('/sso/', 0) === 0 || url.lastIndexOf('http://', 0) === 0 || url.lastIndexOf('https://', 0) === 0;
        };

        /**
         * Go to provided url while also handling SSO's.
         * External links are opened in a new window.
         * @param {Object} $event Angular click event.
         * @param {String} url The url to go to.
         * @return {Promise.<null>} Returns the SSO promise if applicable.
         */
        $scope.followLink = function($event, url) {
            $event.preventDefault();
            var openInNewWindow = $scope.isExternalLink(url);
            return FollowLinkService.followLink(url, false, openInNewWindow, true, $scope.pod.program.card.logoUrl);
        };

        //Polyfill until the syllabus API is updated.
        $scope.getActivitiesCount = function(milestone) {
            return milestone.completionMinimum || milestone.numberOfActivities;
        };

        /**
         * Gets the current milestone, based on the completedMilestones variable.
         * If all the milestones are completed, returns the last one.
         * Appends completedActivityCount and milestoneIndex to the returned milestone.
         * @example getCurrentMilestone() //{description: 'Enroll & Welcome Session', numberOfActivities: 6, completedActivityCount: 3, milestoneIndex: 2}
         * @return {Object} Returns the milestone object.
         */
        $scope.getCurrentMilestone = function() {
            var milestoneIndex = Math.min(program.completedMilestones, program.milestones.length - 1);
            var milestone = program.milestones[milestoneIndex];
            milestone.completedActivityCount = $scope.getCompletedActivityCount(milestoneIndex);
            milestone.milestoneIndex = milestoneIndex;
            return milestone;
        };

        /**
         * Gets the completed activity count at a specified milestone index.
         * @param {Integer} milestoneIndex The index in the milestone array to query for.
         * @return {Integer} Returns the number of completed activities for that milestone.
         */
        $scope.getCompletedActivityCount = function(milestoneIndex) {
            if (program.completedMilestones > milestoneIndex) {
                //If the milestone is completed, then return the whole activity count.
                return $scope.getActivitiesCount(program.milestones[milestoneIndex]);
            } else if (program.completedMilestones === milestoneIndex){
                //If the milestone is in-progress, then return the current milestone's complete activity count.
                return program.completedMilestoneActivities;
            } else if (program.completedMilestones < milestoneIndex) {
                //If milestone is not started yet or out of bounds, then return 0.
                return 0;
            }
        };

        /**
         * Gets the completed activity count at a specified milestone index.
         * Gets the number of completed activities in a milestone
         * @param milestone specific mile stone to check the number of completed activities
         */
        $scope.getCompletedActivitiesCount = function() {
            var milestoneIndex = Math.min(program.completedMilestones, program.milestones.length - 1);
            var milestone = program.milestones[milestoneIndex];
            return milestone.activities.filter(function(activity) {
                return activity.isComplete;
            }).length;
        };

        /**
         * Reverts the mission card backside, from the congratulatory text to regular text.
         */
        $scope.revertCardBack = function() {
            $timeout(function() {
                $scope.showRewardBack = false;
            }, 500);
        };

        /**
         * Flips the mission card and force focuses the header text.
         * @param {Object} event Browser event to stop propagation of.
         */
        $scope.flip = function (event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            $scope.flipped = !$scope.flipped;

            //Set focus for tab-enabled users
            if ($scope.flipped) {
                forceFocus('goalPodBackHeaderText-' + $scope.uniqueId);
            } else {
                forceFocus('goalPodFrontHeaderText-' + $scope.uniqueId);
            }
        };

        /**
         * Sets up the card back to show reward details and flip the card.
         * @param {Integer} completeMilestoneCount Number of milestones that are complete.
         */
        $scope.showMilestoneCompletionRewardBack = function(completeMilestoneCount) {
            $scope.showRewardBack = true;
            $scope.milestoneRemaining = program.milestones.length - completeMilestoneCount;

            if ($scope.milestoneRemaining <= 0) {
                $scope.rewardTitle = gettext('Congratulations!');
                $scope.rewardDescription = gettext('You finished all your milestones!');
                $scope.rewardImgUrl = TEMPLATEURLS.bowerPath + '/progress-pod-ui/dist/img/Mission_Complete_icon.svg';
                $scope.$emit(ProgressPodEventTypes.ProgramCompletion);
            } else {
                $scope.rewardTitle = gettext('Great work!');
                $scope.rewardDescription = gettext('You completed your milestone.');
                $scope.rewardImgUrl = TEMPLATEURLS.bowerPath + '/progress-pod-ui/dist/img/Weekly_Complete_icon.svg';
            }

            if (!$scope.flipped) {
                $scope.flip();
            }
        };

        /**
         * Queries if the user has made progress since the last time they've seen the program.
         * @example checkLastSeenState().then(...) // {seenCurrentActivity: false, seenCurrentMilestone: true}
         * @return {Promise.<Object>} Returns a data object with true/false if they've seen the current activity or last milestone completion.
         */
        $scope.checkLastSeenState = function() {
            program.completedMilestones = ProgramService.getCompletedMilestonesCount(program);
            program.completedMilestoneActivities = $scope.getCompletedActivitiesCount();

            if (!FirstTimeExperienceApiService) {
                $scope.podState.isInitialized = true;
                return $q.reject();
            }

            var parseFtueRsp = function(rsp) {
                return rsp.data.success;
            };

            var seenActivityKey = ProgressPodFTUE.SeenMilestoneActivity(program.syllabusId, program.completedMilestones, program.completedMilestoneActivities);
            var seenMilestoneKey = ProgressPodFTUE.SeenMilestone(program.syllabusId, program.completedMilestones);

            //Checks if they've seen the current activity, if they're on the first activity then defaults to true.
            var seenActivityPromise;
            if (program.completedMilestoneActivities === 0) {
                seenActivityPromise = $q.when(true);
            } else {
                seenActivityPromise = FirstTimeExperienceApiService.exists(seenActivityKey).then(parseFtueRsp);
            }

            //Checks if they've seen the current milestone, if they're on the first milestone then defaults to true.
            var seenMilestonePromise;
            if (program.completedMilestones === 0) {
                seenMilestonePromise = $q.when(true);
            } else {
                seenMilestonePromise = FirstTimeExperienceApiService.exists(seenMilestoneKey).then(parseFtueRsp);
            }

            return $q.all([seenActivityPromise, seenMilestonePromise]).then(function(rspArray) {
                //Marks any unseen activity/milestone as seen.
                if (!rspArray[0]) {
                    FirstTimeExperienceApiService.consume(seenActivityKey);
                }
                if (!rspArray[1]) {
                    FirstTimeExperienceApiService.consume(seenMilestoneKey);
                }
                return {
                    seenCurrentActivity: rspArray[0],
                    seenCurrentMilestone: rspArray[1]
                };
            });
        };

        var startAnimation = function() {
            $scope.isAnimating = true;
            $timeout(function() {
                $scope.isAnimating = false;
            }, 2150);
        };

        $scope.startMilestoneCheckinAnimation = function() {
            var origCompletedMilestoneActivities = program.completedMilestoneActivities;
            //Start from last milestone, then animate to next one.
            program.completedMilestones--;
            //Sets complete activity count to previous milestone's activity count minus 1.
            program.completedMilestoneActivities = $scope.getActivitiesCount(program.milestones[program.completedMilestones]) - 1;

            //Animates the program back to the current state.
            $timeout(function() {
                program.completedMilestoneActivities++;
                startAnimation();
                $timeout(function() {
                    $scope.showMilestoneCompletionRewardBack(program.completedMilestones + 1);
                    $timeout(function() {
                        program.completedMilestones++;
                        program.completedMilestoneActivities = origCompletedMilestoneActivities;
                    }, 100);
                }, 2500);
            }, 3000);
        };

        $scope.startActivityCheckinAnimation = function() {
            //Start from last activty, then animate to next one.
            program.completedMilestoneActivities--;
            $timeout(function() {
                startAnimation();
                $timeout(function() {
                    program.completedMilestoneActivities++;
                }, 2500);
            }, 3000);
        };

        //Checks if the card needs to do a fake checkin for whatever milestone/activity they haven't seen before.
        $scope.init = function() {
            $scope.checkLastSeenState().then(function(lastSeenRsp){
                //If they haven't seen the current milestone, start from the previous milestone and animate.
                //Otherwise if they haven't seen the current activity, then start from the previous activity and animate.
                if (!lastSeenRsp.seenCurrentMilestone) {
                    $scope.startMilestoneCheckinAnimation();
                } else if (!lastSeenRsp.seenCurrentActivity) {
                    $scope.startActivityCheckinAnimation();
                }
            }).catch(function() {
                //Empty catch to fix unit test error.
            }).finally(function() {
                $scope.podState.isInitialized = true;
            });
        };

        $scope.init();
    }]);
