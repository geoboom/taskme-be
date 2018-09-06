const V_PENDING_ACCEPT = 'Pending accept';
const V_NOT_STARTED = 'Not started';
const V_IN_PROGRESS = 'In progress';
const V_PAUSED = 'Paused';
const V_COMPLETED = 'Completed';
const V_UNINVOLVED = 'Uninvolved';
const V_UNACCEPTED = 'Unaccepted';
const V_DROPPED = 'Dropped';
const V_REJECTED = 'Rejected';
const V_REMOVED = 'Removed';

// *--------------------------- Pending Accept -----------------------*
const E_ACCEPT = 'Accept';
const E_NO_RESPONSE = 'No response';
const E_REJECT = 'Reject';
const E_REMOVED = 'Removed';
// *--------------------------- Not Started -----------------------*
const E_START = 'Start';
const E_NO_PARTICIPATION = 'No participation';
const E_DROP = 'Drop';
// *--------------------------- In Progress -----------------------*
const E_PAUSE = 'Pause';
const E_TASK_END = 'Task end';
const E_MARK_COMPLETE = 'Mark complete';
// *--------------------------- Paused -----------------------*
const E_RESUME = 'Resume';
// *--------------------------- The rest -----------------------*
const E_ASSIGNED = 'Assigned';

const createVertex = (name, { s1, s2 }, deleteFlag = false) => ({
  [name]: {
    name,
    scores: { s1, s2 },
    deleteFlag,
  },
});
const createEdge = (from, to, name, userCanTrigger = false, leaderRequired = false) => ({
  from,
  to,
  name,
  userCanTrigger,
  leaderRequired,
});

const vertexSet = {
  ...createVertex(V_PENDING_ACCEPT, { s1: 1, s2: 1 }),
  ...createVertex(V_NOT_STARTED, { s1: 1, s2: 2 }),
  ...createVertex(V_IN_PROGRESS, { s1: 2, s2: 4 }),
  ...createVertex(V_PAUSED, { s1: 2, s2: 3 }),
  ...createVertex(V_COMPLETED, { s1: -1, s2: -1 }),
  ...createVertex(V_UNINVOLVED, { s1: -1, s2: -1 }, true),
  ...createVertex(V_UNACCEPTED, { s1: -1, s2: -1 }, true),
  ...createVertex(V_DROPPED, { s1: -1, s2: -1 }, true),
  ...createVertex(V_REJECTED, { s1: -1, s2: -1 }, true),
  ...createVertex(V_REMOVED, { s1: -1, s2: -1 }, true),
};

const vertexEndEdges = {};
vertexEndEdges[V_PENDING_ACCEPT] = E_NO_RESPONSE;
vertexEndEdges[V_NOT_STARTED] = E_NO_PARTICIPATION;
vertexEndEdges[V_IN_PROGRESS] = E_TASK_END;
vertexEndEdges[V_PAUSED] = E_TASK_END;

const edgeList = [
  // *--------------------------- Pending Accept -----------------------*
  createEdge(V_PENDING_ACCEPT, V_NOT_STARTED, E_ACCEPT, true),
  createEdge(V_PENDING_ACCEPT, V_UNACCEPTED, E_NO_RESPONSE),
  createEdge(V_PENDING_ACCEPT, V_REJECTED, E_REJECT, true),
  createEdge(V_PENDING_ACCEPT, V_REMOVED, E_REMOVED),
  // *--------------------------- Not Started -----------------------*
  createEdge(V_NOT_STARTED, V_IN_PROGRESS, E_START, true),
  createEdge(V_NOT_STARTED, V_UNINVOLVED, E_NO_PARTICIPATION),
  createEdge(V_NOT_STARTED, V_DROPPED, E_DROP, true),
  createEdge(V_NOT_STARTED, V_REMOVED, E_REMOVED),
  // *--------------------------- In Progress -----------------------*
  createEdge(V_IN_PROGRESS, V_REMOVED, E_REMOVED),
  createEdge(V_IN_PROGRESS, V_DROPPED, E_DROP, true),
  createEdge(V_IN_PROGRESS, V_PAUSED, E_PAUSE, true),
  createEdge(V_IN_PROGRESS, V_COMPLETED, E_TASK_END),
  createEdge(V_IN_PROGRESS, V_COMPLETED, E_MARK_COMPLETE, true, true),
  // *--------------------------- Paused -----------------------*
  createEdge(V_PAUSED, V_DROPPED, E_DROP, true),
  createEdge(V_PAUSED, V_REMOVED, E_REMOVED),
  createEdge(V_PAUSED, V_IN_PROGRESS, E_RESUME, true),
  createEdge(V_PAUSED, V_COMPLETED, E_TASK_END),
  // *--------------------------- Dropped -----------------------*
  createEdge(V_DROPPED, V_PENDING_ACCEPT, E_ASSIGNED),
  // *--------------------------- Removed -----------------------*
  createEdge(V_REMOVED, V_PENDING_ACCEPT, E_ASSIGNED),
  // *--------------------------- Rejected -----------------------*
  createEdge(V_REJECTED, V_PENDING_ACCEPT, E_ASSIGNED),
  // terminal vertices: Unaccepted, Uninvolved, Completed
];

module.exports = {
  V_PENDING_ACCEPT,
  V_NOT_STARTED,
  V_IN_PROGRESS,
  V_PAUSED,
  V_COMPLETED,
  E_REMOVED,
  E_MARK_COMPLETE,
  E_ASSIGNED,
  vertexSet,
  vertexEndEdges,
  edgeList,
};
