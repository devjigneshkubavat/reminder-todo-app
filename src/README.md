# Source structure

- `app/`: app setup and root providers.
- `assets/`: bundled images, fonts, and other static files.
- `components/`: reusable UI shared by features.
- `features/`: feature-specific screens, components, hooks, and data logic. Put reminder code in `features/reminders/`.
- `hooks/`: hooks shared across features.
- `navigation/`: navigators and route definitions.
- `screens/`: screens that combine multiple features.
- `services/`: API clients and device integrations.
- `store/`: shared application state.
- `theme/`: colors, typography, and spacing.
- `types/`: shared TypeScript types.
- `utils/`: small shared utilities.

Keep code close to the feature that owns it. Move it into a shared directory only when another feature uses it.
