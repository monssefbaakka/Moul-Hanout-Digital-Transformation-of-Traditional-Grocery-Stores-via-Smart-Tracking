# 🧠 AGENTS.md — AI AGENT EXECUTION & GOVERNANCE GUIDE

---

# 🎯 1. PURPOSE

This document defines strict rules, standards, and workflows for all AI agents contributing to this project.

The goal is to ensure:
- Production-grade code quality
- Strong architecture consistency
- Long-term scalability
- Zero technical debt accumulation

⚠️ This is NOT a prototype.  
⚠️ This is a scalable system.

---

# 🏗️ 2. SYSTEM PHILOSOPHY

Core Principles:

1. Backend = Source of truth  
2. Frontend = Consumer only  
3. Shared layer = Contract between systems  
4. Database = Strictly controlled  
5. Architecture > Speed  

---

# 🧩 3. ARCHITECTURE RULES

## 3.1 Global Structure

/backend     → NestJS (domain modules)  
/frontend    → Next.js (UI layer only)  
/shared      → Types, DTOs, constants  

---

## 3.2 Backend (NestJS)

Mandatory pattern:

Controller → Service → Repository (Prisma)

Rules:

✔ Each domain must be isolated in its own module  
✔ Business logic ONLY inside services  
✔ Database access ONLY through Prisma  

❌ Forbidden:
- Calling another module’s service directly (without abstraction)
- Writing SQL outside Prisma
- Putting business logic in controllers

---

## 3.3 Frontend (Next.js)

✔ Only consumes backend APIs  
✔ Uses shared types  
✔ No duplicated business logic  

❌ Forbidden:
- Rewriting backend logic in frontend
- Creating duplicate types instead of using /shared

---

## 3.4 Shared Layer

Contains:
- DTOs
- Types
- Constants

👉 This is the SINGLE SOURCE OF TRUTH between frontend and backend

---

# 🔐 4. CODE STANDARDS

## 4.1 Naming

Good:
- getUserById
- calculateTotalPrice

Bad:
- fetchData
- handleStuff

---

## 4.2 Functions

- Must have a single responsibility  
- Maximum ~40 lines  
- Avoid deep nesting (> 2 levels)  

---

## 4.3 Constants

Use explicit constants:

const MAX_LOGIN_ATTEMPTS = 5

❌ No magic values allowed

---

## 4.4 Error Handling

✔ Always explicit  
✔ Use structured exceptions  

❌ Forbidden:
- Silent failures  
- Empty catch blocks  

---

# 🧪 5. DEFINITION OF DONE (DoD)

A task is complete ONLY if:

- [ ] Code compiles
- [ ] No TypeScript errors
- [ ] Lint passes
- [ ] No unused imports
- [ ] Logic tested manually
- [ ] API works correctly
- [ ] No console/runtime errors
- [ ] Architecture rules respected

---

# 🔍 6. CODE REVIEW SYSTEM (MANDATORY)

Every change MUST pass ALL checks below.

---

## 6.1 Architecture Review

- [ ] Respects module boundaries  
- [ ] No cross-module violations  
- [ ] No duplicated logic  
- [ ] Uses shared types correctly  

---

## 6.2 Backend Review

- [ ] Controller is thin  
- [ ] Service contains business logic  
- [ ] Prisma used properly  
- [ ] No direct DB hacks  

---

## 6.3 Frontend Review

- [ ] No business logic duplication  
- [ ] API usage is correct  
- [ ] Types imported from shared  

---

## 6.4 Code Quality

- [ ] Clear naming  
- [ ] Small functions  
- [ ] No magic values  
- [ ] Readable logic  

---

## 6.5 Performance

- [ ] No unnecessary DB queries  
- [ ] Pagination implemented where needed  
- [ ] No blocking operations  

---

## 6.6 Security

- [ ] No exposed secrets  
- [ ] Input validation present  
- [ ] Safe error handling  

---

## 6.7 Final Validation

- [ ] Feature works end-to-end  
- [ ] No regression introduced  

---

# ⚙️ 7. ENVIRONMENT & CONFIG RULES

All configuration MUST be environment-based.

Example:

DATABASE_URL=  
JWT_SECRET=  
KAFKA_BROKER=  

❌ Forbidden:
- Hardcoded secrets  
- Hardcoded URLs  

---

# 🔄 8. GIT WORKFLOW

## Branch Naming

feature/...  
fix/...  
refactor/...  

---

## Commit Format (STRICT)

feat: add product creation endpoint  
fix: resolve stock issue  
refactor: simplify auth module  

---

## Pull Request Requirements

Each PR MUST include:

- What was done  
- Why it was done  
- Impact  
- Screenshots (if UI-related)  

---

# 🚫 9. FORBIDDEN ACTIONS

Agents MUST NOT:

