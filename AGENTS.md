# Project Guidelines & Persistent Agent Rules

## Documentation Mandate
- **README Synchronization**: Always update `README.md` whenever new features, modules, or capabilities are added to the system. Keep the Table of Contents, Feature Matrix, and operational guides in sync with code updates.

## Technical Architecture Conventions
- **Polar Operations Domain**: Tactical Arctic & Antarctic expedition logistics, vehicle crawlers (Snowcats, PistenBully), extreme cold-soak stress modeling (-50°C), and SAR / Mayday distress coordination.
- **Predictive Maintenance Priority**: Favor proactive machine learning pre-failure alerts over reactive "Needs Repair" status flags.
- **Gemini API Conventions**:
  - Use `@google/genai` on the server-side (`server.ts`).
  - Use `gemini-3.8-flash` for text tasks.
  - Always pass `httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }` in the GoogleGenAI initialization.
- **Dev Server & Network Ingress**:
  - Server listens on port 3000 and `0.0.0.0`.
  - In `vite.config.ts`, `server.allowedHosts: true` must remain enabled to permit ngrok, localtunnel, and remote satellite tunnel domains.
