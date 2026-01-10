UPDATE Unit u
JOIN Project p ON p.id = u.projectId
SET u.tenantId = p.tenantId
WHERE (u.tenantId IS NULL OR u.tenantId = '')
  AND p.tenantId IS NOT NULL
  AND p.tenantId <> '';
