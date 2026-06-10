import { isNullish, Base64 } from "./util";

export class FrameDetailsTree {
  private _core: any;

  constructor(frameDetails: any) {
    this._core = {
      ...frameDetails,
      byteGroups: null,
    };

    // Decode Base64
    for (const data_source of this._core.data_sources) {
      data_source.data = Base64.decode(data_source.data);
    }

    this._core.byteGroups = Object.freeze(this._parseByteGroups());
  }

  get sourceCount() {
    return this._core.data_sources.length;
  }

  get tree() {
    return this._core.tree;
  }

  get byteGroups() {
    return this._core.byteGroups;
  }

  getId(detail: any) {
    return detail?.field_info_ptr ?? null;
  }

  getSourceData(index: number) {
    return this._core.data_sources[index].data;
  }

  getSourceNames() {
    return this._core.data_sources.map(({ name }: any) => name);
  }

  getGroupsForSource(sourceIndex: number) {
    return this.byteGroups[sourceIndex];
  }

  private _parseByteGroups() {
    const length = this._core.data_sources.length;
    const groups: any[] = Array.from({ length }, () => []);

    const parseDetail = (detail: any) => {
      const { data_source_idx, start, length, tree, field_info_ptr } = detail;
      const id = field_info_ptr;

      if (!isNullish(data_source_idx) && !isNullish(start) && length) {
        groups[data_source_idx].push({ start, length, id });
      }

      tree.forEach(parseDetail);
    };

    this._core.tree.forEach(parseDetail);

    // sort start asc, length desc
    for (const group of groups) {
      group.sort((a: any, b: any) => a.start - b.start || b.length - a.length);
    }

    return groups;
  }
}
