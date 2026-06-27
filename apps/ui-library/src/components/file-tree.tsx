import { FileCode, Folder } from "lucide-react";

export interface TreeNode {
  name: string;
  comment?: string;
  children?: TreeNode[];
}

function TreeRows({ nodes, depth }: { nodes: TreeNode[]; depth: number }) {
  return (
    <>
      {nodes.map((node) => {
        const isFolder = Array.isArray(node.children);
        return (
          <div key={`${depth}-${node.name}`}>
            <div
              className="flex items-center gap-2 py-1 text-sm"
              style={{ paddingLeft: `${depth * 1.25}rem` }}
            >
              {isFolder ? (
                <Folder className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileCode className="size-4 shrink-0 text-muted-foreground/70" />
              )}
              <span className="font-mono">{node.name}</span>
              {node.comment ? (
                <span className="text-xs text-muted-foreground">— {node.comment}</span>
              ) : null}
            </div>
            {node.children ? <TreeRows nodes={node.children} depth={depth + 1} /> : null}
          </div>
        );
      })}
    </>
  );
}

/** Renders a folder/file tree from nested data with icons and inline notes. */
export function FileTree({ tree }: { tree: TreeNode[] }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <TreeRows nodes={tree} depth={0} />
    </div>
  );
}
