import React from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@material-ui/core/styles/colorManipulator';
import withStyles from '@material-ui/core/styles/withStyles';

/** Styles for the overlay SVG */
const styles = () => ({
  boxContainerLine: {
    cursor: 'pointer',
    transition: 'opacity 0.5s ease',
    fill: ({ useAutoColors, pageColors, color, visible, opacity }) => {
      let c = color;
      if (useAutoColors && pageColors) {
        c = pageColors.color;
      }
      let renderOpacity = !visible ? 0 : opacity;

      renderOpacity = renderOpacity - 0.15 > 0 ? renderOpacity - 0.15 : 0;

      return alpha(c, renderOpacity);
    },
    opacity: 0,
    '&:hover': {
      opacity: 1,
    },
  },
  isHighlighted: {
    opacity: 1,
    fill: ({ useAutoColors, pageColors, color, visible, opacity }) => {
      let c = color;
      if (useAutoColors && pageColors) {
        c = pageColors.color;
      }
      const renderOpacity = !visible ? 0 : opacity;

      return alpha(c, renderOpacity);
    },
  },
});

/** Page Text Display component that is optimized for fast panning/zooming
 *
 * NOTE: This component is doing stuff that is NOT RECOMMENDED GENERALLY, like
 *       hacking shouldComponentUpdate to not-rerender on every prop change,
 *       setting styles manually via DOM refs, etc. This was all done to reach
 *       higher frame rates.
 */
class PageTextDisplay extends React.Component {
  /** Set up refs for direct transforms and pointer callback registration */
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.boxContainerRef = React.createRef();
    this.lineRefs = [];
  }

  /** Register pointerdown handler on SVG container */
  componentDidMount() {
    // FIXME: We should be able to use React for this, but it somehow doesn't work
    this.boxContainerRef.current.addEventListener('pointerdown', this.onPointerDown);
    // For mobile Safari <= 12.2
    this.boxContainerRef.current.addEventListener('touchstart', this.onPointerDown);
  }

  /** Unregister pointerdown handler on SVG container */
  componentWillUnmount() {
    this.boxContainerRef.current.removeEventListener('pointerdown', this.onPointerDown);
    this.boxContainerRef.current.removeEventListener('touchstart', this.onPointerDown);
  }

  /** Swallow pointer events if selection is enabled */
  onPointerDown = () => {
    this.props.viewer.gestureSettingsMouse.clickToZoom = false;
  };
  onPointerUp = () => {
    this.props.viewer.gestureSettingsMouse.clickToZoom = true;
  };

  /** Update the CSS transforms for the SVG container, i.e. scale and move the text overlay
   *
   * Intended to be called by the parent component. We use direct DOM access for this instead
   * of props since it is *significantly* faster (30fps vs 60fps on my machine).
   */
  updateTransforms(scaleFactor, x, y) {
    if (!this.containerRef.current) {
      return;
    }
    const { width, height } = this.props;
    // Scaling is done from the center of the container, so we have to update the
    // horizontal and vertical offsets we got from OSD.
    const translateX = ((scaleFactor - 1) * width) / 2 + x * scaleFactor * -1;
    const translateY = ((scaleFactor - 1) * height) / 2 + y * scaleFactor * -1;
    const containerTransforms = [
      `translate(${translateX}px, ${translateY}px)`,
      `scale(${scaleFactor})`,
    ];
    this.containerRef.current.style.display = null;
    this.containerRef.current.style.transform = containerTransforms.join(' ');
  }

  /** Update the opacity of the text and rects in the SVG.
   *
   * Again, intended to be called from the parent, again for performance reasons.
   */
  updateColors(color, opacity) {
    if (!this.boxContainerRef.current) {
      return;
    }
    // We need to apply the colors to the individual rects and texts instead of
    // one of the containers, since otherwise the user's selection highlight would
    // become transparent as well or disappear entirely.
    for (const rect of this.boxContainerRef.current.querySelectorAll('rect')) {
      rect.style.fill = alpha(color, opacity);
    }
  }

  /** Render the page overlay */
  render() {
    const {
      lines,
      canvasId,
      width: pageWidth,
      height: pageHeight,
      classes,
      doHighlightLine,
      skipEmptyLines
    } = this.props;

    const containerStyle = {
      // This attribute seems to be the key to enable GPU-accelerated scaling and translation
      // (without using translate3d) and achieve 60fps on a regular laptop even with huge objects.
      willChange: 'transform',
      position: 'absolute',
      display: 'none', // will be cleared by first update
    };
    const svgStyle = {
      left: 0,
      top: 0,
      width: pageWidth,
      height: pageHeight,
      userSelect: 'none',
      whiteSpace: 'pre',
    };

    const renderLines = !skipEmptyLines || lines.filter((l) => l.width > 0 && l.height > 0 && l.text.trim().length > 0);

    return (
      <div ref={this.containerRef} style={containerStyle}>
        {/**
         * NOTE: We have to render the line background rectangles in a separate SVG and can't
         * include them in the same one as the text. Why? Because doing so breaks text selection in
         * WebKit-based browsers :/
         * It seems that if we render the rectangles first (since we don't want rectangles occluding
         * text), very often when a user's selection leaves the current line rectangle and crosses
         * over to the next, the selection will *end* where the user wanted it to start and instead
         * start from the very top of the page.
         * A simpler solution would've been to just render the line rectangles *after* the text to
         * avoid this issue, but unfortunately SVG determines draw order from the element order,
         * i.e. the rectangles would have completely occluded the text.
         * So we have to resort to this, it's a hack, but it works.
         */}
        <svg className={classes.boxContainer} style={{ ...svgStyle, userSelect: 'none' }}>
          <g ref={this.boxContainerRef}>
            {renderLines.map((line, index) => (
              <rect
                ref={(ref) => {
                  this.lineRefs[index] = ref;
                  return true;
                }}
                className={`${classes.boxContainerLine} ${
                  line.isHighlighted ? classes.isHighlighted : ''
                }`}
                key={`rect-${line.x}.${line.y}`}
                x={line.x}
                y={line.y}
                width={line.width}
                height={line.height}
                onClick={() => {
                  doHighlightLine(canvasId, line, 'overlay');
                }}
              />
            ))}
          </g>
        </svg>
      </div>
    );
  }
}

PageTextDisplay.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string),
  visible: PropTypes.bool.isRequired,
  opacity: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  useAutoColors: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  canvasId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  lines: PropTypes.array.isRequired,
  source: PropTypes.string.isRequired,
  doHighlightLine: PropTypes.func.isRequired,
  viewer: PropTypes.object,
  highlightedLine: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  pageColors: PropTypes.object,
  skipEmptyLines: PropTypes.bool,
};
PageTextDisplay.defaultProps = {
  classes: {},
  pageColors: undefined,
  highlightedLine: null,
};

export default withStyles(styles)(PageTextDisplay);
