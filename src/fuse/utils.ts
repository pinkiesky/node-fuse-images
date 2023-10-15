export class FUSEMode {
  static readonly S_IFDIR = 0o040000;
  static readonly S_IFREG = 0o100000;

  static readonly ALLOW_RWX = 0o7;
  static readonly ALLOW_RW = 0o6;
  static readonly ALLOW_R = 0o4;
  static readonly ALLOW_X = 0o1;
  static readonly ALLOW_RX = 0o5;
  static readonly ALLOW_NONE = 0o0;

  static directory(owner: number, group: number, other: number) {
    return FUSEMode.S_IFDIR | (owner << 6) | (group << 3) | other;
  }

  static file(owner: number, group: number, other: number) {
    return FUSEMode.S_IFREG | (owner << 6) | (group << 3) | other;
  }
}
