# ADR 001: Migration to Modular Monolith Architecture

## Status
Accepted

## Context
The project initially followed a flat, organic file structure. As features (game engines, room management, auth) grew, this led to:
- **Spaghetti Dependencies:** Circular imports between services and socket handlers.
- **Cognitive Load:** High difficulty for onboarding new developers (or self) due to unclear boundaries.
- **Fragility:** Adding new game engines required touching multiple core service files.
- **Risk:** Security/Auth logic was tightly coupled with business logic, making it hard to enforce constraints.

## Decision
We migrated the backend to a **Modular Monolith** architecture.
- **Domain Modules:** Logic is partitioned into `modules/` (auth, room, game), each with its own routes, controllers, services, and socket handlers.
- **Encapsulation:** Modules communicate only through public barrel exports (`index.ts`).
- **Infrastructure Layer:** Cross-cutting concerns (cache, mail, database) are extracted into an `infrastructure/` directory to separate technical implementation from business domain logic.

## Consequences

### Positive
- **Improved Testability:** Each module is an isolated unit, making it easier to write focused unit/integration tests.
- **Scalability:** Adding a new game engine is now a "plugin" operation (registering into the `GameRegistry`) rather than a "core" operation.
- **Maintainability:** The dependency graph flows unidirectionally, reducing the surface area for bugs.
- **Security:** Centralized modules allow for stricter enforcement of authentication and state sanitization.

### Negative
- **Initial Migration Overhead:** The refactor required significant time to update imports and route registrations.
- **Boilerplate:** Slightly increased the number of files (barrel exports) to maintain public APIs.
