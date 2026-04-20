# 单词默写生成器 (Word Dictation Generator)

## Overview

A full-stack web application for Chinese students and teachers to manage vocabulary lists and generate printable English dictation worksheets.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/word-dictation)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (lib/db)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Excel**: SheetJS (xlsx)

## Features

- Multi-textbook + multi-unit vocabulary management
- Full CRUD for textbooks, units, and words
- Excel import/export (columns: 英语, 中文, 音标, 词性)
- Phonetic (IPA) display
- Two dictation styles: underline (下划线版) and table (表格版)
- Chinese→English and English→Chinese direction switching
- Web preview + print/PDF export
- Configurable 1-3 column layout
- Word shuffling option
- Stats summary in sidebar

## Database Schema

- `textbooks` — textbook records (name, description)
- `units` — units within textbooks (textbookId FK, name, orderIndex)
- `words` — words within units (unitId FK, english, chinese, phonetic, partOfSpeech, orderIndex)

## API Routes

- `GET/POST /api/textbooks` — list / create textbooks
- `GET/PATCH/DELETE /api/textbooks/:id` — get / update / delete textbook
- `GET/POST /api/textbooks/:textbookId/units` — list / create units
- `PATCH/DELETE /api/units/:id` — update / delete unit
- `GET/POST /api/units/:unitId/words` — list / create words
- `PATCH/DELETE /api/words/:id` — update / delete word
- `POST /api/words/import` — bulk import words from Excel data
- `GET /api/units/:unitId/words/export` — export words
- `POST /api/dictation/preview` — generate dictation sheet
- `GET /api/stats/summary` — overall stats

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server

## Notes

- OpenAPI spec lives at `lib/api-spec/openapi.yaml`
- Orval codegen writes to `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`
- After codegen, `lib/api-zod/src/index.ts` is patched to only export from `generated/api.ts`
- Date serialization: DB returns Date objects, routes call `sd()` helper to convert to ISO strings before Zod parsing
