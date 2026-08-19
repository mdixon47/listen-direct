# Security Policy

## Supported version

Security fixes are applied to the latest code on the `main` branch. This repository currently represents a prototype, not a production service.

## Reporting a vulnerability

Do not disclose suspected vulnerabilities, credentials, personal data, or exploit details in a public issue.

Use GitHub private vulnerability reporting when it is enabled for the repository. Otherwise, contact the repository owner through a private channel and include:

- The affected route, component, or commit
- A concise impact statement
- Reproduction steps or a minimal proof of concept
- Any known workarounds

Please allow reasonable time for validation and remediation before public disclosure. Never test against systems, accounts, or data you do not own or have explicit permission to assess.

## Security scope

High-priority reports include authentication or authorization bypass, session compromise, exposed secrets, injection, cross-site scripting, sensitive voice-data disclosure, and unsafe dependency or workflow behavior.

The included demo accounts and simulated dashboard data are public development fixtures. They must not be reused as production identities or credentials.
