import React from 'react';
import { createStore } from 'redux';
import { Provider as StoreProvider } from 'react-redux';
import { DefaultTheme, configureFonts, Provider as PaperProvider } from 'react-native-paper';
import reducers from './src/reducers'
import FlashMessage from "react-native-flash-message";
import MyStack from './src/config/routes';
import { criptografar, descriptografar } from './src/necessary/base64';

const fontConfig = {
  web: {
    regular: {
      fontFamily: 'Montserrat-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Montserrat-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'Montserrat-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'Montserrat-thin',
      fontWeight: 'normal',
    },
  },
  ios: {
    regular: {
      fontFamily: 'Montserrat-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily:'Montserrat-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily:  'Montserrat-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'Montserrat-thin',
      fontWeight: 'normal',
    },
  },
  android: {
    regular: {
      fontFamily: 'Montserrat-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily:'Montserrat-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily:  'Montserrat-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'Montserrat-thin',
      fontWeight: 'normal',
    },
  }
};

const theme = {
  ...DefaultTheme,
  fonts: configureFonts(fontConfig),
};

export default (props) => {
  if (!global.btoa) {
    global.btoa = criptografar;
  }
  if (!global.atob) {
    global.atob = descriptografar;
  }

  return (
    <StoreProvider store={createStore(reducers)}>
      <PaperProvider theme={theme}>
        <MyStack />
        <FlashMessage position='bottom' />
      </PaperProvider>
    </StoreProvider>
  );
};