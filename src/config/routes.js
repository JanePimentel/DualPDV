
import * as React from 'react';
import { View, Text, Button, Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import formSplash from '../components/login/splashScreen';
import formSplash from '../components/login/splash';
import register from '../components/login/register';
import login from '../components/login/login';
import main from '../components/main';
import sync from '../components/sync';
import sale from '../components/sale/sale';
import closeSale from '../components/sale/closeSale';
import expense from '../components/expense/expense';
import configPrinter from '../components/configPrinter/configPrinter';
import saleReport from '../components/saleReport/saleReport';
import receiveBill from '../components/receiveBill/receiveBill';
import stock from '../components/stock/stock';

/**Configuração de animação de abertura das telas*/
const config = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();

function MyStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        headerMode="screen"
        initialRouteName='Splash'
        headerShown={true}
        screenOptions={({ navigation }) => ({
          headerShown: false,
          headerStyle: {
            backgroundColor: 'white',
            borderBottomColor: '#1e1e46',
          },
          headerTitleStyle: {
            textAlign: 'center',
            fontFamily: 'FiraSans-Regular',
            color: '#1e1e46',
            fontSize: RFPercentage(4.2),
          },
        })}
      >
        <Stack.Screen name="Splash" component={formSplash} />
        <Stack.Screen name="Splash" component={formSplash} />
        <Stack.Screen name="registroApp" component={register} />
        <Stack.Screen name="login" component={login} />
        <Stack.Screen name="main" component={main} />
        <Stack.Screen name="sync" component={sync} options={{
          title: 'Sync',
          headerShown: true,
          /*          headerLeft: () => (
                     <Button
                       onPress={() => alert('This is a button!')}
                       title="Info"
                       color="#fff"
                     />
                   ), */
          /* headerLeftContainerStyle: (Platform.OS === 'ios' ? null : {
            width: 50,
            height: 50,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: 100,
            margin: 2,
          }), */
        }} />
        <Stack.Screen name="sale" component={sale} options={{
          title: 'Vender',
          headerShown: true,
        }} />
          <Stack.Screen name="closeSale" component={closeSale} options={{
          title: 'Finalizar venda',
          headerShown: true,
        }} />
         <Stack.Screen name="expense" component={expense} options={{
          title: 'Despesas',
          headerShown: true,
        }} />
         <Stack.Screen name="config" component={configPrinter} options={{
          title: 'Configurações',
          headerShown: true,
        }} />
           <Stack.Screen name="saleReport" component={saleReport} options={{
          title: 'Relatório de venda',
          headerShown: true,
        }} />
           <Stack.Screen name="receiveBill" component={receiveBill} options={{
          title: 'Recebimento de conta',
          headerShown: true,
        }} />
          <Stack.Screen name="stockReport" component={stock} options={{
          title: 'Estoque',
          headerShown: true,
        }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default MyStack;