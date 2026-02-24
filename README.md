# Protocol — Skinny-Fat Assessment + 30-Day Recomp Reset Landing Page

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open:
- Quiz: http://localhost:3000
- Landing page: http://localhost:3000/program

## Notes
- Lead payloads are logged by `app/api/lead/route.ts` and stored in-memory (reset on server restart).
- Update questions or weights in `lib/quizConfig.ts`.
