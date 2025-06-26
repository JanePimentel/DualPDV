import React, { Component } from "react";
import { View,Alert, Platform, StatusBar, Image, DeviceEventEmitter, ToastAndroid } from 'react-native';
import GravarErro from "../../necessary/errorServer";
import {
    setPrint,
    setConnected,
    setConfigComercial,
    setVersaoIncompativel,
} from '../../actions/configAction';
import { TB_InfoSistema, TB_ConfigPrint, TB_ConfigComercial, TB_Usuarios } from "../../database/DBTables";
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { connect } from 'react-redux';
import Axios from 'axios';
import {
    setChave,
    setInfoSistema
} from '../../actions/registerAction';
import {
    setUsuario,
    setUnidade,
} from '../../actions/userAction';
import { listDispositivos } from '../../necessary/Print';
import { headers } from '../../config/security';
import style from "../../necessary/style/styleLogin";


class formSplash extends Component {
    constructor(props) {
        super(props);
        this.state = {
            devices: null,
            pairedDs: [],
            foundDs: [],
            bleOpend: false,
            boundAddress: '',
            debugMsg: ''
        }
        setTimeout(async () => {
            await this.verificarRegistro();
        }, 2000);
    }

    addBluetoothListeners() {
        if (Platform.OS === 'ios') {
            let bluetoothManagerEmitter = new NativeEventEmitter(BluetoothManager);
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
                (rsp) => {
                    this._deviceAlreadPaired(rsp)
                }));
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, (rsp) => {
                this._tryConnect()
            }));
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, () => {
                this.props.setConnected(false)
            }));
        } else if (Platform.OS === 'android') {
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, (rsp) => {
                    //Quando verificar os dispositivos conectados listar
                    console.log(rsp)
                    this._deviceAlreadPaired(rsp);//linha adicionada para correcao
                    ToastAndroid.show("Dispositivo conectado!", ToastAndroid.LONG);
                }));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_DEVICE_FOUND, (rsp) => {
                    //Quando achar a impressora conectar
                    this._tryConnect()
                    // this._deviceFoundEvent(rsp);
                }));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_CONNECTION_LOST, () => {
                    //Quando a conexão for perdida
                    ToastAndroid.show("A impressora desconectada...", ToastAndroid.LONG);
                    this.props.setConnected(false)
                }
            ));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_UNABLE_CONNECT, () => {
                    //Quando algo impedir a conexão
                    ToastAndroid.show("Algo deu errado na conexão com a impressora...", ToastAndroid.LONG);
                    if (this.props.connected) {
                        this.props.setConnected(false)
                    }
                    listDispositivos()
                }
            ));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_CONNECTED, () => {
                    ToastAndroid.show("Impressora conectada!", ToastAndroid.LONG);
                    this.props.setConnected(true)
                }
            ));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, () => {
                    ToastAndroid.show("Dispositivo não suportado!", ToastAndroid.LONG);
                }
            ))
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.COMMAND_NOT_SEND, () => {
                    ToastAndroid.show("Falha ao imprimir!", ToastAndroid.LONG);
                    this.props.setConnected(false)
                    listDispositivos()
                }
            ))
        } else {
            ToastAndroid.show("Dispositivo não suportado!", ToastAndroid.LONG);
        }
    }


    _tryConnect() {
        if (!this.props.connected) {
            BluetoothManager.connect(this.props.print.mac)
                .then((s) => {
                    this.props.setConnected(true)
                }, (e) => {
                    this.props.setConnected(false)
                })
        }
    }

    _deviceAlreadPaired(rsp) {
        var ds = null;
        if (typeof (rsp.devices) == 'object') {
            ds = rsp.devices;
        } else {
            try {
                ds = JSON.parse(rsp.devices);
            } catch (e) {
            }
        }
        if (ds && ds.length) {
            let pared = this.state.pairedDs;
            pared = pared.concat(ds || []);
            this.setState({
                pairedDs: pared
            });
        }
    }

    _deviceFoundEvent(rsp) {
        var r = null;
        try {
            if (typeof (rsp.device) == "object") {
                r = rsp.device;
            } else {
                r = JSON.parse(rsp.device);
            }
        } catch (e) {

        }
        if (r) {
            let found = this.state.foundDs || [];
            if (found.findIndex) {
                let duplicated = found.findIndex(function (x) {
                    return x.address == r.address
                });
                //CHECK DEPLICATED HERE...
                if (duplicated == -1) {
                    found.push(r);
                    this.setState({
                        foundDs: found
                    });
                }
            }
        }
    }

    async verficaVersaoApp() {
        let e = new GravarErro();
        try {
            const response = await Axios.get(`${this.props.infoSistema.hostServidor}configuracoes/infoSistema/getVersaoAtual_AppPDV`, headers)
            if (response.status == 200 && response.data) {
                if (String(e.versao) < response.data) {
                    this.props.setVersaoIncompativel(true);
                } else {
                    this.props.setVersaoIncompativel(false);
                }
            }
        } catch (error) {
            if (!!error.isAxiosError && !error.response) {


                Alert.alert('Ops!!', 'Verifique sua conexão com a internet e tente novamente!')
            }
        }
    }

    async verificarRegistro() {
        let size = await this.props.realm.objects(TB_InfoSistema.name).length;
        const registro = JSON.parse(JSON.stringify((size > 0 ? Array.from(await this.props.realm.objects(TB_InfoSistema.name)) : [])));
        size = await this.props.realm.objects(TB_Usuarios.name).length
        const usuario = JSON.parse(JSON.stringify((size > 0 ? Array.from(await this.props.realm.objects(TB_Usuarios.name)) : [])));
        size = await this.props.realm.objects(TB_ConfigPrint.name).length
        const configPrint = (size > 0 ? JSON.parse(JSON.stringify(Array.from(await this.props.realm.objects(TB_ConfigPrint.name))[0])) : null);
        size = await this.props.realm.objects(TB_ConfigComercial.name).length;
        const configComercial = (size > 0 ? JSON.parse(JSON.stringify(Array.from(await this.props.realm.objects(TB_ConfigComercial.name))[0])) : null);

        this.props.setConfigComercial((configComercial ? JSON.parse(configComercial.json) : null));
        this.props.setPrint(configPrint);
        this.props.setInfoSistema(registro[0]);

        if (this.props.print != null) {
            this.addBluetoothListeners()
            BluetoothManager.connect(this.props.print.mac)
        }

      //  await this.verficaVersaoApp();

        if (this.props.isVersaoIncompativel == false) {
            if (registro && Array.isArray(registro) && registro.length > 0) {
                this.props.setChave(registro[0].licenca);
                if (usuario && Array.isArray(usuario) && usuario.length > 0) {
                    this.props.setUsuario(JSON.parse(usuario[0].jsonObjeto));
                    this.props.setUnidade(JSON.parse(registro[0].jsonUnidade));
                    this.props.navigation.navigate('main');
                } else {
                    this.props.navigation.navigate('login');
                }
            } else {
                this.props.navigation.navigate('registroApp');
            }
        } else {
            Alert.alert('Ops...', 'Aplicativo desatualizado.\n Atualizar para a nova versão na Playstore!');
        }
    }


    render() {
        return (
            <View style={style.viewMainRegister}>
                <StatusBar hidden={true} />
                <Image style={style.logoSplashScreen} source={require('../../imgs/.jpg')} />
            </View>
        )
    }
}


const mapStateToProps = (state) => {
    return ({
        infoSistema: state.registerReducer.infoSistema,
        chave: state.registerReducer.chave,
        usuario: state.userReducer.usuario,
        print: state.configReducer.print,
        printConnected: state.configReducer.connected,
        configComercial: state.configReducer.configComercial,
        isVersaoIncompativel: state.configReducer.isVersaoIncompativel,
        realm: state.registerReducer.realm,
    })
}
export default connect(mapStateToProps, {
    setPrint,
    setConnected,
    setConfigComercial,
    setVersaoIncompativel,
    setChave,
    setInfoSistema,
    setUnidade,
    setUsuario,
})(formSplash);