import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CreditCard,
  Expand,
  Gauge,
  Home,
  MapPin,
  Navigation,
  Pencil,
  PieChart,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Target,
  User,
  Utensils,
  Wallet,
  WalletCards,
  Wifi,
  X,
} from "lucide-react-native"

const ICONS = {
  "alert-triangle": AlertTriangle,
  bell: Bell,
  "calendar-days": CalendarDays,
  car: Car,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  coffee: Coffee,
  "credit-card": CreditCard,
  expand: Expand,
  gauge: Gauge,
  home: Home,
  "map-pin": MapPin,
  navigation: Navigation,
  pencil: Pencil,
  "pie-chart": PieChart,
  "receipt-text": ReceiptText,
  "shield-check": ShieldCheck,
  "shopping-bag": ShoppingBag,
  "sliders-horizontal": SlidersHorizontal,
  sparkles: Sparkles,
  target: Target,
  user: User,
  utensils: Utensils,
  wallet: Wallet,
  "wallet-cards": WalletCards,
  wifi: Wifi,
  x: X,
}

export type IconName = keyof typeof ICONS

interface AppIconProps {
  name: IconName | string
  color: string
  size?: number
  strokeWidth?: number
}

export function AppIcon({ name, color, size = 20, strokeWidth = 2.2 }: AppIconProps) {
  const Icon = ICONS[name as IconName] ?? Wallet
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />
}
