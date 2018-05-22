exports.assignmentStatuses = {
  'Pending Accept': {
    scores: {
      s1: 1,
      s2: 1,
    },
    taskEndActivity: 'No Response',
    incoming: [
      'Assigned',
    ],
    outgoing: [
      'Accept',
      'Reject',
      'Removed',
    ],
  },
  'Not Started': {
    scores: {
      s1: 1,
      s2: 2,
    },
    taskEndActivity: 'No Participation',
    incoming: [
      'Accept',
    ],
    outgoing: [
      'Start',
      'Drop',
      'Removed',
    ],
  },
  'In Progress': {
    scores: {
      s1: 2,
      s2: 4,
    },
    taskEndActivity: 'Task End',
    incoming: [
      'Start',
      'Resume',
    ],
    outgoing: [
      'Pause',
      'Task End',
      'Mark Complete',
      'Drop',
      'Removed',
    ],
  },
  Paused: {
    scores: {
      s1: 2,
      s2: 3,
    },
    taskEndActivity: 'Task End',
    incoming: [
      'Pause',
    ],
    outgoing: [
      'Resume',
      'Task End',
      'Drop',
      'Removed',
    ],
  },
  Completed: {
    incoming: [
      'Task End',
      'Mark Complete',
    ],
    outgoing: [
    ],
  },
  Uninvolved: {
    incoming: [
      'No Participation',
    ],
    outgoing: [
    ],
  },
  Unaccepted: {
    incoming: [
      'No Response',
    ],
    outgoing: [
    ],
  },
  Dropped: {
    incoming: [
      'Drop',
    ],
    outgoing: [
      'Assigned',
    ],
  },
  Rejected: {
    incoming: [
      'Reject',
    ],
    outgoing: [
      'Assigned',
    ],
  },
  Removed: {
    incoming: [
      'Removed',
    ],
    outgoing: [
      'Assigned',
    ],
  },
};

exports.allowedMemberActivities = [
  'Accept',
  'Start',
  'Pause',
  'Resume',
  'Drop',
  'Reject',
];
exports.softDelStatuses = [
  'Uninvolved',
  'Unaccepted',
  'Dropped',
  'Rejected',
  'Removed',
];
