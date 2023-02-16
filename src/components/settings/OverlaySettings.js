/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';
import CloseIcon from '@material-ui/icons/Close';
import SubjectIcon from '@material-ui/icons/Subject';
import OpacityIcon from '@material-ui/icons/Opacity';
import PaletteIcon from '@material-ui/icons/Palette';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import CircularProgress from '@material-ui/core/CircularProgress';
import useTheme from '@material-ui/core/styles/useTheme';
import makeStyles from '@material-ui/core/styles/makeStyles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { alpha } from '@material-ui/core/styles/colorManipulator';

import ButtonContainer from './ButtonContainer';
import OpacityWidget from './OpacityWidget';
import ColorWidget from './ColorWidget';

const useStyles = makeStyles(({ palette, breakpoints }) => {
  const bubbleBg = palette.shades.main;

  return {
    bubbleContainer: {
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: alpha(bubbleBg, 0.8),
      borderRadius: () => [[25, 25, 25, 25]],
      position: 'absolute',
      right: 8,
      // The mirador-image-tools plugin renders itself at the same position,
      // so if it's active, position the menu lower
      top: (props) => (props.imageToolsEnabled ? 66 : 8),
      zIndex: 999,
      [breakpoints.down('sm')]: {
        flexDirection: 'column',
        top: () => 8, // FIXME: Needs to be a func for some reason
        right: (props) => (props.imageToolsEnabled ? 66 : 8),
        borderRadius: (props) => [
          [25, 25, 25, !props.textsFetching && props.open && props.showColorPicker ? 0 : 25],
        ],
      },
    },
  };
});

/** Control text overlay settings  */
const OverlaySettings = ({
  containerId,
  imageToolsEnabled,
  windowTextOverlayOptions,
  textsAvailable,
  textsFetching,
  updateWindowTextOverlayOptions,
  t,
  pageColors
}) => {
  const {
    enabled,
    visible,
    opacity,
    color: defaultColor,
    useAutoColors,
    optionsRenderMode,
  } = windowTextOverlayOptions;
  const [open, setOpen] = useState(enabled && visible);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const theme = useTheme();
  const isSmallDisplay = useMediaQuery(theme.breakpoints.down('sm'));

  const { palette } = useTheme();
  const bubbleBg = palette.shades.main;
  const bubbleC = palette.getContrastText(bubbleBg);
  const toggledBubbleBg = alpha(bubbleC, 0.25);
  const classes = useStyles({
    imageToolsEnabled,
    open,
    showColorPicker,
    textsFetching,
  });

  const color = useAutoColors
    ? pageColors.map((cs) => cs.color).filter((x) => x)[0] ?? defaultColor
    : defaultColor;

  const showAllButtons = open && !textsFetching;

  if (!enabled || !textsAvailable) {
    return null;
  }

  const renderSimple = () => {
    return (
      <div className={`MuiPaper-elevation4 ${classes.bubbleContainer}`}>
        <ButtonContainer withBorder={!textsFetching && open && isSmallDisplay}>
          <MiradorMenuButton
            containerId={containerId}
            aria-label={t('overlayVisible')}
            onClick={() => {
              updateWindowTextOverlayOptions({
                ...windowTextOverlayOptions,
                visible: !visible,
              });
            }}
            disabled={textsFetching}
            aria-pressed={visible}
            style={{ toggledBubbleBg }}
          >
            {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </MiradorMenuButton>
        </ButtonContainer>
      </div>
    );
  };

  const renderComplex = () => {
    /** Button for toggling the menu  */
    const toggleButton = (
      <ButtonContainer withBorder={!textsFetching && open && isSmallDisplay}>
        <MiradorMenuButton
          containerId={containerId}
          aria-expanded={showAllButtons}
          aria-haspopup
          aria-label={open ? t('collapseTextOverlayOptions') : t('expandTextOverlayOptions')}
          disabled={textsFetching}
          onClick={() => setOpen(!open)}
        >
          {showAllButtons ? <CloseIcon /> : <SubjectIcon />}
        </MiradorMenuButton>
      </ButtonContainer>
    );
    return (
      <div className={`MuiPaper-elevation4 ${classes.bubbleContainer}`}>
        {isSmallDisplay && toggleButton}
        {showAllButtons && (
          <>
            <ButtonContainer withBorder paddingPrev={isSmallDisplay ? 8 : 0} paddingNext={8}>
              <MiradorMenuButton
                containerId={containerId}
                aria-label={t('overlayVisible')}
                onClick={() => {
                  updateWindowTextOverlayOptions({
                    ...windowTextOverlayOptions,
                    visible: !visible,
                  });
                  if (showOpacitySlider && visible) {
                    setShowOpacitySlider(false);
                  }
                  if (showColorPicker && visible) {
                    setShowColorPicker(false);
                  }
                }}
                aria-pressed={visible}
                style={{ backgroundColor: visible && toggledBubbleBg }}
              >
                {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </MiradorMenuButton>
            </ButtonContainer>
            <ButtonContainer>
              <MiradorMenuButton
                id="text-opacity-slider-label"
                containerId={containerId}
                disabled={!visible}
                aria-label={t('overlayOpacity')}
                aria-controls="text-opacity-slider"
                aria-expanded={showOpacitySlider}
                onClick={() => setShowOpacitySlider(!showOpacitySlider)}
                style={{
                  backgroundColor: showOpacitySlider && alpha(bubbleC, 0.1),
                }}
              >
                <OpacityIcon />
              </MiradorMenuButton>
              {visible && showOpacitySlider && (
                <OpacityWidget
                  t={t}
                  opacity={opacity}
                  onChange={(newOpacity) =>
                    updateWindowTextOverlayOptions({
                      ...windowTextOverlayOptions,
                      opacity: newOpacity,
                    })
                  }
                />
              )}
            </ButtonContainer>
            <ButtonContainer withBorder={!isSmallDisplay} paddingNext={isSmallDisplay ? 0 : 8}>
              <MiradorMenuButton
                id="color-picker-label"
                containerId={containerId}
                disabled={!visible}
                aria-label={t('colorPicker')}
                aria-controls="color-picker"
                aria-expanded={showColorPicker}
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{
                  backgroundColor: showColorPicker && alpha(bubbleC, 0.1),
                }}
              >
                <PaletteIcon />
              </MiradorMenuButton>
              {visible && showColorPicker && (
                <ColorWidget
                  t={t}
                  containerId={containerId}
                  color={color}
                  pageColors={pageColors}
                  useAutoColors={useAutoColors}
                  onChange={(newOpts) =>
                    updateWindowTextOverlayOptions({
                      ...windowTextOverlayOptions,
                      ...newOpts,
                    })
                  }
                />
              )}
            </ButtonContainer>
          </>
        )}
        {textsFetching && (
          <CircularProgress disableShrink size={50} style={{ position: 'absolute' }} />
        )}
        {!isSmallDisplay && toggleButton}
      </div>
    );
  };

  return optionsRenderMode === 'complex' ? renderComplex() : renderSimple();
};

OverlaySettings.propTypes = {
  containerId: PropTypes.string.isRequired,
  imageToolsEnabled: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
  textsAvailable: PropTypes.bool.isRequired,
  textsFetching: PropTypes.bool.isRequired,
  updateWindowTextOverlayOptions: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  windowTextOverlayOptions: PropTypes.object.isRequired,
  pageColors: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
    })
  ).isRequired,
};

export default OverlaySettings;
