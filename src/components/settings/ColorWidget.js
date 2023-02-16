import React from 'react';
import PropTypes from 'prop-types';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';
import ResetColorsIcon from '@material-ui/icons/SettingsBackupRestore';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { alpha } from '@material-ui/core/styles/colorManipulator';

import ColorInput from './ColorInput';
import { toHexRgb } from '../../lib/color';

const useStyles = makeStyles(({ palette, breakpoints }) => {
  const bubbleBg = palette.shades.main;
  return {
    root: {
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      top: 48,
      zIndex: 100,
      borderRadius: [[0, 0, 25, 25]],
      backgroundColor: alpha(bubbleBg, 0.8),
      [breakpoints.down('sm')]: {
        flexDirection: 'row',
        right: 48,
        top: 'auto',
        borderRadius: [[25, 0, 0, 25]],
        // Truncate right box shadow
        clipPath: 'inset(-8px 0 -8px -8px)',
      },
    },
    temp: {
      height: 40,
      padding: [[8, 8, 0, 8]],
      margin: (props) => [[props.showResetButton ? -12 : 0, 0, 0, 0]],
      [breakpoints.down('sm')]: {
        height: 48,
        width: 40,
        padding: [[8, 0, 8, 8]],
        marginTop: 0,
        margin: (props) => [[0, 0, 0, props.showResetButton ? -12 : 0]],
      },
    },
    foreground: {
      zIndex: -5,
      height: 40,
      padding: [[0, 8, 8, 8]],
      margin: (props) => [[props.showResetButton ? 0 : 12, 0, 0, 0]],
      [breakpoints.down('sm')]: {
        height: 48,
        width: 40,
        padding: [[8, 8, 8, 0]],
        marginTop: 0,
        marginLeft: -6,
        margin: (props) => [[0, 0, 0, props.showResetButton ? 0 : 12]],
      }
    }
  };
});

/** Widget to update text and background color */
const ColorWidget = ({
  color,
  onChange,
  t,
  pageColors,
  useAutoColors,
  containerId,
}) => {
  const showResetButton =
    !useAutoColors && pageColors && pageColors.some((c) => c && c.color);
  const classes = useStyles({ showResetButton });

  return (
    <div className={`MuiPaper-elevation4 ${classes.root}`}>
      {showResetButton && (
        <MiradorMenuButton
          containerId={containerId}
          aria-label={t('resetColor')}
          onClick={() =>
            onChange({
              useAutoColors: true,
              color: pageColors.map((cs) => cs.color).filter((x) => x)[0] ?? color,
            })
          }
        >
          <ResetColorsIcon />
        </MiradorMenuButton>
      )}
      <ColorInput
        title={t('color')}
        autoColors={useAutoColors ? pageColors.map((colors) => colors.color) : undefined}
        color={color}
        onChange={(color) => {
          // Lackluster way to check if selection was canceled: The chance of users picking
          // the exact same colors as the autodetected one is extremely slim, so if we get that,
          // the user probably aborted the color picking and we don't have to update the color
          // settings.
          if (useAutoColors && color === toHexRgb(pageColors?.[0]?.color)) {
            return;
          }
          onChange({ color: color, useAutoColors: false });
        }}
        className={classes.foreground}
      />
    </div>
  );
};
ColorWidget.propTypes = {
  containerId: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  useAutoColors: PropTypes.bool.isRequired,
  pageColors: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
    })
  ).isRequired,
};

export default ColorWidget;
