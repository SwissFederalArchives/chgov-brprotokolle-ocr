import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Rect } from 'openseadragon';
import PageTextDisplay from './PageTextDisplay';

/** Overlay that renders OCR or transcription text in a SVG.
 *
 * Synchronizes the text position to the underlying OpenSeadragon viewer viewport so that
 * every line or word (depending on the granularity of the text/transcription) is rendered
 * at the correct position.
 */
class MiradorTextOverlay extends Component {
  /** Register refs that allow us to directly access the actual render components */
  constructor(props) {
    super(props);

    this.renderRefs = [React.createRef(), React.createRef()];
    this.containerRef = React.createRef();
    this.osdUpdateViewportHandler = this.onUpdateViewport.bind(this);
  }

  /** Register OpenSeadragon callback on initial mount */
  componentDidMount() {
    const { enabled, viewer } = this.props;

    if (enabled && viewer) {
      viewer.addHandler('update-viewport', this.osdUpdateViewportHandler);
    }
    this.patchAnnotationOverlay();
  }

  componentWillUnmount() {
    const { viewer } = this.props;
  
    // Remove OpenSeadragon viewport update callback
    if (viewer) {
      viewer.removeHandler('update-viewport', this.osdUpdateViewportHandler);
    }
  }

  /** Register OpenSeadragon callback when viewport changes */
  componentDidUpdate(prevProps) {
    const { enabled, viewer, pageTexts, color, useAutoColors, visible, highlightedLine } =
      this.props;
    let { opacity } = this.props;

    this.patchAnnotationOverlay();

    // OSD instance becomes available, register callback
    if (enabled && viewer && viewer !== prevProps.viewer) {
      viewer.addHandler('update-viewport', this.osdUpdateViewportHandler);
    }
    // Newly enabled, force initial setting of state from OSD
    const newlyEnabled =
      (this.shouldRender() && !this.shouldRender(prevProps)) ||
      pageTexts.filter(this.shouldRenderPage).length !==
        prevProps.pageTexts.filter(this.shouldRenderPage).length;

    if (newlyEnabled) {
      this.onUpdateViewport();
    }

    if (viewer && highlightedLine !== prevProps.highlightedLine && highlightedLine?.initiator !== 'overlay') {
      this.fitBounds(viewer, highlightedLine);
    }

    // Manually update SVG colors for performance reasons
    // eslint-disable-next-line require-jsdoc
    const hasPageColors = (text = {}) => text.color !== undefined;
    if (
      visible !== prevProps.visible ||
      opacity !== prevProps.opacity ||
      color !== prevProps.color ||
      useAutoColors !== prevProps.useAutoColors ||
      pageTexts.filter(hasPageColors).length !== prevProps.pageTexts.filter(hasPageColors).length
    ) {
      if (!visible) {
        opacity = 0;
      }
      this.renderRefs.forEach((ref, idx) => {
        if (!ref.current) {
          return;
        }
        let c = color;
        if (useAutoColors) {
          const { color: newC } = pageTexts[idx];
          if (newC) {
            this.componentDidCatch = newC;
          }
        }
        ref.current.updateColors(c, opacity);
      });
    }
  }

  /** OpenSeadragon viewport update callback */
  onUpdateViewport() {
    // Do nothing if the overlay is not currently rendered
    if (!this.shouldRender) {
      return;
    }

    const { viewer, canvasWorld } = this.props;

    // Determine new scale factor and position for each page
    const vpBounds = viewer.viewport.getBounds(true);
    const viewportZoom = viewer.viewport.getZoom(true);
    if (this.containerRef.current) {
      const { clientWidth: containerWidth, clientHeight: containerHeight } = viewer.container;
      const flip = viewer.viewport.getFlip();
      const rotation = viewer.viewport.getRotation();
      const transforms = [];
      if (flip) {
        transforms.push(`translate(${containerWidth}px, 0px)`);
        transforms.push('scale(-1, 1)');
      }
      if (rotation !== 0) {
        switch (rotation) {
          case 90:
            transforms.push(`translate(${containerWidth}px, 0px)`);
            break;
          case 180:
            transforms.push(`translate(${containerWidth}px, ${containerHeight}px)`);
            break;
          case 270:
            transforms.push(`translate(0px, ${containerHeight}px)`);
            break;
          default:
            console.error(`Unsupported rotation: ${rotation}`);
        }
        transforms.push(`rotate(${rotation}deg)`);
      }
      this.containerRef.current.style.transform = transforms.join(' ');
    }
    for (let itemNo = 0; itemNo < viewer.world.getItemCount(); itemNo += 1) {
      // Skip update if we don't have a reference to the PageTextDisplay instance
      if (!this.renderRefs[itemNo].current) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const img = viewer.world.getItemAt(itemNo);
      const canvasDims = canvasWorld.canvasDimensions[itemNo];
      const canvasWorldOffset =
        itemNo > 0
          ? img.source.dimensions.x -
            canvasDims.width +
            canvasWorld.canvasDimensions[itemNo - 1].width
          : 0;
      const canvasWorldScale = img.source.dimensions.x / canvasDims.width;
      this.renderRefs[itemNo].current.updateTransforms(
        img.viewportToImageZoom(viewportZoom),
        vpBounds.x * canvasWorldScale - canvasWorldOffset,
        vpBounds.y * canvasWorldScale
      );
    }
  }

