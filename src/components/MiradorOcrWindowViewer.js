import React, { Component, lazy, Suspense } from 'react';
import { compose } from 'redux';
import { withTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import PropTypes from 'prop-types';
import { alpha } from '@material-ui/core/styles/colorManipulator';
import withStyles from '@material-ui/core/styles/withStyles';
import BulbIcon from '@material-ui/icons/EmojiObjects';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';
import WindowCanvasNavigationControls from 'mirador/dist/es/src/containers/WindowCanvasNavigationControls';
import htmlRules from 'mirador/dist/es/src/lib/htmlRules';
const OSDViewer = lazy(() => import('mirador/dist/es/src//containers/OpenSeadragonViewer'));

// Styles
const styles = (theme) => ({
  windowViewer: {},
  wrap: {
    display: 'flex',
    flex: 1,
  },
  viewer: {
    position: 'relative',
    display: 'flex',
    flex: 1,
  },
  container: {
    'font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
    'z-index': 1,
    flex: '0 0 auto',
    'background-color': '#ffffff',
    padding: '0.75rem',
    'box-sizing': 'border-box',
    'max-width': '50%',
    height: '100%',
    'overflow-y': 'auto',
    'scroll-behavior': 'smooth',
    'border-left': `2px solid ${alpha('#000000', 0.15)}`,
    display: ({ textsAvailable, visible }) => (textsAvailable && visible ? null : 'none'),
  },
  paragraph: {
    margin: '0.25em 0',
  },
  lineWrap: {
    position: 'relative',
    width: '100%',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      'background-color': ({ color, opacity }) =>
        alpha(color, opacity - 0.15 > 0 ? opacity - 0.15 : 0),
    },
  },
  button: {
    appearance: 'none',
    border: 0,
    display: 'block',
    cursor: 'pointer',
    fontSize: '15.4px',
    padding: '0.5em 2em 0.5em 0.5em',
    lineHeight: '1.2',
    'background-color': 'transparent',
  },
  line: {
    width: '100%',
    'text-align': 'left',
  },
  isHighlighted: {
    'background-color': ({ color, opacity }) => alpha(color, opacity),
    '&:hover': {
      'background-color': ({ color, opacity }) => alpha(color, opacity),
    },
  },
  correction: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: '24px',
    padding: '0.2em 0.25em',
    display: 'none',
    color: theme.palette.primary.main,
    transition: 'color 0.3s ease',
    '&, &:hover': {
      background: 'transparent',
    },
    '&:hover': {
      color: theme.palette.primary.dark
    }
  },
  correctionIcon: {
    fontSize: '1em',
    lineHeight: 0,
    padding: 0,
  },
  showCorrection: {
    display: 'block',
  },
});

const MAX_POLL_ITERATION_LIMIT = 200;

/**
 * Represents a WindowViewer in the mirador workspace. Responsible for mounting
 * OSD and Navigation
 */
class WindowViewer extends Component {
  /** */
  constructor(props) {
    super(props);
    this.state = {};
    this.lineRefs = [];
  }

  componentDidMount() {
    this.highlightLineByQueryParams();
  }

  /** Register OpenSeadragon callback when viewport changes */
  componentDidUpdate(prevProps) {
    const { highlightedLine } = this.props;
    if (
      highlightedLine &&
      highlightedLine?.initiator !== 'text' &&
      highlightedLine !== prevProps.highlightedLine
    ) {
      this.scrollTo(highlightedLine);
    }
  }

  componentWillUnmount() {
    this.lineRefs = [];
  }

  highlightLineByQueryParams() {
    const { doSetCanvas, doHighlightLine } = this.props;
    const lineParam = this.getQuery('line');
    let fetchTextPollIterations = 0;

    if (lineParam) {
      const [newCanvasId, lineX, lineY] = lineParam.split(',');
      if (newCanvasId) {
        doSetCanvas(newCanvasId);
      }

      if (lineX && lineY) {
        // Unfortunately, the text is not available immediately after the canvas is set.
        // We need to poll for it...
        // At the moment, I can't figure out a better approach. :(
        const clearTextPollInterval = setInterval(() => {
          const textIsCompleted = !!this.props.pageTexts.find(
            (text) => text?.canvasId === newCanvasId
          );

          if (textIsCompleted) {
            doHighlightLine(newCanvasId, { x: Number(lineX), y: Number(lineY) }, 'text');
          }
          if (textIsCompleted || fetchTextPollIterations > MAX_POLL_ITERATION_LIMIT) {
            clearInterval(clearTextPollInterval);
          }

          fetchTextPollIterations++;
        }, 300);
      }
    }
  }

