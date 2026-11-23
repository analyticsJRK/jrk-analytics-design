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
export type { ButtonProps, ButtonLinkProps, ButtonVariant, ButtonSize, ButtonGroupProps } from './Button';

export {
  AppearanceMenu,
  ThemeControl,
  SkinControl,
  HueSwatches,
  applyTheme,
  applySkin,
  applyVariant,
  applyAppearance,
  readStoredAppearance,
  themeScript,
  isHue,
  isSkinName,
  DEFAULT_HUES,
  DEFAULT_APPEARANCE,
  SKIN_FONT_LINK_ID,
  SKIN_LAYERS,
  SKIN_NAMES,
  VARIANT_ATTRS,
  VARIANT_AXES,
} from './Appearance';
export type {
  ThemePref,
  HueState,
  AppearanceState,
  AppearanceStorage,
  AppearanceChange,
  AppearanceMenuProps,
  ThemeControlProps,
  SkinControlProps,
  HueSwatchesProps,
  SkinLayer,
  SkinName,
  VariantAttr,
  VariantAxis,
  VariantRestriction,
} from './Appearance';

export { Input, Select, Textarea, Checkbox, Switch } from './Field';
export type { InputProps, SelectProps, TextareaProps, CheckboxProps, SwitchProps } from './Field';

export { List, ListRow } from './List';
export type { ListProps, ListRowProps } from './List';

export { Card, Empty, Alert, Spinner, ScreenSpinner, BusySpinner, HoverCard, HoverCardAnchor } from './Card';
export type { CardProps, EmptyProps, AlertProps, SpinnerProps, ScreenSpinnerProps, HoverCardProps, HoverCardRow } from './Card';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { NavProgress, useNavProgress } from './NavProgress';
export type { NavProgressProps } from './NavProgress';

export { beginBusy, trackBusy, useBusy, getBusy, subscribeBusy } from './busy';
export type { BusyState } from './busy';

export { SheetToolbar, SheetFoot } from './Sheet';
export type { SheetToolbarProps } from './Sheet';

export { DockedPanel, PanelHost } from './Panel';
export type { DockedPanelProps, DockedPanelTab } from './Panel';

export { PageSkeleton } from './PageSkeleton';
export type { PageSkeletonProps } from './PageSkeleton';

export { MentionBox, MentionText, findMentions } from './MentionBox';
export type { MentionBoxProps, MentionPerson } from './MentionBox';

export { Expander, ExpanderRow } from './Expander';
export type { ExpanderProps, ExpanderRowProps, ExpanderTone, ExpanderHue } from './Expander';

export { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu';
export type { MenuProps, MenuItemProps } from './Menu';

export { Badge, Status, Tag, Avatar, CountBadge } from './Badge';
export type { BadgeProps, StatusProps, TagProps, StatusTone, AvatarProps, CountBadgeProps } from './Badge';

export { Stat, StatRow, Delta, Sparkline, VividStat, MiniBars, Gauge } from './Stat';
export type {
  StatProps,
  DeltaProps,
  VividStatProps,
  VividTone,
  SemanticTone,
  VividStatTone,
  SparklineProps,
  SparkTone,
  StatRowProps,
} from './Stat';

export { DataTable, CellBar, CellBarSigned, HeatLegend, cellHeatProps, divergingStep } from './DataTable';
export type { DataTableProps, Column, SortDir } from './DataTable';

export {
  TableKit,
  formatTableValue,
  exportNumber,
  exportHeader,
  exportDate,
  shownText,
  toCsv as tableToCsv,
  TABLEKIT_NUMERIC,
} from './TableKit';
export type {
  TableKitProps,
  TableKitColumn,
  TableKitGroup,
  TableKitSort,
  TableKitView,
  TableKitViewCause,
  TableKitExport,
  TableKitExportCell,
  TableKitExportKind,
  TableKitColType,
} from './TableKit';

export { ColumnFilter } from './ColumnFilter';
export type { ColumnFilterProps } from './ColumnFilter';

export {
  passes,
  isActive as isFilterActive,
  inferKind,
  readCell,
  parseNumber,
  parseDate,
  isBlankText,
  listItems,
  valueOptions,
  tagOptions,
  encodeFilter,
  decodeFilter,
  BLANK as FILTER_BLANK,
} from './filterCore';
export type { FilterKind, FilterState, Filters, CellValue, ValueOption } from './filterCore';

export { Combobox } from './Combobox';
export type { ComboboxProps, ComboboxOption } from './Combobox';

export { TableSearch, SearchCount, useTableSearch } from './TableSearch';
export type { TableSearchProps, SearchCountProps, SearchFields } from './TableSearch';

export { useFitHeight } from './useFitHeight';
export type { FitHeightOptions, FitHeight } from './useFitHeight';

export { enhanceTable } from './enhanceTable';
export type { EnhanceTableOptions, EnhancedTable, EnhancedColumn, EnhanceTableState } from './enhanceTable';


export {
  ChartCard,
  Legend,
  BarList,
  LineChart,
  StackBar,
  SeriesTable,
  assertSeriesCount,
  MAX_SERIES,
  MAX_SERIES_ALL_PAIRS,
} from './Chart';
export type {
  ChartCardProps,
  LegendProps,
  BarListProps,
  BarListItem,
  LineChartProps,
  LineChartBand,
  Series,
  StackBarProps,
  StackBarSegment,
  SeriesTableProps,
} from './Chart';

export { ColumnChart } from './ColumnChart';
export type { ColumnChartProps, ColumnSeries } from './ColumnChart';

export { Sankey } from './Sankey';
export type { SankeyProps, SankeyNode, SankeyLink } from './Sankey';

export {
  useContainerWidth,
  useChartTip,
  niceStep,
  axisTicks,
  compactNumber,
  columnPath,
  rectPath,
  runsOf,
  linearFit,
  thinLabels,
  spreadLabels,
} from './chartUtils';

export { Funnel, MAX_FUNNEL_STAGES } from './Funnel';
export type { FunnelProps, FunnelStage } from './Funnel';

export { OrgChart, OrgNode, OrgGroup, assignGroups } from './Org';
export type { OrgChartProps, OrgNodeProps, OrgGroupProps } from './Org';

export { OrgCanvas } from './OrgCanvas';
export type { OrgCanvasProps } from './OrgCanvas';

export { generatedGroupColor, generatedGroupStyle, groupTexture } from './orgPalette';
export type { GeneratedGroupColor } from './orgPalette';

export {
  chartToPng,
  printElement,
  measurePrint,
  printableBox,
  fitScales,
  scalesFor,
  sheetCount,
  naturalSize,
  download,
  exportName,
  PAGE_SIZES,
} from './exportImage';
export type { PageSize, Orientation, FitMode, PrintOptions, PngOptions } from './exportImage';

export { placeFloating, useFloatingPanel } from './floating';

export { AuthLayout, SsoButton } from './Auth';
export type { AuthLayoutProps, SsoButtonProps } from './Auth';

export { SectionNav, SECTION_NAV_HEADINGS } from './SectionNav';
export type { SectionNavProps } from './SectionNav';

export { SubNav, subNavActive } from './SubNav';
export type { SubNavProps, SubNavItem, SubNavGroup, SubNavAlert, SubNavLocation } from './SubNav';

export { NavTypeahead, NAV_TYPEAHEAD_DEFAULTS } from './NavTypeahead';
export type { NavTypeaheadProps } from './NavTypeahead';
export {
  TYPEAHEAD_RESET_MS,
  normalizeTypeaheadLabel,
  isTypeaheadRepeat,
  typeaheadMatch,
  typeaheadOrder,
} from './typeahead';

export { Lede, Steps, Glossary } from './Explain';
export type { LedeProps, StepsProps, Step, GlossaryProps, GlossaryEntry } from './Explain';

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
  SidebarToggle,
  NavItem,
  NavGroup,
  NavDisclosure,
  NavPinButton,
  NavMenu,
  NavMenuItem,
  NavMenuSeparator,
  Main,
  Topbar,
  BrandMark,
  Content,
  PageHeader,
  Tabs,
  TabPanel,
  setTheme,
} from './Shell';
export type {
  AppShellProps,
  SidebarProps,
  SidebarActionProps,
  SidebarToggleProps,
  NavItemProps,
  NavDisclosureProps,
  NavPinButtonProps,
  NavLinkProps,
  NavLinkAs,
  NavMenuProps,
  TopbarProps,
  BrandMarkProps,
  PageHeaderProps,
  TabsProps,
} from './Shell';

export { usd, usdShort, paren, NEGATIVE_MONEY } from './money';
export { NegativeHighlight } from './NegativeHighlight';
export type { NegativeHighlightProps } from './NegativeHighlight';