  fitBounds(viewer, line) {
    const isImmediate = false;
    const offset = { x: 0.2, y: 0.2 };

    if (!viewer || !line) return;

    const bounds = new Rect(
      parseInt(line.x - (line.width * offset.x) / 2),
      parseInt(line.y - (line.width * offset.y) / 2),
      parseInt(line.width + line.width * offset.x),
      parseInt(line.height + line.width * offset.y)
    );

    setTimeout(() => {
      viewer.viewport.fitBounds(bounds, isImmediate);
    }, 10);
  }

  /** If the page should be rendered */
  shouldRenderPage = ({ lines } = {}) =>
    lines &&
    lines.length > 0 &&
    lines.some(({ text, spans }) => text || (spans && spans.length > 0));

  /** If the overlay should be rendered at all */
  shouldRender(props) {
    const { enabled, pageTexts } = props ?? this.props;
    return enabled && pageTexts.length > 0;
  }

  /**
   * Patch the neighboring AnnotationOverlay container to work with the text overlay.
   *
   * FIXME: This is almost criminally hacky and brittle.
   *
   * If Mirador renders an annotation overlay, it can either:
   * - be rendered above the text overlay and intercept pointer events,
   *   preventing selection
   * - or be rendered below the text overlay, i.e. we occlude the annotations
   *
   * To fix both cases, we hard-code the z-index on the annotation overlay so
   * it's always above us and set `pointer-events` to `none` if selectability
   * is active (this has the effect of the annotation overlay becoming
   * 'transparent' to pointer events, i.e. they reach us and allow the user
   * to select text).
   *
   * We have to resort to manual DOM-wrangling since an attempt at using a
   * wrapping plugin component around `AnnotationOverlay` fails on multiple
   * levels:
   * - Adjusting the styles on the wrapping element itself fails since the
   *   annotation overlay renders with `React.createPortal`, i.e. outside of the
   *   plugin components's DOM subtree.
   * - Accessing the `ref` on `AnnotationOverlay` fails since we can't get a
   *   handle on it via `props.children` in the wrapping component
   *
   *  So this is it, it's ugly, it's brittle, it's painful, but it works (for now...).
   */
  patchAnnotationOverlay() {
    const { enabled } = this.props;
    if (!enabled) {
      return;
    }
    const annoCanvasContainer = this.containerRef.current?.parentElement
      // This selector will currently only match the AnnotationOverlay's `canvas` node
      .querySelector('div.openseadragon-canvas > div > canvas')?.parentElement;
    if (annoCanvasContainer) {
      annoCanvasContainer.style.zIndex = 49;
      annoCanvasContainer.style.pointerEvents = null;
    }
  }

  /** Render the text overlay SVG */
  render() {
    const {
      pageTexts,
      visible,
      viewer,
      opacity,
      color,
      useAutoColors,
      fontFamily,
      doHighlightLine,
      highlightedLine,
      skipEmptyLines
    } = this.props;
    if (!this.shouldRender() || !viewer || !pageTexts) {
      return null;
    }
    return ReactDOM.createPortal(
      <div
        ref={this.containerRef}
        style={{
          position: 'absolute',
          zIndex: 49,
          display: visible ? null : 'none',
        }}
      >
        {pageTexts.map((page, idx) => {
          if (!page || !this.shouldRenderPage(page)) {
            return null;
          }
          const {
            canvasId,
            lines,
            source,
            width: pageWidth,
            height: pageHeight,
            color: pageColor,
          } = page;
          return (
            <PageTextDisplay
              ref={this.renderRefs[idx]}
              key={source}
              lines={lines}
              canvasId={canvasId}
              source={source}
              visible={visible}
              opacity={opacity}
              width={pageWidth}
              height={pageHeight}
              color={color}
              fontFamily={fontFamily}
              useAutoColors={useAutoColors}
              pageColors={pageColor ? { color: pageColor } : undefined}
              doHighlightLine={doHighlightLine}
              highlightedLine={highlightedLine}
              viewer={viewer}
              skipEmptyLines={skipEmptyLines}
            />
          );
        })}
      </div>,
      viewer.canvas
    );
  }
}

MiradorTextOverlay.propTypes = {
  canvasWorld: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  enabled: PropTypes.bool,
  opacity: PropTypes.number,
  pageTexts: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  viewer: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  visible: PropTypes.bool,
  color: PropTypes.string,
  fontFamily: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  useAutoColors: PropTypes.bool,
  doHighlightLine: PropTypes.func,
  highlightedLine: PropTypes.object,
  skipEmptyLines: PropTypes.bool,
};

MiradorTextOverlay.defaultProps = {
  canvasWorld: undefined,
  enabled: true,
  opacity: 0.75,
  pageTexts: undefined,
  viewer: undefined,
  visible: false,
  color: '#000000',
  fontFamily: undefined,
  useAutoColors: true,
  doHighlightLine: () => {},
  highlightedLine: null,
  skipEmptyLines: true,
};

export default MiradorTextOverlay;
