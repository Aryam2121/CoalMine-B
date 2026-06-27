const EARTH_RADIUS_M = 6371000;

export const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
};

export const pointInZone = (lat, lon, zone) => {
  if (!zone?.center?.latitude || !zone?.center?.longitude) return false;
  const dist = haversineMeters(lat, lon, zone.center.latitude, zone.center.longitude);
  return dist <= (zone.radiusMeters || 100);
};

export const checkGeofenceViolations = (latitude, longitude, zones, userRole) => {
  const violations = [];
  for (const zone of zones) {
    if (!zone.active) continue;
    if (!pointInZone(latitude, longitude, zone)) continue;

    const authorized =
      !zone.requiresAuthorization ||
      (zone.authorizedRoles?.length && zone.authorizedRoles.includes(userRole));

    if (!authorized || zone.status === 'evacuation' || zone.status === 'closed') {
      violations.push({
        zoneId: zone._id,
        zoneName: zone.name,
        zoneType: zone.zoneType,
        status: zone.status,
        message: zone.alertMessage || `Unauthorized entry: ${zone.name}`,
      });
    }
  }
  return violations;
};

export default { haversineMeters, pointInZone, checkGeofenceViolations };
