# Codex Review Guidelines

## Review Scope — Recent Changes Mode
Review only changes introduced by the specific commit(s) or PR diff.
Do not flag pre-existing issues outside the diff.

## Review Scope — Full Repo Audit Mode
Review the entire codebase. Flag issues regardless of when they were introduced.
Sub-modes control what to look for (see below).

## Priority Levels
- **P0 - Critical**: Correctness bugs, security vulnerabilities, data loss risk, credential exposure
- **P1 - High**: Performance issues, broken error handling, missing input validation, XSS vectors
- **P2 - Medium**: Maintainability concerns, unclear logic, dead code, missing error boundaries
- **P3 - Low**: Style issues, minor naming inconsistencies, documentation gaps

## Output Format
When producing findings, structure each as follows:

**[P0] Short title of the issue**
File: `path/to/file.ext` - Line(s): 42-47
Explanation: One or two sentences describing the problem and its impact.
Suggested fix: Concrete recommendation or pseudocode if helpful.

## Default Behavior
- Flag P0 and P1 issues by default
- Flag P2 issues only if they relate to new code in the diff (recent mode) or are clearly impactful (audit mode)
- Do not flag P3 issues unless explicitly requested
- Do not suggest full rewrites — suggest targeted fixes

## Full Repo Audit Sub-Modes

### Full Review
Review for correctness, security, error handling, input validation, and architectural issues.
Cover all priority levels based on depth requested.

### Performance
Focus on:
- Unnecessary DOM manipulation or reflows
- Unoptimized data loading (sequential fetches that could be parallel)
- Missing timeouts on HTTP requests
- Synchronous file I/O in request handlers
- Large JSON parsing without streaming
- Missing caching opportunities

### Dead Code
Focus on:
- Unused functions, variables, and exports
- Unreachable code branches
- Orphaned files not referenced by any other file
- Duplicate logic (same function implemented in multiple places)
- Unused CSS classes and selectors
- Event listeners that are never triggered

## Project-Specific Rules

### Security
- Never log or expose authentication keys, passwords, or tokens in responses
- All endpoints accepting user input must validate and sanitize before use
- Cookie-based auth must use Secure and HttpOnly flags in production
- Shell command execution (`exec`, `child_process`) must never interpolate unsanitized user input
- CORS `Access-Control-Allow-Origin: *` on authenticated endpoints is a P0 finding
- Webhook signature verification must use constant-time comparison

### Server / Backend (Express, Node.js HTTP)
- All `exec()` calls must sanitize arguments — no string interpolation from request data
- File system operations must validate paths to prevent directory traversal
- JSON parsing must have error handling (try/catch around `JSON.parse`)
- HTTP request timeouts must be set on all outbound requests
- Server must handle SIGTERM/SIGINT for graceful shutdown

### Frontend (Vanilla JS, HTML, CSS)
- No inline event handlers in HTML — use addEventListener
- User-generated content rendered into DOM must be escaped (prevent XSS)
- External scripts must use integrity attributes where possible
- Responsive breakpoints must be tested (no hardcoded pixel values without media queries)
- localStorage/sessionStorage access must be wrapped in try/catch

### Data Integrity
- JSON data files must be written atomically (write to temp, then rename) or have error recovery
- Blog post CRUD operations must validate all required fields before write
- Category/subcategory operations must check for duplicates before creation
