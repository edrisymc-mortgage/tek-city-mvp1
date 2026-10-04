// Bundled Lucide icons (no CDN). Use <i data-lucide="name"></i> then call renderIcons(root).
import { createIcons, Rocket, ExternalLink, Image, TrendingUp, LayoutGrid, Square, Menu, Play, Wallet, ShieldCheck, Clock, Hammer, Landmark, X, Check, Copy, Send, Zap, Coins, Star, MapPin, TrainFront, Vote, TriangleAlert, Sparkles, LogOut, User, BadgeCheck, Info, Factory, Radio, Trees, Building2, Anchor, Cpu, Megaphone, Wrench, Newspaper, ChevronRight, Plus, Minus, CircleHelp, Trophy, Users, Dice5, Flame, Lock, RefreshCw, Pause, Gavel, Store, House, CircleCheck, Siren, Vault, Ticket } from "lucide";

const icons = { Rocket, ExternalLink, Image, TrendingUp, LayoutGrid, Square, Menu, Play, Wallet, ShieldCheck, Clock, Hammer, Landmark, X, Check, Copy, Send, Zap, Coins, Star, MapPin, TrainFront, Vote, TriangleAlert, Sparkles, LogOut, User, BadgeCheck, Info, Factory, Radio, Trees, Building2, Anchor, Cpu, Megaphone, Wrench, Newspaper, ChevronRight, Plus, Minus, CircleHelp, Trophy, Users, Dice5, Flame, Lock, RefreshCw, Pause, Gavel, Store, House, CircleCheck, Siren, Vault, Ticket };

export function renderIcons(root = document) {
  createIcons({ icons, attrs: { "stroke-width": 2, "aria-hidden": "true" }, root });
}
