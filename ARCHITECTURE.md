# ShagMe React Native Architecture Implementation

## 🏗️ Architecture Overview

This project implements the ShagMe React Native application following modern best practices and the specifications from the product requirements.

### Tech Stack Implementation

- **Framework:** React Native 0.74+ with Expo SDK 51+
- **Language:** TypeScript with strict type checking
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **UI Library:** React Native Reusables (shadcn/ui components)
- **Navigation:** Expo Router v3 (file-based routing)
- **State Management:** Zustand v4 (lightweight state management)
- **Icons:** Lucide React Native with className support
- **Storage:** AsyncStorage for persistent data

## 📁 Directory Structure

```
shagme-app/
├── App.tsx                 # Main app entry point with theme provider
├── global.css             # Global CSS with theme variables
├── metro.config.js        # Metro bundler configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── babel.config.js        # Babel configuration
├── tsconfig.json          # TypeScript configuration
├── nativewind-env.d.ts    # NativeWind type definitions
├── .env.example           # Environment variables template
├── .env.local            # Local development environment
└── src/
    ├── components/
    │   ├── ui/              # Styled UI components
    │   │   ├── text.tsx     # Text component with theme context
    │   │   └── button.tsx   # Button component with variants
    │   ├── icons/           # Icon components with styling
    │   │   ├── Sun.tsx      # Light mode icon
    │   │   └── MoonStar.tsx # Dark mode icon
    │   ├── validation/      # Development validation components
    │   ├── verification/    # Identity verification components (planned)
    │   └── common/          # Shared components (planned)
    ├── hooks/
    │   ├── useTheme.tsx     # Theme context and provider
    │   └── useColorScheme.ts # NativeWind color scheme hook
    ├── utils/
    │   ├── cn.ts            # Class name utility function
    │   ├── theme.ts         # Theme constants and navigation themes
    │   └── iconWithClassName.ts # Icon styling utility
    ├── screens/             # Screen components (planned)
    ├── services/            # API and external services (planned)
    ├── store/               # Zustand stores (planned)
    ├── types/               # TypeScript type definitions (planned)
    └── constants/           # App constants (planned)
```

## 🎨 Theme System Architecture

### CSS Variables Approach
- Uses CSS custom properties for dynamic theming
- Defined in global.css with light/dark variants
- Mapped to Tailwind classes via tailwind.config.js

### Theme Provider Hierarchy
```
App
├── ThemeProvider (AsyncStorage persistence)
    ├── AppContent (theme-aware components)
        ├── ValidationTest
        └── StatusBar (theme-responsive)
```

### Color System
- **Background colors:** background, card, popover
- **Text colors:** foreground, muted-foreground
- **Interactive colors:** primary, secondary, accent
- **State colors:** destructive, border, input, ring

## 🧩 Component Architecture

### UI Component Pattern
```tsx
// Base pattern for UI components
const Component = React.forwardRef<ElementRef, Props>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <Primitive
        className={cn(componentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### Icon Integration Pattern
```tsx
// Icon component with className support
import { IconName } from 'lucide-react-native';
import { iconWithClassName } from '@/utils/iconWithClassName';

iconWithClassName(IconName);
export { IconName };
```

## 🛠️ Development Workflow

### Component Creation
1. Create component in appropriate directory
2. Use TypeScript interfaces for props
3. Apply class-variance-authority for variants
4. Use cn() utility for conditional classes
5. Export component and variant types

### Styling Guidelines
1. Use semantic theme colors (e.g., `text-foreground`)
2. Leverage component variants for consistency
3. Apply responsive design principles
4. Test in both light and dark modes

### State Management Strategy
- Local component state for UI interactions
- Zustand stores for global application state
- AsyncStorage for persistent user preferences
- Context for theme and authentication state

## 🔧 Configuration Details

### NativeWind Setup
- Configured for native-first output
- CSS variables mapped to Tailwind classes
- Metro bundler processes CSS at build time
- Babel transforms JSX for NativeWind

### TypeScript Configuration
- Strict mode enabled for type safety
- Path aliases (@/) for clean imports
- React Native and Expo type definitions
- NativeWind type augmentation

### Build Configuration
- Expo managed workflow for simplicity
- Platform-specific optimizations
- Tree shaking for bundle size optimization
- Development and production builds

## 📱 Platform Considerations

### iOS Specific
- Safe area handling with react-native-safe-area-context
- Native navigation integration
- App Store guidelines compliance

### Android Specific
- Material Design adherence
- Navigation bar theming
- Google Play requirements

### Web Specific
- Progressive Web App capabilities
- Browser compatibility
- SEO optimization

## 🚀 Performance Optimizations

### Bundle Size
- Tree shaking for unused code elimination
- Lazy loading for route-based code splitting
- Optimized icon imports

### Runtime Performance
- React.memo for component optimization
- useCallback for function memoization
- Efficient re-renders with proper dependencies

### Development Experience
- Fast refresh for rapid iteration
- TypeScript for early error detection
- ESLint and Prettier for code quality

## 📋 Implementation Status

### ✅ Completed
- Project foundation and structure
- Theme system with dark/light mode
- Basic UI components (Text, Button)
- Icon system with Lucide integration
- Development environment setup
- TypeScript configuration
- NativeWind integration
- React Native Reusables foundation

### 🔄 In Progress
- Validation and testing
- Documentation completion

### 📋 Planned
- Authentication screens
- Navigation structure
- Profile management
- Verification system
- Matching interface
- Communication features
- Payment integration
- Safety features

This architecture provides a solid foundation for building the complete ShagMe dating application while maintaining scalability, performance, and developer experience.
