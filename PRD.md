# Planning Guide

A precision LLM model comparison tool that measures first token latency, TPS (tokens per second), and chain-of-thought timing across multiple providers and models simultaneously.

**Experience Qualities**: 
1. **Precise** - Displays accurate timing metrics down to milliseconds for professional model evaluation
2. **Configurable** - Drag-and-drop provider/model management with dynamic model fetching from endpoints
3. **Parallel** - Runs multiple model comparisons side-by-side with real-time streaming responses

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a sophisticated benchmarking tool requiring parallel API streaming, precise timing measurement, dynamic provider/model configuration with drag-and-drop, and real-time metric display across multiple concurrent responses.

## Essential Features

### Progressive Web App (PWA)
- **Functionality**: Installable web application that works offline and can be added to home screen/desktop
- **Purpose**: Provide native app-like experience with offline capability for accessing previous configurations
- **Trigger**: Browser detects PWA capability and shows install prompt; user clicks "Install App" button in header
- **Progression**: Visit site → Browser shows install prompt or "Install App" button → Click install → App added to home screen/desktop → Launches in standalone mode → Works offline for UI and cached data
- **Success criteria**: App can be installed on desktop and mobile, launches in standalone mode, shows app icon, maintains user data offline, service worker caches critical assets

### Provider Management
- **Functionality**: Configure API providers with endpoint URLs and API keys, fetch available models from each provider. Intelligent URL handling: extracts version from endpoint (e.g., `/v4`) or defaults to `/v1`, then appends API paths (`/models`, `/chat/completions`)
- **Purpose**: Support multiple LLM providers (OpenAI, Anthropic, local endpoints, etc.) with /chat/completions compatible APIs and custom API versions
- **Trigger**: User clicks "Add Provider" in the configuration panel
- **Progression**: Click add → Enter provider name + API endpoint (e.g., `https://open.bigmodel.cn/api/paas/v4` or `https://api.openai.com`) + API key → System builds URLs: if endpoint ends with `/v{number}` use it, else append `/v1` → GET {endpoint}/models to fetch available models → Display models under provider → Drag models to active comparison slots
- **Success criteria**: Provider connects successfully with correct version handling (v1 default, v4+ when specified), models list populates, models can be dragged to comparison tabs

### Model Configuration (Drag-and-Drop)
- **Functionality**: Manage up to 8+ model slots with drag-and-drop from provider model lists
- **Purpose**: Flexible model selection for simultaneous comparison
- **Trigger**: User drags model from provider list or manually enters model ID
- **Progression**: Drag model from provider → Drop into comparison slot → Model tab appears → Can reorder/remove models
- **Success criteria**: Models can be added via drag-drop or manual entry, up to 8+ slots supported, models persist between sessions

### Parallel Model Execution
- **Functionality**: Send identical prompts to all configured models simultaneously with streaming responses. Can abort all running comparisons mid-stream.
- **Purpose**: Fair comparison with same input conditions, with ability to cancel long-running or problematic requests
- **Trigger**: User enters prompts and clicks "Run Comparison" to start, or clicks again to abort
- **Progression**: Enter system prompt → Enter user prompt → Click run → All models stream responses in parallel → Metrics update in real-time → (Optional) Click "Abort Comparison" to cancel all streaming requests → Aborted models show "Aborted" status
- **Success criteria**: All models receive requests simultaneously, responses stream independently, timing is accurate, abort functionality cancels all active streams cleanly

### Precision Timing Metrics
- **Functionality**: Measure and display: Time to First Token (TTFT), Chain-of-Thought time (if present), Content TTFT, Content TPS, Total time
- **Purpose**: Quantify model performance characteristics
- **Trigger**: Automatically tracked during streaming response
- **Progression**: Request sent (t0) → First token received (TTFT) → CoT section streams → Content section streams → Request complete → Calculate TPS
- **Success criteria**: All timing metrics accurate to milliseconds, TPS calculated correctly, CoT detected automatically

### Response Display with Metrics
- **Functionality**: Show streaming response with inline timing annotations
- **Purpose**: Visualize performance alongside content quality
- **Trigger**: Model begins streaming response
- **Progression**: Stream appears → "think" section (if CoT) → Content section → Metrics displayed on right side → Can switch between model tabs
- **Success criteria**: Responses stream smoothly, CoT sections clearly marked, metrics visible and updating

## Edge Case Handling

- **API Failures**: Display error message in model tab, allow retry without affecting other models
- **Slow Responses**: Show "waiting..." state, don't block other models, allow cancellation via abort button
- **Invalid API Keys**: Show validation error when adding provider, allow editing
- **Empty Model Lists**: Show manual entry option if GET /models fails
- **Missing CoT**: Only show CoT metrics when detected, gracefully handle models without thinking sections
- **Concurrent Requests**: Handle rate limits per provider, queue if necessary
- **Aborted Requests**: Show "Aborted" status on cancelled model tabs, preserve partial responses if any
- **Offline Mode**: Show cached provider configurations when offline, disable API calls gracefully

