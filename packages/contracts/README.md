# Shared SpikeOS Contracts

The canonical domain/API contract should eventually be generated from FastAPI/OpenAPI. Until code generation is introduced, this folder documents the fields shared by the web dashboard and Outlook add-in.

Core objects:
- AuthenticatedUser
- CommunicationContext
- Communication
- Commitment
- Alert

Rule: frontend and add-in must not invent independent versions of authorization or scoring rules.
