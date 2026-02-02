# Security Policy

## Supported Versions

We actively support the following versions of WashWise with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it
responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to **security@washwise.io** with:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** (if you have one)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 7 days
- **Resolution Timeline**: We aim to resolve critical vulnerabilities within 30 days
- **Updates**: We will keep you informed of our progress

### Disclosure Policy

- We follow coordinated disclosure practices
- We will credit reporters in security advisories (unless anonymity is requested)
- We ask that you give us reasonable time to address issues before public disclosure

## Security Best Practices

### For Deployment

1. **Environment Variables**
   - Never commit secrets to version control
   - Use strong, unique passwords for all services
   - Rotate secrets regularly

2. **Database Security**
   - Use SSL/TLS for database connections
   - Enable connection pooling with limits
   - Regular backups with encryption

3. **API Security**
   - Enable rate limiting
   - Use HTTPS everywhere
   - Implement proper CORS policies

4. **Infrastructure**
   - Keep all dependencies updated
   - Use security groups/firewalls
   - Enable logging and monitoring

### For Development

1. **Code Review**
   - All changes require review
   - Security-sensitive changes need additional review

2. **Dependencies**
   - Regularly audit dependencies (`pnpm audit`)
   - Use Dependabot or similar for updates
   - Pin critical dependencies

3. **Testing**
   - Include security tests in CI/CD
   - Test for common vulnerabilities (OWASP Top 10)

## Security Features

WashWise implements the following security measures:

- **Authentication**: JWT-based with secure token rotation
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Input Validation**: Zod schema validation on all inputs
- **Rate Limiting**: Configurable rate limits per endpoint
- **Audit Logging**: Comprehensive audit trail
- **Multi-tenancy**: Strict tenant isolation

## Contact

For security concerns: **security@washwise.io**

For general questions: **team@washwise.io**
