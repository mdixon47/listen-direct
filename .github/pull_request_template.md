## Summary

- What changed?
- Why is it needed?

## Verification

- [ ] `npm run security:secrets`
- [ ] `npm audit --omit=dev --audit-level=high`
- [ ] `npm run build`
- [ ] Authentication and role boundaries were retested when relevant
- [ ] Privacy, retention, and consent impacts were reviewed when relevant
- [ ] No credentials, personal data, audio, or generated artifacts were committed

## Risk and rollback

Describe the security risk, deployment impact, and safe rollback path.
