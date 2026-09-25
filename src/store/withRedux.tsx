import React from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from './index';
import {ForegroundAlarmModal} from '../components/ForegroundAlarmModal';

export function withRedux<P extends object>(Component: React.ComponentType<P>) {
  return function ReduxConnectedComponent(props: P) {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Component {...props} />
          <ForegroundAlarmModal
            componentId={(props as {componentId?: string}).componentId}
          />
        </PersistGate>
      </Provider>
    );
  };
}
