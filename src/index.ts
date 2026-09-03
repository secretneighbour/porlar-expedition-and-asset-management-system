/**
 * Polar Expedition and Asset Management System
 * Core exports for programmatic consumption and module integration
 */

export { default as App } from './App';
export { Header } from './components/Header';
export { PolarMap } from './components/PolarMap';
export { AssetManagement } from './components/AssetManagement';
export { ExpeditionTracker } from './components/ExpeditionTracker';
export { LogisticsSupplies } from './components/LogisticsSupplies';
export { EnvironmentalTelemetry } from './components/EnvironmentalTelemetry';
export { DispatchLogbook } from './components/DispatchLogbook';
export { EmergencyModal } from './components/EmergencyModal';
export { AddAssetModal } from './components/AddAssetModal';
export { AddExpeditionModal } from './components/AddExpeditionModal';

export * from './types';
export * from './data/polarData';