  scrollTo({ index }) {
    if (Array.isArray(this.lineRefs)) {
      const element = this.lineRefs[index];
      if (element) {
        let method = null;
        if (typeof element.scrollIntoViewIfNeeded === 'function') {
          method = 'scrollIntoViewIfNeeded';
        } else if (typeof element.scrollIntoView === 'function') {
          method = 'scrollIntoView';
        }

        if (method !== null) {
          element[method]({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      }
    }
  }

  getQuery(q, urlToParse = window.location.search) {
    return (urlToParse.match(new RegExp('[?&]' + q + '=([^&]+)')) || [null, null])[1];
  }

  getEmailLink(line) {
    const { correction, t, manifestMetadata, manifestTitle, canvasId, canvasIndex } = this.props;

    // Get metadata and convert it to a proper structure
    const metadata = manifestMetadata?.reduce(
      (acc, labelValuePair) =>
        acc.concat([
          {
            [labelValuePair.label]: DOMPurify.sanitize(
              labelValuePair.values.join(', '),
              htmlRules['iiif']
            ),
          },
        ]),
      []
    );
    const metadataString = metadata
      .reduce(
        (acc, labelValuePair) =>
          acc.concat([`${Object.keys(labelValuePair)[0]}: ${Object.values(labelValuePair)[0]}`]),
        []
      )
      .join('\r\n');

    // Defining an url which allows the user to open the viewer with the current canvas and line highlighted
    // Current URL is taken as a base, all query parameter are omitted, except for those defined in 'emailUrlKeeyParams' and the line parameter is added.
    const currentUrl = new URL(window.location.href);
    const url = new URL(currentUrl.origin + currentUrl.pathname);
    const params = new URLSearchParams(currentUrl.search);
    for (const [key, value] of params) {
      if (correction.emailUrlKeepParams.includes(key)) {
        url.searchParams.set(key, value);
      }
    }
    url.searchParams.set('line', `${canvasId},${line.x},${line.y}`);

    // add email recipient, if defined
    const to = correction.emailRecipient || '';
    // subject is defined in locales
    const subject = t('ocrCorrectionSubject') || '';
    // body is defined in locales, placeholders are replaced with passed values
    const body =
      t('ocrCorrectionBody', {
        metadata: metadataString,
        signature: manifestTitle,
        text: line.text,
        url: decodeURIComponent(url.href), // decodeURIComponent is needed to avoid encoding issues
        page: canvasIndex + 1,
      }) || '';

    return `mailto:?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  /** */
  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  /**
   * Renders things
   */
  render() {
    const {
      windowId,
      canvasId,
      classes,
      correction,
      skipEmptyLines,
      pageTexts,
      textsAvailable,
      textsFetching,
      doHighlightLine,
      t,
    } = this.props;

    const { hasError } = this.state;

    if (hasError) {
      return <></>;
    }

    return (
      <Suspense fallback={<div />}>
        <div className={classes.wrap}>
          <div className={classes.viewer}>
            <OSDViewer windowId={windowId}>
              <WindowCanvasNavigationControls windowId={windowId} />
            </OSDViewer>
          </div>
          <div className={`ocr-container ${classes.container}`}>
            {textsAvailable &&
              !textsFetching &&
              pageTexts?.map((page) =>
                page?.lines?.map((line, index) => {
                  const showLine =
                    !skipEmptyLines ||
                    (line.width > 0 && line.height > 0 && line.text.trim().length > 0);
                  return (
                    showLine && (
                      <div
                        ref={(ref) => {
                          this.lineRefs[index] = ref;
                          return true;
                        }}
                        className={classes.paragraph}
                        key={`line_${line.x}_${line.y}`}
                      >
                        <div
                          className={`${classes.lineWrap} ${
                            line.isHighlighted && classes.isHighlighted
                          }`}
                        >
                          <button
                            className={`ocr-line ${classes.line} ${classes.button}`}
                            type="button"
                            onClick={() => {
                              doHighlightLine(canvasId, line, 'text');
                            }}
                          >
                            {line.text}
                          </button>
                          {correction?.enabled && line.text && (
                            <MiradorMenuButton
                              size="small"
                              className={`${classes.correction} ${
                                line.isHighlighted && classes.showCorrection
                              }`}
                              aria-label={t('ocrCorrectionTooltip')}
                              onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                window.open(this.getEmailLink(line), '_blank');
                              }}
                            >
                              <BulbIcon className={classes.correctionIcon} />
                            </MiradorMenuButton>
                          )}
                        </div>
                      </div>
                    )
                  );
                })
              )}
          </div>
        </div>
      </Suspense>
    );
  }
}

WindowViewer.propTypes = {
  canvasId: PropTypes.string,
  canvasIndex: PropTypes.number,
  classes: PropTypes.object,
  color: PropTypes.string,
  correction: PropTypes.object,
  skipEmptyLines: PropTypes.bool,
  doHighlightLine: PropTypes.func,
  doSetCanvas: PropTypes.func,
  highlightedLine: PropTypes.object,
  manifestTitle: PropTypes.string,
  manifestMetadata: PropTypes.array,
  opacity: PropTypes.number,
  pageTexts: PropTypes.array,
  t: PropTypes.func.isRequired,
  textsAvailable: PropTypes.bool,
  textsFetching: PropTypes.bool,
  visible: PropTypes.bool,
  windowId: PropTypes.string.isRequired,
};

const enhance = compose(withTranslation(), withStyles(styles));

export default enhance(WindowViewer);
