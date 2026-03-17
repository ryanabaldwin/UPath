# AI Coach API Contract

## Feature Flag

- AI coach endpoints are gated by `AI_COACH_ENABLED`.
- When disabled, endpoints return:
  - `503`
  - `{ "error": { "code": "AI_COACH_DISABLED", "message": "AI coach is currently unavailable" } }`

## Error Envelope

- Standard error format:
  - `{ "error": { "code": "SOME_CODE", "message": "Human readable message", "details": {} } }`

## Endpoints

### `POST /api/users/:id/ai/threads`

Request body:

```json
{
  "exploration_mode": "money-soon | helping-people | building | not-sure"
}
```

Success (`201`):

```json
{
  "thread_id": "uuid",
  "exploration_mode": "money-soon",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

Errors:

- `400` `INVALID_EXPLORATION_MODE`
- `404` `USER_NOT_FOUND`
- `503` `AI_COACH_DISABLED`

### `POST /api/users/:id/ai/threads/:threadId/messages`

Request body:

```json
{
  "message": "student message"
}
```

Success (`200`):

```json
{
  "thread_id": "uuid",
  "assistant_message": "coach reply",
  "updated_profile_json": {},
  "completeness": 40,
  "blocked": false
}
```

Errors:

- `400` `MESSAGE_REQUIRED`
- `400` `MESSAGE_TOO_LONG`
- `400` `AI_COACH_UNSAFE_INPUT` (`details.safe_response` contains safe fallback text)
- `404` `USER_NOT_FOUND`
- `404` `THREAD_NOT_FOUND`
- `429` `AI_COACH_RATE_LIMITED`
- `503` `AI_COACH_DISABLED`

### `GET /api/users/:id/profile`

Success (`200`) with existing profile:

```json
{
  "profile_json": {},
  "completeness": 60,
  "thread_id": "uuid",
  "has_profile": true
}
```

Success (`200`) with no profile:

```json
{
  "profile_json": {},
  "completeness": 0,
  "thread_id": null,
  "has_profile": false
}
```

Errors:

- `404` `USER_NOT_FOUND`
- `503` `AI_COACH_DISABLED`

### `PUT /api/users/:id/profile`

Request body:

```json
{
  "profile_json": {},
  "completeness": 75
}
```

Success (`200`):

```json
{
  "profile_json": {},
  "completeness": 75
}
```

Errors:

- `404` `USER_NOT_FOUND`
- `503` `AI_COACH_DISABLED`

## Acceptance Criteria

- Thread creation rejects invalid exploration mode values.
- Message endpoint enforces moderation and returns blocked-safe response metadata.
- Profile completeness updates after each accepted message.
- Payloads are persisted to `ai_chat_threads`, `ai_chat_messages`, and `student_profiles`.
- Message endpoint emits runtime metadata in `instrumentation_events` (`provider`, `model`, `retries`, `latency_ms`, `fallback_used`).
