export class ObjectTreeNode<V> {
  constructor(
    public name: string,
    public value?: V,
    public children: ObjectTreeNode<V>[] = [],
  ) {
  }

  get isLeaf(): boolean {
    return !!this.value;
  }

  resolvePath(path: string[]): ObjectTreeNode<V> | null {
    if (path.length === 0) {
      return this;
    }

    if (this.isLeaf) {
      throw new Error(`Cannot resolve path on leaf node: ${path}`);
    }

    const [next, ...rest] = path;
    const child = this.children!.find((child) => child.name === next);

    if (!child) {
      return null;
    }

    return child.resolvePath(rest);
  }
}

export class ObjectTreeNodeBuilder<V> {
  private readonly rootNode: ObjectTreeNode<V>;

  constructor(name: string) {
    this.rootNode = new ObjectTreeNode(name);
  }

  add(rawPath: string | string[], value: V): ObjectTreeNodeBuilder<V> {
    const path = Array.isArray(rawPath) ? rawPath : rawPath.split('/').filter(Boolean);

    let currentNode = this.rootNode;
    for (const part of path) {
      const child = currentNode.children.find((child) => child.name === part);
      if (child) {
        currentNode = child;
      } else {
        const newNode = new ObjectTreeNode<V>(part);

        currentNode.children.push(newNode);
        currentNode = newNode;
      }
    }

    currentNode.value = value;
    return this;
  }

  build(): ObjectTreeNode<V> {
    return this.rootNode;
  }
}
