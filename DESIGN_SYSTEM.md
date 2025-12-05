# 🎨 Gurukul Design System

> A comprehensive guide to the Gurukul visual design language

## 📐 Design Philosophy

Gurukul's design system is inspired by the ancient Indian Gurukul tradition, combining timeless wisdom with modern digital aesthetics. The design emphasizes:

- **Focus & Clarity**: Clean interfaces that promote concentration
- **Warmth & Welcome**: Inviting colors and soft shapes
- **Depth & Dimension**: Layered elements with shadows and blur
- **Elegance & Simplicity**: Minimal but meaningful design

---

## 🎨 Color Palette

### Primary Colors

#### Orange (Knowledge & Enlightenment)
```css
--orange-50:  #FFF7ED
--orange-100: #FFEDD5
--orange-200: #FED7AA
--orange-300: #FDBA74
--orange-400: #FB923C
--orange-500: #F97316  /* Primary */
--orange-600: #EA580C  /* Primary Dark */
--orange-700: #C2410C
--orange-800: #9A3412
--orange-900: #7C2D12
```

**Usage:**
- Primary CTAs: `bg-orange-600 hover:bg-orange-700`
- Accents: `text-orange-500`
- Gradients: `from-orange-600 to-orange-700`
- Shadows: `shadow-orange-900/40`

### Neutral Colors (Stone)

#### Background Shades
```css
--stone-950: #0C0A09  /* Darkest - Input backgrounds */
--stone-900: #181614  /* Dark - Footer, cards */
--stone-850: #221F1D  /* Medium Dark - Modal, nav */
--stone-800: #292524  /* Card borders */
```

#### Text & UI Shades
```css
--stone-700: #44403C
--stone-600: #57534E
--stone-500: #78716C  /* Secondary text */
--stone-400: #A8A29E  /* Muted text */
--stone-300: #D6D3D1  /* Labels */
--stone-200: #E7E5E4
--stone-100: #F5F5F4
--stone-50:  #FAFAF9
```

### Semantic Colors

```css
--success: #10B981  /* Green-500 */
--error:   #EF4444  /* Red-500 */
--warning: #F59E0B  /* Amber-500 */
--info:    #3B82F6  /* Blue-500 */
```

---

## 📝 Typography

### Font Families

```css
--font-heading: 'Custom Vedic Font', Georgia, serif;
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Sizes

```css
--text-xs:   0.75rem   /* 12px */
--text-sm:   0.875rem  /* 14px */
--text-base: 1rem      /* 16px */
--text-lg:   1.125rem  /* 18px */
--text-xl:   1.25rem   /* 20px */
--text-2xl:  1.5rem    /* 24px */
--text-3xl:  1.875rem  /* 30px */
--text-4xl:  2.25rem   /* 36px */
--text-5xl:  3rem      /* 48px */
--text-6xl:  3.75rem   /* 60px */
--text-7xl:  4.5rem    /* 72px */
```

### Font Weights

```css
--font-light:    300
--font-normal:   400
--font-medium:   500
--font-semibold: 600
--font-bold:     700
```

### Line Heights

```css
--leading-tight:   1.25
--leading-snug:    1.375
--leading-normal:  1.5
--leading-relaxed: 1.625
--leading-loose:   2
```

---

## 📏 Spacing Scale

```css
--spacing-0:  0
--spacing-1:  0.25rem   /* 4px */
--spacing-2:  0.5rem    /* 8px */
--spacing-3:  0.75rem   /* 12px */
--spacing-4:  1rem      /* 16px */
--spacing-5:  1.25rem   /* 20px */
--spacing-6:  1.5rem    /* 24px */
--spacing-8:  2rem      /* 32px */
--spacing-10: 2.5rem    /* 40px */
--spacing-12: 3rem      /* 48px */
--spacing-16: 4rem      /* 64px */
--spacing-20: 5rem      /* 80px */
--spacing-24: 6rem      /* 96px */
--spacing-32: 8rem      /* 128px */
```

---

## 🔲 Border Radius

```css
--rounded-none: 0
--rounded-sm:   0.125rem  /* 2px */
--rounded:      0.25rem   /* 4px */
--rounded-md:   0.375rem  /* 6px */
--rounded-lg:   0.5rem    /* 8px */
--rounded-xl:   0.75rem   /* 12px */
--rounded-2xl:  1rem      /* 16px */
--rounded-3xl:  1.5rem    /* 24px */
--rounded-full: 9999px
```

**Component Usage:**
- Buttons: `rounded-full` or `rounded-xl`
- Cards: `rounded-xl` or `rounded-2xl`
- Modals: `rounded-3xl`
- Inputs: `rounded-xl`
- Pills/Badges: `rounded-full`

---

## 🌑 Shadows

### Standard Shadows

```css
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow:     0 1px 3px 0 rgb(0 0 0 / 0.1)
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

