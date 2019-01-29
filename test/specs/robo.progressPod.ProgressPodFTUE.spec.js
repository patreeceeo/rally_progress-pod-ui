'use strict';

describe('ProgressPodFTUE', function(){
  var ProgressPodFTUE;
  beforeEach(module('robo.progressPod'));
  beforeEach(
    inject(function(
      _ProgressPodFTUE_
    ){
      ProgressPodFTUE = _ProgressPodFTUE_;
  }));

  it('constructs the correct key for milestoneActivity', function() {
    var syllabusId = 'asdf',
      milestone = 3,
      activity = 1;

    var expected = 'seen_syllabus_'+ syllabusId + '_milestone_' + milestone + '_activity_' + activity;

    expect(ProgressPodFTUE.SeenMilestoneActivity(syllabusId, milestone, activity)).toBe(expected);
  });

  it('constructs the correct key for milestone', function() {
    var syllabusId = 'asdf',
      milestone = 3;

    var expected = 'seen_syllabus_'+ syllabusId + '_milestone_' + milestone;

    expect(ProgressPodFTUE.SeenMilestone(syllabusId, milestone)).toBe(expected);
  });
});
