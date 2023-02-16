import { updateWindow, setCanvas } from 'mirador/dist/es/src/state/actions';
import {
  getCanvasIndex,
  getCurrentCanvas,
  getWindowConfig,
  getContainerId,
  getManifestTitle,
  getManifestMetadata,
} from 'mirador/dist/es/src/state/selectors';

import { textsReducer } from './state/reducers';
import { highlightLine } from './state/actions';
import textSaga from './state/sagas';
import { getTextsForVisibleCanvases, getWindowTextOverlayOptions } from './state/selectors';
import MiradorTextOverlay from './components/MiradorTextOverlay';
import OverlaySettings from './components/settings/OverlaySettings';
import MiradorOcrWindowViewer from './components/MiradorOcrWindowViewer';

export default [
  {
    component: MiradorOcrWindowViewer,
    target: 'WindowViewer',
    mode: 'wrap',
    mapDispatchToProps: (dispatch, { windowId }) => ({
      doHighlightLine: (canvasId, line, initiator) =>
        dispatch(highlightLine(canvasId, line, initiator)),
      doSetCanvas: (canvasId) => dispatch(setCanvas(windowId, canvasId)),
    }),
    mapStateToProps: (state, { id, manifestId, windowId }) => ({
      pageTexts: getTextsForVisibleCanvases(state, { windowId }).map((canvasText) => {
        if (canvasText === undefined || canvasText.isFetching) {
          return undefined;
        }
        return {
          ...canvasText.text,
          canvasId: canvasText.canvasId,
          source: canvasText.source,
          color: canvasText.color,
        };
      }),
      manifestMetadata: getManifestMetadata(state, { companionWindowId: id, manifestId, windowId }),
      manifestTitle: getManifestTitle(state, { windowId }),
      highlightedLine: getTextsForVisibleCanvases(state, { windowId })
        ?.map((page) => page?.text?.lines?.filter((line) => line?.isHighlighted))
        .flat(99)
        .shift(),
      textsAvailable: getTextsForVisibleCanvases(state, { windowId }).length > 0,
      textsFetching: getTextsForVisibleCanvases(state, { windowId }).some((t) => t?.isFetching),
      canvasId: (getCurrentCanvas(state, { windowId }) || {}).id,
      canvasIndex: getCanvasIndex(state, { windowId }),
      windowId,
      ...getWindowTextOverlayOptions(state, { windowId }),
    }),
    reducers: {
      texts: textsReducer,
    },
    saga: textSaga,
  },
  {
    component: MiradorTextOverlay,
    mapDispatchToProps: (dispatch) => ({
      doHighlightLine: (canvasId, line, initiator) =>
        dispatch(highlightLine(canvasId, line, initiator)),
    }),
    mapStateToProps: (state, { windowId }) => ({
      pageTexts: getTextsForVisibleCanvases(state, { windowId }).map((canvasText) => {
        if (canvasText === undefined || canvasText.isFetching) {
          return undefined;
        }
        return {
          ...canvasText.text,
          canvasId: canvasText.canvasId,
          source: canvasText.source,
          color: canvasText.color,
        };
      }),
      highlightedLine: getTextsForVisibleCanvases(state, { windowId })
        ?.map((page) => page?.text?.lines?.filter((line) => line?.isHighlighted))
        .flat(99)
        .shift(),
      windowId,
      ...getWindowTextOverlayOptions(state, { windowId }),
    }),
    mode: 'add',
    target: 'OpenSeadragonViewer',
  },
  {
    component: OverlaySettings,
    mapDispatchToProps: (dispatch, { windowId }) => ({
      updateWindowTextOverlayOptions: (options) =>
        dispatch(updateWindow(windowId, { textOverlay: options })),
    }),
    mapStateToProps: (state, { windowId }) => {
      const { imageToolsEnabled = false } = getWindowConfig(state, { windowId });
      return {
        containerId: getContainerId(state),
        imageToolsEnabled,
        textsAvailable: getTextsForVisibleCanvases(state, { windowId }).length > 0,
        textsFetching: getTextsForVisibleCanvases(state, { windowId }).some((t) => t?.isFetching),
        pageColors: getTextsForVisibleCanvases(state, { windowId })
          .filter((p) => p !== undefined)
          .map(({ color }) => ({ color })),
        windowTextOverlayOptions: getWindowTextOverlayOptions(state, { windowId }),
      };
    },
    mode: 'add',
    target: 'OpenSeadragonViewer',
  },
];
