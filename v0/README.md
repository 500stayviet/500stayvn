# 500stayviet - Translation Service

Translation service project with backend functions structure.

## Project Structure

```
500stayviet/
├── backend/
│   └── functions/
│       ├── src/
│       │   ├── services/
│       │   │   └── translationService.ts
│       │   ├── types/
│       │   │   ├── translation.types.ts
│       │   │   └── config.types.ts
│       │   ├── index.ts
│       │   └── test-run.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── .gitignore
└── README.md
```

## Features

- Translation service with support for multiple languages (en, ko, ja, zh, vi)
- Language detection
- Batch translation support
- Firebase Cloud Functions integration
- TypeScript support

## Setup

1. Navigate to the functions directory:
```bash
cd backend/functions
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Usage

### Translation Service

```typescript
import { TranslationService } from './services/translationService';

const service = new TranslationService();
const result = await service.translate('Hello', 'ko');
```

### Test Runner

```bash
npm test
# or
ts-node src/test-run.ts
```

## Supported Languages

- English (en)
- Korean (ko)
- Japanese (ja)
- Chinese (zh)
- Vietnamese (vi)