### Colored Shadows (Orange)

```css
--shadow-orange-sm:  shadow-lg shadow-orange-900/20
--shadow-orange-md:  shadow-lg shadow-orange-900/40
--shadow-orange-lg:  shadow-2xl shadow-orange-900/50
```

**Usage:**
- Cards: `shadow-2xl shadow-black/50`
- Buttons: `shadow-lg shadow-orange-900/40`
- Modals: `shadow-2xl shadow-black/50`

---

## 🎭 Effects

### Backdrop Blur

```css
--backdrop-blur-none: 0
--backdrop-blur-sm:   4px
--backdrop-blur:      8px
--backdrop-blur-md:   12px
--backdrop-blur-lg:   16px
--backdrop-blur-xl:   24px
```

**Usage:**
- Navigation: `backdrop-blur-md`
- Modals: `backdrop-blur-sm`
- Overlays: `backdrop-blur-sm`

### Opacity

```css
--opacity-0:   0
--opacity-5:   0.05
--opacity-10:  0.1
--opacity-20:  0.2
--opacity-40:  0.4
--opacity-60:  0.6
--opacity-80:  0.8
--opacity-90:  0.9
--opacity-100: 1
```

---

## 🧩 Component Specifications

### Header Navigation

```tsx
<header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
  <nav className="bg-[#221F1D]/90 backdrop-blur-md border border-white/10 
                  rounded-full px-5 py-2.5 flex items-center justify-between 
                  w-full max-w-2xl shadow-2xl shadow-black/50">
    {/* Content */}
  </nav>
</header>
```

**Specs:**
- Background: `#221F1D` with 90% opacity
- Border: White 10% opacity
- Border radius: `rounded-full`
- Max width: `max-w-2xl` (672px)
- Padding: `px-5 py-2.5`
- Shadow: `shadow-2xl shadow-black/50`
- Backdrop blur: `backdrop-blur-md`

### Auth Modal

```tsx
<div className="fixed inset-0 z-[100] flex items-center justify-center 
                bg-black/60 backdrop-blur-sm p-4">
  <div className="relative bg-[#221F1D] border border-white/10 
                  rounded-3xl shadow-2xl shadow-black/50 
                  w-full max-w-md p-8">
    {/* Content */}
  </div>
</div>
```

**Specs:**
- Overlay: Black 60% opacity with backdrop blur
- Background: `#221F1D`
- Border: White 10% opacity
- Border radius: `rounded-3xl` (24px)
- Max width: `max-w-md` (448px)
- Padding: `p-8` (32px)
- Z-index: `z-[100]`

### Primary Button (CTA)

```tsx
<button className="bg-gradient-to-r from-orange-600 to-orange-700 
                   hover:from-orange-700 hover:to-orange-800 
                   text-white font-bold py-3.5 rounded-xl 
                   transition-all shadow-lg shadow-orange-900/40 
                   hover:shadow-orange-900/60">
  Button Text
</button>
```

**Specs:**
- Background: Orange gradient
- Text: White, bold
- Padding: `py-3.5` vertical
- Border radius: `rounded-xl`
- Shadow: Orange with 40% opacity
- Hover: Darker gradient, stronger shadow

### Secondary Button

```tsx
<button className="bg-transparent border border-stone-700 
                   text-stone-300 hover:bg-stone-800 
                   px-8 py-4 rounded-full transition-all">
  Button Text
</button>
```

### Input Field

