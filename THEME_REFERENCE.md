# 🎨 Gurukul Theme Quick Reference

> Quick copy-paste reference for Gurukul design elements

## 🎯 Color Codes (Copy-Paste Ready)

### Primary Orange
```
#EA580C  - Primary Dark (buttons, accents)
#F97316  - Primary (hover states, highlights)
#FB923C  - Primary Light (subtle accents)
```

### Background Shades
```
#0C0A09  - Darkest (input backgrounds)
#181614  - Dark (footer, deep cards)
#221F1D  - Medium Dark (modals, navigation)
#292524  - Card borders
```

### Text Colors
```
#FFFFFF  - Primary text (headings, important)
#D6D3D1  - Labels and secondary text
#A8A29E  - Muted text
#78716C  - Tertiary text
#57534E  - Disabled text
```

### Semantic Colors
```
#10B981  - Success (green)
#EF4444  - Error (red)
#F59E0B  - Warning (amber)
#3B82F6  - Info (blue)
```

---

## 📐 Common Tailwind Classes

### Backgrounds
```tsx
bg-[#0C0A09]           // Darkest input background
bg-[#181614]           // Footer, cards
bg-[#221F1D]           // Modal, navigation
bg-[#221F1D]/90        // Navigation with 90% opacity
bg-orange-600          // Primary button
bg-gradient-to-r from-orange-600 to-orange-700  // Button gradient
```

### Text
```tsx
text-white             // Primary headings
text-stone-300         // Labels
text-stone-400         // Muted text
text-stone-500         // Tertiary text
text-orange-500        // Accent text
text-orange-400        // Hover accent
```

### Borders
```tsx
border border-white/10      // Subtle white border
border border-stone-800     // Input borders
border border-orange-600    // Focus borders
```

### Shadows
```tsx
shadow-2xl shadow-black/50          // Deep card shadows
shadow-lg shadow-orange-900/40      // Button shadows
shadow-lg shadow-orange-900/60      // Button hover shadows
```

### Border Radius
```tsx
rounded-full           // Pills, badges, circular buttons
rounded-3xl            // Modals (24px)
rounded-xl             // Cards, inputs, buttons (12px)
rounded-2xl            // Large cards (16px)
```

### Effects
```tsx
backdrop-blur-md       // Navigation, overlays
backdrop-blur-sm       // Modal backgrounds
bg-black/60            // Modal overlay
hover:scale-105        // Subtle lift
hover:scale-110        // Image zoom
transition-all         // Smooth transitions
```

---

## 🧩 Component Templates

### Primary Button
```tsx
<button className="bg-gradient-to-r from-orange-600 to-orange-700 
                   hover:from-orange-700 hover:to-orange-800 
                   text-white font-bold py-3.5 px-8 rounded-xl 
                   transition-all shadow-lg shadow-orange-900/40 
                   hover:shadow-orange-900/60">
  Button Text
</button>
```

### Secondary Button
```tsx
<button className="bg-transparent border border-stone-700 
                   text-stone-300 hover:bg-stone-800 hover:text-white
                   px-8 py-4 rounded-full transition-all">
  Button Text
</button>
```

### Input Field
```tsx
<input 
  type="text"
  className="w-full bg-[#0C0A09] border border-stone-800 
             rounded-xl px-4 py-3.5 text-white 
             placeholder-stone-600 
             focus:outline-none focus:border-orange-600 
             focus:ring-2 focus:ring-orange-600/20 
             transition-all"
  placeholder="Enter text..."
/>
```

### Card
```tsx
<div className="bg-[#221F1D] border border-white/10 
                rounded-2xl p-8 
                shadow-2xl shadow-black/50">
  {/* Card content */}
</div>
```

### Modal Overlay
```tsx
<div className="fixed inset-0 z-[100] 
                flex items-center justify-center 
                bg-black/60 backdrop-blur-sm p-4">
  <div className="relative bg-[#221F1D] border border-white/10 
                  rounded-3xl shadow-2xl shadow-black/50 
                  w-full max-w-md p-8">
    {/* Modal content */}
  </div>
</div>
```

### Navigation Bar
```tsx
<nav className="bg-[#221F1D]/90 backdrop-blur-md 
                border border-white/10 rounded-full 
                px-5 py-2.5 
                shadow-2xl shadow-black/50">
  {/* Nav content */}
</nav>
```

### Badge/Pill
```tsx
<span className="inline-flex items-center px-4 py-2 
                 rounded-full border border-orange-500/20 
                 bg-orange-500/5 text-orange-400 
                 text-xs font-bold tracking-widest uppercase">
  BADGE TEXT
</span>
```

