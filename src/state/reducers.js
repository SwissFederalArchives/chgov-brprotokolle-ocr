import { PluginActionTypes } from './actions';

/** Reducer for global text overlay state */
export const textsReducer = (state = {}, action) => {
  switch (action.type) {
    case PluginActionTypes.DISCOVERED_TEXT:
      return {
        ...state,
        [action.targetId]: {
          ...state[action.targetId],
          canvasId: action.targetId,
          source: action.textUri,
          sourceType: action.sourceType,
        },
      };
    case PluginActionTypes.HIGHLIGHT_LINE:
      return {
        ...state,
        [action.targetId]: {
          ...state[action.targetId],
          text: {
            ...state[action.targetId].text,
            lines: [
              ...state[action.targetId].text.lines.map((line, index) => {
                line.isHighlighted = !line.isHighlighted && action?.line?.x === line.x && action?.line?.y === line.y;
                line.initiator = line.isHighlighted ? action.initiator : null;
                line.index = index
                return line;
              }),
            ],
          },
        },
      };
    case PluginActionTypes.REQUEST_TEXT:
      return {
        ...state,
        [action.targetId]: {
          ...state[action.targetId],
          canvasId: action.targetId,
          isFetching: true,
          source: action.textUri,
        },
      };
    case PluginActionTypes.RECEIVE_TEXT:
      {
        const currentText = state[action.targetId];
        // Don't overwrite the current text if we already have an OCR-sourced
        // text that was completely fetched without an error
        const skipText =
          currentText !== undefined &&
          !currentText.error &&
          !currentText.isFetching &&
          currentText.sourceType === 'ocr';
        if (skipText) return state;
      }
      return {
        ...state,
        [action.targetId]: {
          ...state[action.targetId],
          canvasId: action.targetId,
          isFetching: false,
          source: action.textUri,
          sourceType: action.sourceType,
          text: action.parsedText,
        },
      };
    case PluginActionTypes.RECEIVE_TEXT_FAILURE:
      return {
        ...state,
        [action.targetId]: {
          ...state[action.targetId],
          canvasId: action.targetId,
          error: action.error,
          isFetching: false,
          source: action.textUri,
          sourceType: action.sourceType,
        },
      };
    case PluginActionTypes.RECEIVE_COLORS:
      return {
        ...state,
        [action.targetId]: {
          ...state[action.targetId],
          color: action.color,
        },
      };
    default:
      return state;
  }
};