```tsx
<input className="w-full bg-[#0C0A09] border border-stone-800 
                  rounded-xl pl-12 pr-4 py-3.5 
                  text-white placeholder-stone-600 
                  focus:outline-none focus:border-orange-600 
                  focus:ring-2 focus:ring-orange-600/20 
                  transition-all" />
```

**Specs:**
- Background: `#0C0A09` (darkest stone)
- Border: `stone-800`
- Border radius: `rounded-xl`
- Padding: `pl-12 pr-4 py-3.5`
- Focus: Orange border with ring

### Feature Card

```tsx
<div className="feature-card group">
  <div className="relative h-56 overflow-hidden">
    <img className="w-full h-full object-cover 
                    transition-transform duration-700 
                    group-hover:scale-110" />
    <div className="absolute inset-0 bg-black/20 
                    group-hover:bg-black/10 transition-colors" />
  </div>
  <div className="p-8">
    {/* Content */}
  </div>
</div>
```

**Specs:**
- Image height: `h-56` (224px)
- Overlay: Black 20% opacity
- Hover: Scale image to 110%, reduce overlay
- Padding: `p-8` (32px)

### Testimonial Card

```tsx
<div className="testimonial-card">
  <div className="flex items-center space-x-4 mb-6">
    <div className="w-12 h-12 rounded-full bg-orange-600 
                    flex items-center justify-center 
                    text-white font-bold text-xl">
      A
    </div>
    <div>
      <div className="font-bold text-white">Name</div>
      <div className="text-xs text-stone-500 uppercase tracking-wider">
        Role
      </div>
    </div>
  </div>
  <p className="text-stone-400 italic leading-relaxed">Quote</p>
</div>
```

---

## 🎬 Animations

### Transitions

```css
--transition-all:    all 0.3s ease
--transition-colors: colors 0.2s ease
--transition-transform: transform 0.3s ease
```

### Hover Effects

**Scale:**
```css
hover:scale-105     /* Subtle lift */
hover:scale-110     /* Image zoom */
```

**Opacity:**
```css
hover:opacity-80    /* Fade */
hover:opacity-100   /* Reveal */
```

**Colors:**
```css
hover:bg-orange-700
hover:text-orange-400
hover:border-orange-600/50
```

### Custom Animations

```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out;
}
```

---

## 📱 Responsive Breakpoints

```css
--screen-sm:  640px   /* Mobile landscape */
--screen-md:  768px   /* Tablet */
--screen-lg:  1024px  /* Desktop */
--screen-xl:  1280px  /* Large desktop */
--screen-2xl: 1536px  /* Extra large */
```

**Usage:**
```tsx
<div className="hidden md:flex">  {/* Show on tablet+ */}
<div className="sm:block">        {/* Show on mobile landscape+ */}
<div className="lg:col-span-7">  {/* 7 columns on desktop */}
```

---

## ✅ Accessibility

### Focus States

All interactive elements must have visible focus states:

```css
focus:outline-none 
focus:ring-2 
focus:ring-orange-600/20 
focus:border-orange-600
```

### Color Contrast

- **Text on dark backgrounds**: Minimum 4.5:1 contrast ratio
- **Large text (18px+)**: Minimum 3:1 contrast ratio
- **Interactive elements**: Clear hover and focus states

### ARIA Labels

```tsx
<button aria-label="Close modal">
  <X className="w-5 h-5" />
</button>
```

---

## 📦 CSS Custom Properties

Add to `globals.css`:

```css
:root {
  /* Colors */
  --color-primary: #EA580C;
  --color-primary-dark: #C2410C;
  --color-bg-dark: #0C0A09;
  --color-bg-medium: #221F1D;
  
  /* Spacing */
  --spacing-unit: 0.25rem;
  
  /* Typography */
  --font-heading: 'Custom Vedic Font', Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## 🎯 Best Practices

1. **Consistency**: Use design tokens consistently across all components
2. **Hierarchy**: Establish clear visual hierarchy with size, weight, and color
3. **Spacing**: Use the 8px grid system for consistent spacing
4. **Accessibility**: Always consider keyboard navigation and screen readers
5. **Performance**: Optimize images and use appropriate formats
6. **Responsiveness**: Design mobile-first, enhance for larger screens

---

**Last Updated**: November 30, 2024
**Version**: 1.0.0
