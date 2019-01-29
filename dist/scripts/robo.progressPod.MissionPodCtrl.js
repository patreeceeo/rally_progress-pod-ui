angular.module('robo.progressPod')
    .controller('MissionPodCtrl', ["$q", "$scope", "$timeout", "ProgressPodEventTypes", "safeInject", "TEMPLATEURLS", function(
        $q,
        $scope,
        $timeout,
        ProgressPodEventTypes,
        safeInject,
        TEMPLATEURLS
    ){  
        var Coins = safeInject('Coins');
        var DeviceApiService = safeInject('DeviceApiService');
        var errorService = safeInject('errorService');
        var forceFocus = safeInject('forceFocus', function(){});
        var gettext = safeInject('gettext', function(text){ return text; });
        var MissionsApiService = safeInject('MissionsApiService');
        var MissionHelpers = safeInject('MissionHelpers');
        var MissionRewardCoins = safeInject('MissionRewardCoins');
        var openSyncModal = safeInject('openSyncModal', function(){});
        var deferredUpdatedInstance;

        var alreadySeenRewardBack = false;
        var canShowDailyCompletion = true;
        $scope.missionId = $scope.cardData.mission.missionId;
        $scope.showRewardBack = false;
        $scope.isAnimating = false;
        $scope.formValues = {};
        $scope.isMissionComplete = MissionHelpers.isMissionComplete($scope.cardData);

        /**
         * Sets up the congratulatory text when a day / week / 4 weeks cycle is completed.
         * @param {Object} mission The mission object.
         */
        $scope.determineCongratulatoryState = function(missionData) {
            var isCongratulatoryState = false;
            var is4WeekCompletion = false;

            var lastCheckin = missionData.instance.previousCheckedInDate || missionData.instance.stats.lastCheckinDate;
            $scope.currentIntervalHistory = missionData.instance.history.filter(function (interval) {
                var startDate = missionData.instance.previousCheckedInDate ? interval.startDate : moment(interval.startDate).subtract(1, 's');
                return moment(new Date(lastCheckin).toISOString()).isBefore(moment(interval.endDate).add(1, 's'))
                    && moment(new Date(lastCheckin).toISOString()).isAfter(startDate);
            });

            $scope.rewardCoins = null;

            if (MissionHelpers.isMissionComplete(missionData)
                && $scope.currentIntervalHistory[0].completedDays === missionData.mission.successCriteria.weekly) {
                //4 week completion
                isCongratulatoryState = true;
                is4WeekCompletion = true;
                $scope.rewardTitle = gettext('Mission Complete!');
                $scope.rewardDescription = gettext('Congratulations on making healthy changes for 4 weeks!');
                $scope.weeksRemaining = null;
                $scope.rewardImgUrl = TEMPLATEURLS.bowerPath + '/progress-pod-ui/dist/img/Mission_Complete_icon.svg';
                $scope.rewardCoins = MissionRewardCoins.FinalCompletion;
                startAnimation();
            } else if (!MissionHelpers.isMissionComplete(missionData)
                && missionData.instance.stats.currentInterval.completedDays === missionData.mission.successCriteria.weekly) {
                //weekly completion
                isCongratulatoryState = true;
                $scope.rewardTitle = gettext('Great work!');
                $scope.rewardDescription = gettext('You completed your mission for the week.');
                $scope.weeksRemaining = missionData.mission.successCriteria.numWeeks - missionData.instance.stats.completedIntervals;
                $scope.rewardImgUrl = TEMPLATEURLS.bowerPath + '/progress-pod-ui/dist/img/Weekly_Complete_icon.svg';
                $scope.rewardCoins = MissionRewardCoins.WeeklyCompletion;
                startAnimation();
            } else if (missionData.instance.stats.currentDay.amount >= missionData.mission.successCriteria.daily) {
                //daily completion
                $scope.rewardCoins = MissionRewardCoins.DailyCompletion;
                startAnimation();
                $timeout(function() {
                    $scope.$emit(ProgressPodEventTypes.ScrollToNextMission);
                }, 5000);
            } else {
                //Not completed
                updateInstance();
            }

            if (isCongratulatoryState && !alreadySeenRewardBack) {
                $scope.showRewardBack = true;
                alreadySeenRewardBack = true;

                $timeout(function() {
                    updateInstance();
                    if (!$scope.flipped) {
                        $scope.flip();
                    }
                    if (is4WeekCompletion) {
                        $scope.$emit(ProgressPodEventTypes.MissionCompletion);
                        $scope.isMissionComplete = true;
                    }
                }, 4000);
            }
        };

        var startAnimation = function() {
            $scope.isAnimating = true;
            $timeout(function() {
                $scope.isAnimating = false;
                updateInstance();
            }, 2150);
        };

        //Updates the mission instance using stored data.
        //Used for animation timing.
        var updateInstance = function() {
            if (deferredUpdatedInstance) {
                $scope.cardData.instance = deferredUpdatedInstance;
            }
        };

        $scope.replaceDashes = function(str) {
            return str.replace(/-/g, '/');
        };
        /**
         * Checks if the mission was completed for this day.
         * @return {Boolean} Returns true/false if the day was completed.
         */
        $scope.isDayComplete = function() {
            return $scope.cardData.instance.stats.currentDay.amount >= $scope.cardData.mission.successCriteria.daily;
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
                forceFocus('goalPodBackHeaderText-' + $scope.missionId);
            } else {
                forceFocus('goalPodFrontHeaderText-' + $scope.missionId);
                if ($scope.showRewardBack) {
                    $timeout(function() {
                        $scope.$emit(ProgressPodEventTypes.ScrollToNextMission);
                    }, 1300);
                }
            }
        };

        /**
         * Manual checkin for the mission card.
         * @param {String} instanceId Instance id of the mission.
         * @param {Number} checkInValue The amount to checkin, or 1/0 for boolean values.
         */
        $scope.checkInManual = function(instanceId, checkInValue) {
            $scope.isSyncing = true;
            forceFocus('goalPodSyncText-' + $scope.missionId);
            MissionHelpers.checkInManual(instanceId, checkInValue, new Date(),
                function(response) {
                    var isDayComplete = $scope.isDayComplete();
                    forceFocus('goalPodSyncCompleteText-' + $scope.missionId);
                    $scope.checkinAmount = response.data.instance.stats.currentDay.amount - $scope.cardData.instance.stats.currentDay.amount;
                    deferredUpdatedInstance = response.data.instance;
                    $scope.isSyncing = false;
                    if (isDayComplete) updateInstance();
                    $timeout(function() {
                        $scope.checkinAmount = null;
                        Coins.update();
                        if (!isDayComplete) {
                            $scope.determineCongratulatoryState(response.data);
                        }
                    }, 1000);
                },
                function() {
                    $scope.isSyncing = true;
                    $scope.errorStatus = gettext('Check In Failed');
                    forceFocus('goalPodSyncCompleteText-' + $scope.missionId);
                    $timeout(function() {
                        $scope.isSyncing = false;
                        $scope.errorStatus = null;
                    }, 8000);
                }
            );
            $scope.formValues.integerCheckinValue = null;
        };

        //Opens the sync help modal.
        $scope.openSyncModal = openSyncModal;

        /**
         * Device checkin for the mission card.
         * @param {String} instanceId Instance id of the mission.
         */
        $scope.syncDevice = function(instanceId) {
            $scope.isSyncing = true;
            forceFocus('goalPodSyncText-' + $scope.missionId);
            $q.all([MissionsApiService.deviceCheckIn(instanceId), DeviceApiService.getCurrentDevice()]).then(function(rspArray) {
                var checkinRsp = rspArray[0];
                var currentDevice = rspArray[1];
                $scope.isSyncing = false;
                forceFocus('goalPodSyncCompleteText-' + $scope.missionId);
                if (checkinRsp.data.status === 'success' && !!checkinRsp.data.missionResponse) {
                    var isDayComplete = $scope.isDayComplete();
                    $scope.checkinAmount = checkinRsp.data.missionResponse.instance.stats.currentDay.amount - $scope.cardData.instance.stats.currentDay.amount;
                    deferredUpdatedInstance = checkinRsp.data.missionResponse.instance;
                    if (isDayComplete) updateInstance();
                    $timeout(function() {
                        $scope.checkinAmount = null;
                        Coins.update();
                        if (!isDayComplete) {
                            $scope.determineCongratulatoryState(checkinRsp.data.missionResponse);
                        }
                    }, 1000);
                } else if (currentDevice) {
                    $scope.isSyncing = true;
                    $scope.errorStatus = gettext('No Distance Reported');
                    $timeout(function() {
                        $scope.isSyncing = false;
                        $scope.errorStatus = null;
                    }, 8000);
                } else {
                    //Sync's the mission after a device is successfully added.
                    //'mobileInterim' is the partner received if a mobile app email is sent instead. 
                    var syncDevice = function(rsp) {
                        if (rsp.partner !== 'mobileInterim') {
                            $scope.syncDevice();
                        }
                    };
                    //removes the device if they pick manual checkin
                    var removeDevice = function () {
                        var instanceId = $scope.cardData.instance.instanceId;

                        MissionsApiService.removeDevice(instanceId).then(function(response) {
                            $scope.cardData.instance.stats.dataSource = undefined;
                        }).catch(function(error) {
                            errorService.throwError(gettext('Unable to remove device, please try again later.'));
                        });
                    };

                    openDeviceModal(removeDevice, syncDevice, false);
                }
            }).catch(function() {
                $scope.isSyncing = true;
                $scope.errorStatus = gettext('Sync Failed');
                forceFocus('goalPodSyncCompleteText-' + $scope.missionId);
                $timeout(function() {
                    $scope.isSyncing = false;
                    $scope.errorStatus = null;
                }, 8000);
            });
        };
        $scope.pluralizeUnit = function(amount) {
            return MissionHelpers.pluralizeUnits(amount, $scope.cardData.mission.details.unit);
        };

        /**
         * Quit a mission via the card
         */
        $scope.quitMission = function () {
            var instanceId = $scope.cardData.instance.instanceId;
            $scope.quitButtonDisabled = true;
            MissionsApiService.quitMission(instanceId)
                .then(function () {
                    $scope.isHidden = true;
                })
                .catch(function () {
                    errorService.throwError(gettext('Could not quit the mission.'));
                })
                .finally(function(){
                    $scope.quitButtonDisabled = false;
                });
        };

        function weekSetup (history, criteria) {
            var weeklyStats = history.filter(function (h) {
                return h.completedDays >= criteria.weekly;
            });
            if (weeklyStats.length < criteria.numWeeks) {
                var currentWeek = history[history.length - 1];
                if (!weeklyStats.filter(function (week) { return week.startDate === currentWeek.startDate }).length) {
                    weeklyStats.push(currentWeek);
                }
                // future weeks
                for (var i = weeklyStats.length; i < criteria.numWeeks; i++) {
                    weeklyStats.push({'isEmpty': true});
                }
            }
            return weeklyStats;
        }

        $scope.cardData.weeklyStats = weekSetup($scope.cardData.instance.history, $scope.cardData.mission.successCriteria);
    }]);