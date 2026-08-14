/* @jrk/design — React layer.
 *
 * These components emit the same `jrk-*` class names as the plain-CSS
 * library, so a React app and a Jinja template render identically. The CSS
 * must be loaded once, at the app root:
 *
 *   import '@jrk/design/css/index.css';
 *
 * There is no Tailwind dependency here. A Tailwind app can still use these
 * components and add utilities alongside them via the `className` prop. */

export { cx, variantClass } from './utils';

export { Icon, STATUS_ICON } from './Icon';
export type { IconName, IconProps } from './Icon';

export { Button, ButtonGroup } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonGroupProps } from './Button';

export { Input, Select, Textarea, Checkbox, Switch } from './Field';
export type { InputProps, SelectProps, TextareaProps, CheckboxProps, SwitchProps } from './Field';

export { List, ListRow } from './List';
export type { ListProps, ListRowProps } from './List';

export { Card, Empty, Alert, Spinner, HoverCard, HoverCardAnchor } from './Card';
export type { CardProps, EmptyProps, AlertProps, HoverCardProps, HoverCardRow } from './Card';

export { Expander, ExpanderRow } from './Expander';
export type { ExpanderProps, ExpanderRowProps, ExpanderTone, ExpanderHue } from './Expander';

export { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu';
export type { MenuProps, MenuItemProps } from './Menu';

export { Badge, Status, Tag } from './Badge';
export type { BadgeProps, StatusProps, TagProps, StatusTone } from './Badge';

export { Stat, StatRow, Delta, Sparkline, VividStat, MiniBars, Gauge } from './Stat';
export type { StatProps, DeltaProps, VividStatProps, VividTone } from './Stat';

export { DataTable, CellBar, CellBarSigned, HeatLegend, cellHeatProps, divergingStep } from './DataTable';
export type { DataTableProps, Column, SortDir } from './DataTable';

export {
  ChartCard,
  Legend,
  BarList,
  LineChart,
  MAX_SERIES,
  MAX_SERIES_ALL_PAIRS,
} from './Chart';
export type { ChartCardProps, LegendProps, BarListProps, BarListItem, LineChartProps, Series } from './Chart';

export { OrgChart, OrgNode } from './Org';
export type { OrgChartProps, OrgNodeProps } from './Org';

export { AuthLayout, SsoButton } from './Auth';
export type { AuthLayoutProps, SsoButtonProps } from './Auth';

export { SpotlightGuide } from './Spotlight';
export type {
  SpotlightGuideProps,
  SpotlightStep,
  SpotlightTarget,
  SpotlightTerm,
} from './Spotlight';

export {
  AppShell,
  Sidebar,
  SidebarAction,
  NavItem,
  NavGroup,
  NavMenu,
  NavMenuItem,
  NavMenuSeparator,
  Main,
  Topbar,
  Content,
  PageHeader,
  Tabs,
  TabPanel,
  setTheme,
} from './Shell';
export type {
  SidebarProps,
  SidebarActionProps,
  NavItemProps,
  NavMenuProps,
  TopbarProps,
  PageHeaderProps,
  TabsProps,
} from './Shell';
