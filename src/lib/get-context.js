// Helper to get the context of a node
export default node => {
    const parents = [];
    while (node.parent) {
        parents.push(node.parent);
        node = node.parent;
    }
    return parents;
};
