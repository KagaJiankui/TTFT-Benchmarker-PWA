# TTFT-PWA：LLM First Token Latency Tester

![Static Badge](https://img.shields.io/badge/build%20with-GitHub%20Spark-blue?style=for-the-badge&logo=github)
![Static Badge](https://img.shields.io/badge/PWA-supported-olime?style=flat-square)

A TypeScript-built Progressive Web App (PWA) for parallel LLM performance benchmarking. It measures key metrics like Time to First Token (TTFT), tokens per second (TPS), and chain-of-thought timing across multiple LLM providers/models at once.

## Key User Features

- **PWA Access**: Install on desktop/mobile, use offline (access cached configs), and run in standalone mode.
- **Easy Provider & Model Setup**: Add LLM providers via API endpoints/keys, auto-fetch available models, and manage up to 8+ comparison slots with drag-and-drop.
- **Parallel Testing**: Send the same prompt to all configured models simultaneously (streaming responses) and abort tests mid-run if needed.
- **Precise Metric Tracking**: View real-time, millisecond-accurate metrics: TTFT, chain-of-thought time, content TPS, and total response time.
- **Clear Response Display**: Switch between model tabs to see streaming responses, with clear separation of chain-of-thought/content and inline timing notes.

## User-Friendly Edge Handling

- API failures/slow responses don’t affect other models (error messages shown per model).
- Manually enter model IDs if auto-fetch fails.
- Preserve partial responses if tests are aborted.
- Offline mode disables API calls but keeps cached configs accessible.
