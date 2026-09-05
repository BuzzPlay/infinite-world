import {
  ArchiveIcon as Archive,
  ArrowDownIcon as ArrowDown,
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  ArrowUpIcon as ArrowUp,
  BellIcon as Bell,
  BookmarkSimpleIcon as Bookmark,
  BriefcaseIcon as Briefcase,
  CalendarIcon as Calendar,
  CheckIcon as Check,
  CircleIcon as Circle,
  CloudIcon as Cloud,
  CodeIcon as Code,
  DatabaseIcon as Database,
  FileIcon as File,
  FilmStripIcon as Film,
  FolderIcon as Folder,
  GameControllerIcon as Gamepad2,
  GlobeIcon as Globe2,
  HammerIcon as Hammer,
  HeartIcon as Heart,
  QuestionIcon as HelpCircle,
  HouseIcon as Home,
  type Icon,
  KeyIcon as KeyRound,
  LightbulbIcon as Lightbulb,
  LinkIcon as Link,
  LockIcon as Lock,
  MapTrifoldIcon as MapIcon,
  ChatCircleIcon as MessageCircle,
  MonitorIcon as Monitor,
  MoonIcon as Moon,
  MountainsIcon as Mountain,
  PencilIcon as Pencil,
  PlayIcon as Play,
  RocketIcon as Rocket,
  ScissorsIcon as Scissors,
  MagnifyingGlassIcon as Search,
  GearIcon as Settings,
  ShieldIcon as Shield,
  SparkleIcon as Sparkles,
  StarIcon as Star,
  SunIcon as Sun,
  TagIcon as Tag,
  TerminalWindowIcon as Terminal,
  TrashIcon as Trash2,
  TrophyIcon as Trophy,
  UmbrellaIcon as Umbrella,
  MagicWandIcon as WandSparkles,
  WrenchIcon as Wrench,
  XIcon as X,
} from '@phosphor-icons/react';

export interface ProjectIconOption {
  name: string;
  label: string;
  icon: Icon;
}

export const PROJECT_ICON_OPTIONS: ProjectIconOption[] = [
  { name: 'archive', label: 'Archive', icon: Archive },
  { name: 'arrow-down', label: 'Arrow down', icon: ArrowDown },
  { name: 'arrow-left', label: 'Arrow left', icon: ArrowLeft },
  { name: 'arrow-right', label: 'Arrow right', icon: ArrowRight },
  { name: 'arrow-up', label: 'Arrow up', icon: ArrowUp },
  { name: 'bell', label: 'Bell', icon: Bell },
  { name: 'bookmark', label: 'Bookmark', icon: Bookmark },
  { name: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { name: 'calendar', label: 'Calendar', icon: Calendar },
  { name: 'check', label: 'Check', icon: Check },
  { name: 'circle', label: 'Circle', icon: Circle },
  { name: 'cloud', label: 'Cloud', icon: Cloud },
  { name: 'code', label: 'Code', icon: Code },
  { name: 'database', label: 'Database', icon: Database },
  { name: 'file', label: 'File', icon: File },
  { name: 'film', label: 'Film', icon: Film },
  { name: 'folder', label: 'Folder', icon: Folder },
  { name: 'gamepad', label: 'Gamepad', icon: Gamepad2 },
  { name: 'globe', label: 'Globe', icon: Globe2 },
  { name: 'hammer', label: 'Hammer', icon: Hammer },
  { name: 'heart', label: 'Heart', icon: Heart },
  { name: 'help', label: 'Help', icon: HelpCircle },
  { name: 'home', label: 'Home', icon: Home },
  { name: 'key', label: 'Key', icon: KeyRound },
  { name: 'lightbulb', label: 'Lightbulb', icon: Lightbulb },
  { name: 'link', label: 'Link', icon: Link },
  { name: 'lock', label: 'Lock', icon: Lock },
  { name: 'map', label: 'Map', icon: MapIcon },
  { name: 'message', label: 'Message', icon: MessageCircle },
  { name: 'monitor', label: 'Monitor', icon: Monitor },
  { name: 'moon', label: 'Moon', icon: Moon },
  { name: 'mountain', label: 'Mountain', icon: Mountain },
  { name: 'pencil', label: 'Pencil', icon: Pencil },
  { name: 'play', label: 'Play', icon: Play },
  { name: 'rocket', label: 'Rocket', icon: Rocket },
  { name: 'scissors', label: 'Scissors', icon: Scissors },
  { name: 'search', label: 'Search', icon: Search },
  { name: 'settings', label: 'Settings', icon: Settings },
  { name: 'shield', label: 'Shield', icon: Shield },
  { name: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { name: 'star', label: 'Star', icon: Star },
  { name: 'sun', label: 'Sun', icon: Sun },
  { name: 'tag', label: 'Tag', icon: Tag },
  { name: 'terminal', label: 'Terminal', icon: Terminal },
  { name: 'trash', label: 'Trash', icon: Trash2 },
  { name: 'trophy', label: 'Trophy', icon: Trophy },
  { name: 'umbrella', label: 'Umbrella', icon: Umbrella },
  { name: 'wand', label: 'Wand', icon: WandSparkles },
  { name: 'wrench', label: 'Wrench', icon: Wrench },
  { name: 'x', label: 'Close', icon: X },
];

export const PROJECT_ICON_COLORS = [
  { name: 'slate', className: 'text-slate-500' },
  { name: 'red', className: 'text-red-500' },
  { name: 'orange', className: 'text-orange-500' },
  { name: 'amber', className: 'text-amber-500' },
  { name: 'green', className: 'text-green-600' },
  { name: 'blue', className: 'text-blue-500' },
  { name: 'purple', className: 'text-purple-500' },
  { name: 'pink', className: 'text-pink-500' },
] as const;

export type ProjectIconColor = (typeof PROJECT_ICON_COLORS)[number]['name'];

export function projectIconToken(name: string, color: ProjectIconColor = 'slate') {
  return `icon:${name}:${color}`;
}

export function projectIconParts(value?: string) {
  if (!value?.startsWith('icon:')) return null;
  const [, name, color = 'slate'] = value.split(':');
  const option = PROJECT_ICON_OPTIONS.find((item) => item.name === name);
  const colorOption = PROJECT_ICON_COLORS.find((item) => item.name === color);
  return option && colorOption ? { option, color: colorOption } : null;
}

export function ProjectIcon({ value, size = 18 }: { value?: string; size?: number }) {
  const parts = projectIconParts(value);
  if (!parts) return null;
  const Icon = parts.option.icon;
  return <Icon size={size} weight="regular" className={parts.color.className} aria-hidden="true" />;
}
