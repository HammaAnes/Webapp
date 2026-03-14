export const buttonVariants = {
  base: 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]',

  variants: {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary shadow-sm',
    secondary: 'bg-accent text-white hover:bg-accent-dark focus:ring-accent shadow-sm',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
    warning: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400',
    link: 'text-accent hover:text-accent-dark underline-offset-4 hover:underline focus:ring-accent',
  },

  sizes: {
    xs: 'px-3 py-1.5 text-xs rounded-md gap-1',
    sm: 'px-4 py-2 text-sm rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2',
    xl: 'px-8 py-4 text-lg rounded-xl gap-2.5',
  },
} as const;

export const inputVariants = {
  base: 'w-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2',

  variants: {
    default: 'border border-gray-300 bg-white text-gray-900 focus:border-accent focus:ring-accent/20',
    error: 'border border-red-300 bg-white text-gray-900 focus:border-red-500 focus:ring-red-500/20',
    success: 'border border-emerald-300 bg-white text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20',
  },

  sizes: {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-4 py-3 text-base rounded-lg',
  },
} as const;

export const cardVariants = {
  base: 'bg-white overflow-hidden transition-all duration-200',

  variants: {
    default: 'border border-gray-200 shadow-sm',
    elevated: 'shadow-md border border-gray-100',
    outlined: 'border-2 border-gray-200',
    ghost: 'border-0 shadow-none',
  },

  interactive: 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',

  padding: {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },

  radius: {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
  },
} as const;

export const badgeVariants = {
  base: 'inline-flex items-center font-medium transition-colors',

  variants: {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent-dark',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    neutral: 'bg-gray-100 text-gray-700',
  },

  sizes: {
    xs: 'px-2 py-0.5 text-xs rounded',
    sm: 'px-2.5 py-0.5 text-xs rounded-md',
    md: 'px-3 py-1 text-sm rounded-md',
    lg: 'px-4 py-1.5 text-sm rounded-lg',
  },
} as const;

export const alertVariants = {
  base: 'rounded-lg p-4 flex items-start gap-3',

  variants: {
    success: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border border-amber-200 text-amber-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
  },
} as const;

export const skeletonVariants = {
  base: 'animate-pulse bg-gray-200 rounded',

  shapes: {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24',
    card: 'h-48 w-full',
  },
} as const;

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
