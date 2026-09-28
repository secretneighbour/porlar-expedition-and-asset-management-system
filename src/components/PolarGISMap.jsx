import React from 'react';
import { PolarGISMap as PolarGISMapTs } from './PolarGISMap';

/**
 * PolarGISMap JSX wrapper for React + Leaflet tactical dashboard
 * Fully compatible with both TypeScript and standard JavaScript module imports.
 */
export const PolarGISMap = (props) => {
  return <PolarGISMapTs {...props} />;
};

export default PolarGISMap;
