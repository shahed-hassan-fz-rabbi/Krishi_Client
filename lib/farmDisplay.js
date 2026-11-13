export function farmHeaderContext(pathname, record, userId) {
  const match = /^\/my-farm\/([^/]+)\/?$/.exec(pathname || "");
  if (!match || ["new", "plan"].includes(match[1])) return { isFarm: false, districtCode: null };
  const current = userId && record?.userId === String(userId) && record?.farmId === match[1];
  return { isFarm: true, districtCode: current && ["cumilla", "chattogram"].includes(record.districtCode) ? record.districtCode : null };
}
