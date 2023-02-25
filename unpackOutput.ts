export function unpackOutput(out) {
  const unpacked = {};
  if (typeof out === "string") {
    const lines = out.split(/\n/ig).flatMap(s => {
      return s.split(/(?!:\w),\s/ig);
    });
    const keys = { i: null, p: null, w: null };
    let lastKey = null;
    for (const line of lines) {
      const splits = line.split(/=,?/, 2).filter(Boolean);
      if (splits.length) {
        const firstSplit = splits[0].trim();
        if (line.endsWith("=")) {
          lastKey = firstSplit;
          continue;
        }
        if (splits.length > 1) {
          const key = firstSplit;
          const secondSplit = splits[1].trim();
          if (key in keys) {
            keys[key] = secondSplit;
          } else {
            const { p, w } = keys;
            unpacked[p] = unpacked[p] || {};
            unpacked[p][w] = unpacked[p][w] || {};
            unpacked[p][w][key] = secondSplit;
          }
        } else {
          const { p, w } = keys;
          unpacked[p] = unpacked[p] || {};
          unpacked[p][w] = unpacked[p][w] || {};
          if (!!unpacked[p][w][lastKey]) {
            unpacked[p][w][lastKey] = [unpacked[p][w][lastKey], firstSplit];
          } else {
            unpacked[p][w][lastKey] = firstSplit;
          }
        }
      }
    }
  }
  return unpacked;
}
