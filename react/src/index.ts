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

export { Button, ButtonGroup } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonGroupProps } from './Button';

export { Input, Select, Textarea, Checkbox, Switch } from './Field';
export type { InputProps, SelectProps, TextareaProps, CheckboxProps, SwitchProps } from './Field';

export { Card, Empty, Alert, Spinner } from './Card';
export type { CardProps, EmptyProps, AlertProps } from './Card';

export { Badge, Status, Tag } from './Badge';
export type { BadgeProps, StatusProps, TagProps, StatusTone } from './Badge';

export { Stat, StatRow, Delta, Sparkline } from './Stat';
export type { StatProps, DeltaProps } from './Stat';

export { DataTable, CellBar } from './DataTable';
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

export {
  AppShell,
  Sidebar,
  NavItem,
  NavGroup,
  Main,
  Topbar,
  Content,
  PageHeader,
  Tabs,
  TabPanel,
  setTheme,
} from './Shell';
export type { SidebarProps, NavItemProps, PageHeaderProps, TabsProps } from './Shell';
