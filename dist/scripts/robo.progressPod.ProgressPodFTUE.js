(function() {
  'use strict';

  function ProgressPodFTUE() {
    return {
      SeenMilestoneActivity: function(syllabusId, milestoneIndex, activityIndex) {
          return 'seen_syllabus_'+ syllabusId + '_milestone_' + milestoneIndex + '_activity_' + activityIndex;
      },
      SeenMilestone: function(syllabusId, milestoneIndex) {
          return 'seen_syllabus_'+ syllabusId + '_milestone_' + milestoneIndex;
      }
  }};

  angular
    .module('robo.progressPod')
    .service('ProgressPodFTUE', ProgressPodFTUE);
})();
