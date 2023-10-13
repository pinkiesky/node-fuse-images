export interface ObjectTreeNode {
  name: string;
  isLeaf: boolean;

  children(): Promise<ObjectTreeNode[]>;
}

export async function defaultPathResolver<T extends ObjectTreeNode>(
  rootNode: T,
  path: string[],
): Promise<T | null> {
  if (path.length === 0) {
    return rootNode;
  }

  if (rootNode.isLeaf) {
    throw new Error(`Cannot resolve path on leaf node: ${path}`);
  }

  const [next, ...rest] = path;
  const child = (await rootNode.children()).find(
    (child) => child.name === next,
  );

  if (!child) {
    return null;
  }

  return (await defaultPathResolver(child, rest)) as T;
}
