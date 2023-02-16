import Mirador from 'mirador/dist/es/src/index';
import ocrHelperPlugin from '../../src';

const viewerConfig = {
  id: 'demo',
  workspace: {
    allowNewWindows: false,
    isWorkspaceAddVisible: false,
  },
  window: {
    allowClose: true,
    textOverlay: {
      enabled: true,
      visible: true,
      skipEmptyLines: true,
      correction: {
        enabled: true,
        emailUrlKeepParams: ['manifest'],
        emailRecipient: null,
      },
      optionsRenderMode: 'simple',
    },
    sideBarOpenByDefault: true,
    panels: {
      info: true,
    },
  },
  thumbnailNavigation: {
    defaultPosition: 'far-right',
  },
  windows: [
    {
      manifestId: 'https://api.chgov.bar.admin.ch/manifests/32330413/32330413.json',
    },
  ],
  language: 'de',
  locales: {
    en: {},
    de: {}
  }
};

Mirador.viewer(viewerConfig, [...ocrHelperPlugin]);
