# Spottruck — Auth Flow

## Registration Flow

```
Empresa/Camionero              Frontend                 Backend
      │                           │                        │
      │──POST /auth/register──────▶│                        │
      │  {email, password, role}   │                        │
      │                           │──POST /auth/register────▶│
      │                           │  (bcrypt hash, save)    │
      │                           │◀──201 {accessToken,──────│
      │                           │         refreshToken,    │
      │                           │         user}           │
      │◀──201 {user, tokens}──────│                        │
      │                           │                        │
```

## Login Flow

```
User                 Frontend              Backend              Redis
  │                      │                    │                  │
  │──POST /auth/login──▶│                    │                  │
  │  {email, password}   │                    │                  │
  │                      │──POST /auth/login─▶│                  │
  │                      │                    │──bcrypt compare──▶│
  │                      │                    │◀──match──────────│
  │                      │                    │                  │
  │                      │◀──200 {tokens}────│                  │
  │◀──{accessToken}────│                    │                  │
  │                      │                    │                  │
```

## Authenticated Request

```
Frontend              Backend
  │                      │
  │──GET /trips─────────▶│
  │  Bearer {accessToken}│
  │                      │──jwt.verify──▶ OK
  │                      │──Prisma──▶ trips[]
  │◀──200 {data: trips}──│
  │                      │
```

## Token Refresh Flow

```
Frontend              Backend              Redis
  │                      │                   │
  │──POST /auth/refresh─▶│                   │
  │  {refreshToken}      │                   │
  │                      │──verify refresh──▶│
  │                      │◀──{userId, jti}───│
  │                      │                   │
  │                      │──rotate token────▶│
  │                      │──delete old──────▶│
  │                      │◀──{newTokens}────│
  │◀──200 {accessToken,  │                   │
  │         refreshToken} │                   │
  │                      │                   │
```

## Logout Flow

```
Frontend              Backend              Redis
  │                      │                   │
  │──POST /auth/logout──▶│                   │
  │  Bearer {accessToken}│                   │
  │                      │──jti from JWT────▶│
  │                      │──DEL refresh:*──▶│
  │                      │◀──OK──────────────│
  │◀──200 {success}──────│                   │
  │                      │                   │
  │ (clear localStorage)  │                   │
```
