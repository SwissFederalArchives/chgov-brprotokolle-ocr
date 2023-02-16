import { createSelector } from 'reselect';

import {
  getWindowConfig,
  getVisibleCanvases,
  getTheme,
} from 'mirador/dist/es/src/state/selectors';
import { miradorSlice } from 'mirador/dist/es/src/state/selectors/utils';

const defaultConfig = {
  // Enable the text selection and display feature
  enabled: true,
  // Default opacity of text overlay
  opacity: 0.3,
  // Overlay text overlay by default
  visible: true,
  // Try to automatically determine the text and background color
  useAutoColors: false,
  // Color of rendered box, used as a fallback if auto-detection is enabled and fails
  color: '#00FF7B',
  // Skip empty lines
  skipEmptyLines: true,
  // If enabled, the user can submit corrections to the text via email
  correction: {
    enabled: false,
    emailRecipient: null,
    emailUrlKeepParams: [],
  },
  // Render mode for text overlay options
  optionsRenderMode: 'complex',
};

/** Selector to get text display options for a given window */
export const getWindowTextOverlayOptions = createSelector(
  [getWindowConfig, getTheme],
  ({ textOverlay }, { typography: { fontFamily } }) => ({
    fontFamily,
    ...defaultConfig,
    ...(textOverlay ?? {}),
  })
);

/** Selector to get all loaded texts */
export const getTexts = (state) => miradorSlice(state).texts;

/** Selector for text on all visible canvases */
export const getTextsForVisibleCanvases = createSelector(
  [getVisibleCanvases, getTexts],
  (canvases, allTexts) => {
    if (!allTexts || !canvases) return [];
    const texts = canvases.map((canvas) => allTexts[canvas.id]);
    if (texts.every((t) => t === undefined)) {
      return [];
    }
    return texts;
  }
);