- Add unnecessary dependencies  
- Duplicate logic  
- Break existing APIs  
- Modify unrelated files  
- Push untested code  
- Ignore TypeScript errors  
- Bypass architecture  

---

# 🧠 10. DECISION FRAMEWORK

When unsure:

1. Choose simplicity  
2. Choose clarity  
3. Choose scalability  

---

# 📡 11. API DESIGN RULES

Standard response format:

{
  "success": true,
  "data": {},
  "error": null
}

✔ Consistent structure required  
✔ Follow REST conventions  

---

# 🗄️ 12. DATABASE RULES (PRISMA)

✔ Use migrations properly  
✔ Keep schema clean  

❌ Forbidden:
- Manual database edits  
- Uncontrolled raw SQL  

---

# ⚡ 13. PERFORMANCE RULES

- Avoid N+1 queries  
- Use pagination  
- Optimize heavy operations  

---

# 🧩 14. ASYNC / EVENTS (Kafka)

Events must be:

- Clearly named  
- Versionable  
- Idempotent  

---

# 📚 15. DOCUMENTATION RULES

Each feature MUST include:

- Short explanation  
- Usage example  

---

# 🤖 16. AI AGENT EXECUTION RULES

Agents MUST:

✔ Understand context BEFORE coding  
✔ Respect architecture ALWAYS  
✔ Make minimal and precise changes  

Agents MUST NOT:

❌ Guess missing requirements  
❌ Over-engineer  
❌ Introduce breaking changes  

---

# 🧨 17. GOLDEN RULE

If your code makes the system harder to understand,  
it is WRONG.

---

# 🧾 18. MANDATORY POST-TASK DOCUMENTATION OUTPUT

After completing ANY task, the AI agent MUST produce a documentation file before ending its response.

This is mandatory.

## 18.1 Output File Requirement

For every completed task, create a documentation file named using this format:

docs/task-[short-feature-name].md

Example:
- docs/task-auth-login-fix.md
- docs/task-products-module-update.md
- docs/task-ui-sidebar-standardization.md

---

## 18.2 Required Structure of the Documentation File

The documentation file MUST contain the following sections in this exact order:

# Task Documentation

## 1. What Was Done
Explain clearly what was implemented, fixed, changed, or improved.

This section must be written for an engineering student.
The explanation must be educational, clear, and structured.
Avoid vague wording.

Include:
- the task objective
- the problem that existed
- the implemented solution
- the final result

---

## 2. Detailed Audit
This section is mandatory and must be highly detailed.

Explain:
- every important action performed
- why each action was necessary
- what alternatives were considered if relevant
- why the chosen solution was preferred
- architecture choices
- technical constraints
- risks avoided
- files impacted
- logic that was preserved
- logic that was changed

This section must justify the agent’s decisions like an engineering audit trail.

---

## 3. Technical Choices and Reasoning
Explain the design and implementation choices.

Include:
- naming choices
- structural choices
- dependency decisions
- performance considerations
- maintainability considerations
- scalability considerations
- security considerations if relevant

---

## 4. Files Modified
List all created, updated, renamed, or deleted files.

Format:
- `path/to/file.ext` — short explanation of what changed

---

## 5. Validation and Checks
Document how the work was validated.

Include when applicable:
- build status
- lint status
- type-check status
- manual test status
- API validation
- UI validation
- regression check

If something could not be validated, state it explicitly.

---

## 6. Mermaid Diagrams
The documentation file MUST end with one or more Mermaid diagrams to help understanding.

Use diagrams when relevant, such as:
- flowchart
- sequenceDiagram
- classDiagram
- graph TD
- stateDiagram

The diagrams must explain:
- workflow
- architecture
- request/response flow
- module interaction
- before/after logic
- decision flow

At least one Mermaid diagram is required.

---

## 18.3 Commit Message Requirement

After generating the documentation file, the agent MUST also provide:

## Commit Message
A clean conventional commit message matching the work done.

Examples:
- feat: add post-task technical documentation workflow
- fix: resolve cashier sales submission issue in production
- refactor: standardize sidebar layout across dashboard pages

---

## 18.4 Quality Rules

The post-task documentation MUST be:
- precise
- technical
- educational
- structured
- understandable by an engineering student
- faithful to the real work done

The agent MUST NOT:
- invent actions that were not performed
- claim tests passed if they were not run
- hide uncertainties
- skip the audit section
- skip Mermaid diagrams
- skip the commit message

---

## 18.5 Completion Rule

A task is NOT fully complete until:
1. the implementation is finished
2. the documentation file is generated
3. the audit section is included
4. the Mermaid diagrams are included
5. the commit message is provided

---

---


# 🔥 FINAL NOTE

This project enforces:

- Discipline over speed  
- Structure over chaos  
- Quality over quantity  

All contributors and AI agents MUST follow this document strictly.