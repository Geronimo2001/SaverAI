import {
  AlertTriangle,
  Bell,
  Car,
  Coffee,
  CreditCard,
  Home,
  MapPin,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Target,
  Utensils,
  Wallet,
  WalletCards,
  Wifi,
} from "lucide-react"

export const webIcons = {
  "alert-triangle": AlertTriangle,
  bell: Bell,
  car: Car,
  coffee: Coffee,
  "credit-card": CreditCard,
  home: Home,
  "map-pin": MapPin,
  "receipt-text": ReceiptText,
  "shield-check": ShieldCheck,
  "shopping-bag": ShoppingBag,
  "sliders-horizontal": SlidersHorizontal,
  sparkles: Sparkles,
  target: Target,
  utensils: Utensils,
  wallet: Wallet,
  "wallet-cards": WalletCards,
  wifi: Wifi,
} as const

export function getWebIcon(name: string) {
  return webIcons[name as keyof typeof webIcons] ?? Wallet
}
