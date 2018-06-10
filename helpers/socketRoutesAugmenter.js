module.exports.convertPathsToLeafs = (root, paths) => {
  const augmented = [];
  paths.forEach(path => {
    augmented.push({
      ...path,
      path: {
        root: root,
        path: root + path.path,
      }
    });
  });

  return augmented;
};

module.exports.prependRootToLeafs = (root, leafs) => {
  const newLeafs = [];
  leafs.forEach(leaf => {
    newLeafs.push({
      ...leaf,
      path: {
        path: root + leaf.path.path,
        root: root + leaf.path.root,
      },
    });
  });

  return newLeafs;
};
