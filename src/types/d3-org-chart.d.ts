declare module "d3-org-chart" {
  // Minimal chainable typing for the bits we use.
  export class OrgChart<T = unknown> {
    container(selector: string | HTMLElement): this;
    data(value: T[]): this;
    nodeWidth(fn: (d: unknown) => number): this;
    nodeHeight(fn: (d: unknown) => number): this;
    childrenMargin(fn: (d: unknown) => number): this;
    siblingsMargin(fn: (d: unknown) => number): this;
    compactMarginBetween(fn: (d: unknown) => number): this;
    neighbourMargin(fn: (a: unknown, b: unknown) => number): this;
    compact(value: boolean): this;
    initialExpandLevel(value: number): this;
    nodeContent(fn: (d: { data: T }, i: number, arr: unknown, state: unknown) => string): this;
    buttonContent(fn: (params: { node: { children?: unknown[]; data: { _directSubordinates?: number } }; state: unknown }) => string): this;
    nodeUpdate(fn: (d: unknown) => void): this;
    linkUpdate(fn: (d: unknown) => void): this;
    onNodeClick(fn: (d: unknown) => void): this;
    setActiveNodeCentered(value: boolean): this;
    svgWidth(value: number): this;
    // Secondary cross-links beyond the tree hierarchy (used to draw the extra
    // prerequisites, OR-alternatives, and corequisites a single-parent tree can't).
    connections(value: { from: string; to: string; label?: string }[]): this;
    connectionsUpdate(fn: (this: SVGPathElement, d: unknown, i: number, arr: unknown) => void): this;
    render(): this;
    fit(): this;
    expandAll(): this;
    collapseAll(): this;
  }
}