## Design Direction

The design should evoke precision instrumentation and professional benchmarking tools - think oscilloscope or performance monitoring dashboards. Clean, technical aesthetic with monospaced fonts for metrics, clear data hierarchy, and subtle color coding for different timing phases.

## Color Selection

Technical dashboard aesthetic with emphasis on readability and metric differentiation.

- **Primary Color**: `oklch(0.45 0.15 250)` - Deep tech blue conveying precision and professionalism
- **Secondary Colors**: `oklch(0.92 0.02 250)` - Light blue-gray for panels and cards, `oklch(0.25 0.10 250)` - Darker blue for headers
- **Accent Color**: `oklch(0.70 0.18 150)` - Bright cyan-green for active states and primary actions - draws attention to "Run" button and active metrics
- **Foreground/Background Pairings**: 
  - Background (White `oklch(0.98 0 0)`): Foreground (`oklch(0.20 0.02 250)`) - Ratio 13.1:1 ✓
  - Primary (`oklch(0.45 0.15 250)`): White text (`oklch(0.98 0 0)`) - Ratio 8.2:1 ✓
  - Accent (`oklch(0.70 0.18 150)`): Dark text (`oklch(0.20 0.02 250)`) - Ratio 6.8:1 ✓
  - Card (`oklch(0.96 0.01 250)`): Foreground (`oklch(0.20 0.02 250)`) - Ratio 12.5:1 ✓

## Font Selection

Technical precision requires monospaced fonts for metrics and a clean sans-serif for UI elements.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Space Grotesk Bold/24px/tight tracking - Technical but friendly
  - H2 (Section Headers): Space Grotesk SemiBold/18px/normal tracking
  - Body Text: Inter Regular/14px/1.5 line-height - Clean, readable
  - Metrics/Timing: JetBrains Mono Regular/13px/1.4 line-height - Precise monospaced for numbers
  - Model Names: JetBrains Mono Medium/12px - Technical identity

## Animations

Animations should reinforce data flow and state changes without impeding benchmark accuracy.

- **Streaming Text**: Smooth append animation as tokens arrive (no artificial delay)
- **Metric Updates**: Gentle number transitions when TPS recalculates
- **Tab Switching**: Quick 150ms slide transition between model responses
- **Drag-and-Drop**: Smooth drag feedback with elevation shadow, snap-to-grid on drop
- **Loading States**: Subtle pulse on metric placeholders while waiting for first token

## Component Selection

- **Components**: 
  - `Tabs` for switching between model responses in the main comparison area
  - `Card` for provider/model configuration panels and response containers
  - `Input` + `Label` for prompt entry and configuration fields
  - `Button` with variant="default" for Run Comparison, variant="outline" for secondary actions
  - `Textarea` for system and user prompts with auto-resize
  - `ScrollArea` for long model responses
  - `Badge` for timing metrics display (color-coded by metric type)
  - `Separator` to divide CoT and content sections
  - `Dialog` for adding/editing providers
  - `Skeleton` for loading states during model fetch

- **Customizations**: 
  - Custom drag-and-drop zone for provider→model assignment (visual feedback on hover)
  - Custom metric display panel with real-time updating numbers (monospaced font)
  - Custom streaming response container with CoT/content section detection
  - Color-coded timing badges (TTFT: blue, CoT TPS: purple, Content TPS: green)

- **States**: 
  - Buttons: Default, hover with subtle lift, active with pressed state, disabled when no models configured
  - Inputs: Focus with accent border, error state for invalid API endpoints
  - Model tabs: Active with accent underline, inactive muted, hover with background change
  - Drag zones: Idle with dashed border, drag-over with solid accent border and background tint

- **Icon Selection**: 
  - `Play` for Run Comparison
  - `Plus` for Add Provider/Model
  - `Trash` for Remove
  - `GearSix` for Provider Settings
  - `Clock` for timing metrics
  - `ArrowsDownUp` for drag handle
  - `X` for close/cancel
  - `Download` for PWA install prompt

- **Spacing**: 
  - Container padding: p-6 (24px) for main areas
  - Card padding: p-4 (16px) for configuration panels
  - Gap between elements: gap-4 (16px) for related groups, gap-6 (24px) for sections
  - Metric badges: px-2 py-1 with gap-2 between badges

- **Mobile**: 
  - Stack layout: Left sidebar (prompts/config) moves above main comparison area
  - Model tabs: Horizontal scroll with sticky navigation
  - Configuration panel: Accordion collapse for providers, full-width model cards
  - Metrics: Stack vertically on smaller screens, remain inline on desktop
  - Drag-and-drop: Convert to tap-to-select on touch devices with explicit "Add to slot" buttons
