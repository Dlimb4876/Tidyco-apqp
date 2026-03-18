# Security Rules

## XSS Prevention
**Always use `esc()` for all user data in HTML strings.**

The `esc()` helper function from `helpers.js` prevents XSS attacks by escaping HTML entities.

**Correct**:
```javascript
html += `<div>${esc(userInput)}</div>`;
```

**Incorrect** (XSS vulnerability):
```javascript
html += `<div>${userInput}</div>`;
```

## Row-Level Security (RLS)
RLS in this project provides **authentication only**, not authorization:
- All authenticated users see all data
- **Never** filter Supabase queries by `user_id`
- New tables require this RLS policy:

```sql
CREATE POLICY "auth" ON table_name
FOR ALL
USING (auth.role() = 'authenticated');
```

**RLS = Authentication Gate**: Use it to verify the user is logged in, not to restrict data visibility.

## Authentication Pattern
- Supabase client lives in `core/js/auth.js`
- Use Supabase session state to verify authentication
- All data operations require an authenticated session

## Input Validation
- Validate all user input at system boundaries (forms, API responses)
- Don't trust external data — validate before storing or displaying
- Use `esc()` before rendering user input to HTML

## Sensitive Data
- Never log credentials, tokens, or API keys
- Environment variables (`.env`) are in `.gitignore` — don't check them in
- Be cautious with PII (personally identifiable information) in logs and responses

## API Safety
- Always use HTTPS (Supabase handles this automatically)
- Validate request data shape and type before processing
- Return only necessary data in responses; don't leak internal structures
