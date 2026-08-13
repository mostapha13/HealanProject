# Sprint 1 — Independent Identity, OTP and Daily Quota
## Delivered
- Independent TSEAI user store, roles and permissions.
- Iranian mobile normalization, OTP request/verify with Redis TTL, cooldown and attempt limit.
- JWT access token and rotating refresh tokens.
- User auto-provision on successful OTP and default `User` role.
- Admin/User/SuperAdmin seed and permission mapping.
- Daily question quota: guest=5, authenticated=50, configurable in SystemSetting.
- Redis atomic quota reservation with Tehran-day expiration; failed operations can release reservation.
- Admin settings API.
## Security notes
Production must replace `ConsoleSmsSender` with the organizational SMS provider and use strong secrets from Docker secrets/environment.
