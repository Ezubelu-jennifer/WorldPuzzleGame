declare module 'clipper-lib' {
  interface IntPoint {
    X: number;
    Y: number;
  }

  type Path = IntPoint[];
  type Paths = Path[];

  enum JoinType {
    jtSquare,
    jtRound,
    jtMiter
  }

  enum EndType {
    etClosedPolygon,
    etClosedLine,
    etOpenButt,
    etOpenSquare,
    etOpenRound
  }

  class ClipperOffset {
    constructor();
    AddPath(path: Path, joinType: JoinType, endType: EndType): void;
    Execute(solution: Paths, delta: number): void;
  }

  export {
    IntPoint,
    Path,
    Paths,
    JoinType,
    EndType,
    ClipperOffset
  };

  const _default: {
    Clipper: any;
    ClipperOffset: typeof ClipperOffset;
    JoinType: typeof JoinType;
    EndType: typeof EndType;
  };

  export default _default;
}