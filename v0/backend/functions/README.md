# Translation Service Functions

Firebase Cloud Functions for translation service.

## Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── helpers/         # Helper functions
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic services
├── tests/           # Test files
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run tests:
```bash
npm test
```

4. Deploy to Firebase:
```bash
npm run deploy
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

## Scripts

- `npm run build` - Compile TypeScript
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run deploy` - Deploy to Firebase
