/* eslint-disable import/prefer-default-export */
const {
  vertexSet,
  edgeList,
} = require('../constants/assignmentGraph');

module.exports.getNextStatus = ({ status, isLeader }, activity, leaderStatus) => {
  const vStatus = vertexSet[status];
  const vLeaderStatus = vertexSet[leaderStatus];
  const edge = edgeList.find(e =>
    e.from === vStatus.name
    && e.name === activity
    && e.userCanTrigger
    && (isLeader ? true : !e.leaderRequired));

  if (edge) {
    const vDest = vertexSet[edge.to];
    const { name } = vDest;
    if (isLeader) return name;

    if (vDest.scores.s1 <= vLeaderStatus.scores.s1) {
      return name;
    }
  }
  return null;
};