### Icon Button
```tsx
<button className="p-2 rounded-full 
                   hover:bg-white/5 transition-colors 
                   text-stone-400 hover:text-white">
  <Icon className="w-5 h-5" />
</button>
```

---

## 📱 Section Layouts

### Hero Section
```tsx
<section className="relative pt-32 pb-20 px-4 
                    min-h-screen flex items-center 
                    overflow-hidden">
  <div className="container mx-auto max-w-7xl relative z-10">
    <div className="grid lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7">
        {/* Left content */}
      </div>
      <div className="lg:col-span-5">
        {/* Right content */}
      </div>
    </div>
  </div>
</section>
```

### Features Section
```tsx
<section className="py-24 px-4 relative">
  <div className="container mx-auto max-w-7xl relative z-10">
    <div className="text-center mb-16 space-y-4">
      {/* Section header */}
    </div>
    <div className="grid md:grid-cols-3 gap-8">
      {/* Feature cards */}
    </div>
  </div>
</section>
```

### CTA Section
```tsx
<section className="py-32 px-4 relative overflow-hidden">
  <div className="absolute inset-0 
                  bg-gradient-to-t from-orange-900/5 to-transparent 
                  pointer-events-none" />
  <div className="container mx-auto max-w-4xl 
                  relative z-10 text-center">
    {/* CTA content */}
  </div>
</section>
```

---

## 🎬 Animation Classes

### Hover Effects
```tsx
hover:scale-105              // Subtle lift
hover:scale-110              // Image zoom
hover:bg-orange-700          // Background color change
hover:text-orange-400        // Text color change
hover:shadow-orange-900/60   // Shadow intensity
group-hover:scale-110        // Child element on parent hover
```

### Transitions
```tsx
transition-all               // All properties
transition-colors            // Colors only
transition-transform         // Transform only
duration-300                 // 300ms
duration-700                 // 700ms (for images)
ease-out                     // Easing function
```

### Custom Animations
```tsx
animate-pulse                // Pulsing effect
animate-fade-in-up           // Custom fade in from bottom
```

---

## 📏 Spacing Reference

### Padding
```tsx
p-2    // 8px
p-4    // 16px
p-6    // 24px
p-8    // 32px
px-5   // 20px horizontal
py-2.5 // 10px vertical
py-3.5 // 14px vertical
```

### Margin
```tsx
mb-2   // 8px bottom
mb-3   // 12px bottom
mb-6   // 24px bottom
mb-8   // 32px bottom
mb-16  // 64px bottom
```

### Gap
```tsx
gap-3  // 12px
gap-4  // 16px
gap-6  // 24px
gap-8  // 32px
gap-12 // 48px
```

---

## 🎯 Z-Index Layers

```
z-0     // Base layer
z-10    // Content layer
z-50    // Header navigation
z-[100] // Modals and overlays
z-[200] // Tooltips and popovers
```

---

## 📱 Responsive Breakpoints

```tsx
sm:   // 640px+  (mobile landscape)
md:   // 768px+  (tablet)
lg:   // 1024px+ (desktop)
xl:   // 1280px+ (large desktop)
2xl:  // 1536px+ (extra large)
```

### Common Patterns
```tsx
hidden md:flex              // Hide on mobile, show on tablet+
sm:block                    // Show on mobile landscape+
lg:col-span-7               // 7 columns on desktop
max-w-2xl                   // 672px max width
max-w-4xl                   // 896px max width
max-w-7xl                   // 1280px max width
```

---

## 🔤 Typography Scale

```tsx
text-xs    // 12px
text-sm    // 14px
text-base  // 16px
text-lg    // 18px
text-xl    // 20px
text-2xl   // 24px
text-3xl   // 30px
text-4xl   // 36px
text-5xl   // 48px
text-7xl   // 72px
```

### Font Weights
```tsx
font-light    // 300
font-normal   // 400
font-medium   // 500
font-semibold // 600
font-bold     // 700
```

---

## ✅ Accessibility Classes

```tsx
focus:outline-none
focus:ring-2
focus:ring-orange-600/20
focus:border-orange-600
aria-label="Descriptive label"
role="button"
tabIndex={0}
```

---

## 🎨 Gradient Combinations

### Orange Gradients
```tsx
bg-gradient-to-r from-orange-600 to-orange-700
bg-gradient-to-r from-orange-700 to-orange-800
bg-gradient-to-t from-orange-900/5 to-transparent
```

### Background Gradients
```tsx
bg-gradient-to-t from-[#181614] via-transparent to-transparent
```

---

**Quick Tip**: Bookmark this page for easy access to all Gurukul design tokens!

**Last Updated**: November 30, 2024
