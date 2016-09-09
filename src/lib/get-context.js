// Helper to get the context of a node
export default node => {
    const parents = [];
    let testNode = node;

    while (testNode.parent) {
        parents.push(testNode.parent);
        testNode = testNode.parent;
    }
    return parents;
};
