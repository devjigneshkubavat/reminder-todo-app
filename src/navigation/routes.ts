import {waitForStoreReady} from '../store';
import {Navigation, OptionsModalPresentationStyle} from 'react-native-navigation';

export const screens = {
  home: 'ReminderApp.Home',
  history: 'ReminderApp.History',
  dates: 'ReminderApp.Dates',
  add: 'ReminderApp.Add',
  settings: 'ReminderApp.Settings',
  modal: 'ReminderApp.Modal',
  tabButton: 'ReminderApp.TabButton',
  passcode: 'ReminderApp.Passcode',
  security: 'ReminderApp.Security',
};

export type PasscodeMode = 'create' | 'confirm' | 'unlock' | 'error';

let rootChange: Promise<unknown> = Promise.resolve();
let addModalOpen = false;
let homeMounted = false;
let lockVisible = false;
const lockId = 'PASSCODE_LOCK';

// Keep the outgoing screen/splash until the incoming React view has content.
export const screenOptions = {
  topBar: {visible: false},
  layout: {backgroundColor: '#ffffff', componentBackgroundColor: '#ffffff'},
  animations: {setRoot: {waitForRender: true, enabled: false}},
};

function setRoot(root: Parameters<typeof Navigation.setRoot>[0]['root']) {
  lockVisible = false;
  rootChange = rootChange.catch(() => {}).then(() => Navigation.setRoot({root}));
  return rootChange;
}

export function showPasscode(mode: PasscodeMode, message?: string) {
  addModalOpen = false;
  if (mode === 'unlock' && homeMounted) {
    if (lockVisible) return rootChange;
    lockVisible = true;
    rootChange = rootChange.catch(() => {}).then(() => Navigation.showModal({
      component: {
        id: lockId,
        name: screens.passcode,
        passProps: {mode, message},
        options: {
          ...screenOptions,
          modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
          modal: {swipeToDismiss: false},
          hardwareBackButton: {dismissModalOnPress: false},
          animations: {showModal: {enabled: false}, dismissModal: {enabled: false}},
        },
      },
    })).catch(error => { lockVisible = false; throw error; });
    return rootChange;
  }
  homeMounted = false;
  return setRoot({
    component: {
      name: screens.passcode,
      passProps: {mode, message},
      options: {topBar: {visible: false}},
    },
  });
}

export async function showHome(initialTabIndex = 0) {
  await waitForStoreReady();
  if (homeMounted && lockVisible) {
    await rootChange;
    await Navigation.dismissModal(lockId);
    lockVisible = false;
    return;
  }
  addModalOpen = false;
  await setRoot({
    bottomTabs: {
      id: 'MAIN_TABS',
      children: [
        {component: {name: screens.home, options: {bottomTab: {component: {name: screens.tabButton, passProps: {label: 'Home', tabIndex: 0}}}}}},
        {component: {name: screens.history, options: {bottomTab: {component: {name: screens.tabButton, passProps: {label: 'History', tabIndex: 1}}}}}},
        {component: {name: screens.add, options: {bottomTab: {component: {name: screens.tabButton, passProps: {label: '+', tabIndex: 2}}, selectTabOnPress: false}}}},
        {component: {name: screens.dates, options: {bottomTab: {component: {name: screens.tabButton, passProps: {label: 'Dates', tabIndex: 3}}}}}},
        {component: {name: screens.settings, options: {bottomTab: {component: {name: screens.tabButton, passProps: {label: 'Settings', tabIndex: 4}}}}}},
      ],
      options: {...screenOptions, bottomTabs: {tabsAttachMode: 'onSwitchToTab', currentTabIndex: initialTabIndex, customRow: {height: 64, backgroundColor: '#ffffff', cornerRadius: 0, horizontalMargin: 0}}},
    },
  });
  homeMounted = true;
}

export function showSecurity() {
  homeMounted = false;
  addModalOpen = false;
  return setRoot({component: {name: screens.security, options: {topBar: {visible: false}}}});
}

export function showSecurityPasscode(securityAction: 'enable' | 'change') {
  homeMounted = false;
  return setRoot({component: {
    name: screens.passcode,
    passProps: {mode: 'create', securityAction},
    options: {topBar: {visible: false}},
  }});
}

import {TaskItem} from '../store/tasksSlice';

export async function showAddModal(taskToEdit?: TaskItem) {
  if (addModalOpen) {
    return;
  }
  addModalOpen = true;
  try {
    await Navigation.showModal({
      component: {
        name: screens.modal,
        passProps: {
          taskToEdit,
        },
        options: {
          topBar: {visible: false},
          modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
          layout: {backgroundColor: 'transparent', componentBackgroundColor: 'transparent'},
        },
      },
    });
  } catch (error) {
    addModalOpen = false;
    throw error;
  }
}

export function showEditModal(taskToEdit: TaskItem) {
  return showAddModal(taskToEdit);
}

export function markAddModalDismissed() {
  addModalOpen = false;
}

export function isAddModalOpen() {
  return addModalOpen;
}
