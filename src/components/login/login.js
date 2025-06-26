import React from 'react'
import { Alert, Image, StatusBar, View, KeyboardAvoidingView } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { connect } from 'react-redux';
import Axios from 'axios';
import {
    setLoadingUser,
    setLogin,
    setSenha,
    setUsuario,
    setUnidade
} from '../../actions/userAction'
import Base64 from '../../necessary/base64';
import { TB_Usuarios, TB_InfoSistema } from '../../database/DBTables';
import { headers } from '../../config/security';
import { Button, Text, TextInput } from 'react-native-paper';
import { showMessage} from "react-native-flash-message";
import style from '../../necessary/style/styleLogin';
import pickerSelectStylesLogin from '../../necessary/style/pickerSelectStyleLogin';

class formLogin extends React.Component {
    constructor(props) {
        super(props)
        this.state = { unidades: [], loading: false, unds: [], password: false, u: [] }
        this.loadUnidades()
    }


    async loadUnidades() {
        let u = [];
        try {
            const response = await Axios.get(`${this.props.infoSistema.hostServidor}administracao/unidades/getAll/${this.props.infoSistema.dbName}/${new Base64().criptografar('all')}`, headers)
            if (response.status == 200 && response.data) {
                if (!Array.isArray(response.data)) {
                    this.setState({ unidades: [response.data] })
                } else {
                    this.setState({ unidades: response.data })
                }
            }
            this.mapStateUnidadesToRNPicker();

        } catch (error) {
            if (!!error.isAxiosError && !error.response) {
                showMessage({
                    message: "Atenção...", description: 'Verifique sua conexão com a internet.', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            } else {
                showMessage({
                    message: "Atenção...", description: 'Não foi possível carregar as unidades. Entre em contato com o suporte.', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            }
        }
    }

    mapStateUnidadesToRNPicker() {
        let u = []
        if (Array.isArray(this.state.unidades)) {
            for (let i = 0; i < this.state.unidades.length; i++) {
                u.push({
                    id: this.state.unidades[i].id,
                    label: `${this.state.unidades[i].id} - ${this.state.unidades[i].nomeFantasia} - ${this.state.unidades[i].cidade}/${this.state.unidades[i].uf}`,
                    value: this.state.unidades[i]
                })
            }
        }
        this.setState({ unds: u })
    }


    async logar() {
        if (!this.props.unidade) {
            showMessage({
                message: "Atenção!", description: 'Informe a unidade!', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (!this.props.login | String(this.props.login).length < 3) {
            showMessage({
                message: "Atenção!", description: 'Login inválido!', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (!this.props.senha | String(this.props.senha).length < 5) {
            showMessage({
                message: "Atenção!", description: 'Senha inválida!', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else {
            try {

            this.props.setLoadingUser(true);
                let host = `${this.props.infoSistema.hostServidor}login/entrar_eCommerceMobile`
                const ppd = {
                    dbName: this.props.infoSistema.dbName,
                    objetoNovo: JSON.stringify({
                        login: this.props.login,
                        senha: this.props.senha
                    })
                }
                const response = await Axios.post(host, JSON.stringify(ppd), headers);

                if (response.status == 200) {
                    if (response.data == null) {
                        showMessage({
                            message: "Atenção!", description: 'Login/Senha incorretos!', type: "danger", icon: 'danger', duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                        });
                    } else {
                        this.props.setUsuario(response.data);

                        this.props.realm.write(() => {
                            const user = {
                                id: response.data.id,
                                login: response.data.login,
                                senha: response.data.senha,
                                jsonObjeto: JSON.stringify(response.data)
                            }

                            let users = this.props.realm.objects(TB_Usuarios.name)
                            if (Array.from(users).length > 0) {
                                this.props.realm.delete(users);
                            }
                            this.props.realm.create(TB_Usuarios.name, user);

                            let info = this.props.realm.objects(TB_InfoSistema.name)[0]
                            info.jsonUnidade = JSON.stringify(this.props.unidade)
                            this.props.realm.create(TB_InfoSistema.name, info, true)
                        })
                        this.props.navigation.navigate('main')
                    }
                }
            } catch (error) {
                if (!!error.isAxiosError && !error.response) {
                    showMessage({
                        message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                } else {
                    showMessage({
                        message: "Ops...", description: 'Falha ao efetuar login!', type: "danger", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                }
            }
        }
        this.props.setLoadingUser(false);
    }



    render() {
        return (
            <View
                style={style.viewMainLogin}
            >
                <View style={{ flex: 2 }}>
                    <StatusBar
                        hidden={false}
                        backgroundColor='#1e1e46' />
                    <Image style={style.logoLogin} source={require('../../imgs/.png')} />
                    <Text style={style.titleLogin}>{'Dual PDV'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS == "ios" ? "padding" : "height"}
                        style={style.viewMainLogin}
                    >
                        <RNPickerSelect
                        useNativeAndroidPickerStyle={false}
                            placeholderTextColor='black'
                            placeholder={{
                                label: 'Selecione a Unidade',
                                value: null
                            }}
                            value={this.props.unidade}
                            items={this.state.unds}
                            style={pickerSelectStylesLogin}
                            onValueChange={v => {
                                this.props.setUnidade(v)
                            }}
                            keyExtractor={(item => String(item.id))}
                        />
                        <TextInput
                            label='Usuário'
                            style={{ borderBottomWidth: 1, backgroundColor: 'transparent', margin: 6, color: 'black' }}
                            keyboardType='default'
                            value={this.props.login}
                            autoCorrect={false}
                            activeUnderlineColor='#1e1e46'
                            onChangeText={text => this.props.setLogin(text)}
                            right={<TextInput.Icon name="account" />}
                        />
                        <TextInput
                            label='Senha'
                            style={{ borderBottomWidth: 1, backgroundColor: 'transparent', margin: 6, color: 'black' }}
                            keyboardType='default'
                            value={this.props.senha}
                            autoCorrect={false}
                            secureTextEntry={this.state.password}
                            activeUnderlineColor='#1e1e46'
                            onChangeText={text => this.props.setSenha(text)}
                            right={<TextInput.Icon name={this.state.password == false ? "eye" : 'eye-off'} onPress={() => {
                                this.setState({ password: !this.state.password })
                            }} />}
                        />
                    </KeyboardAvoidingView>
                </View>
                <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: '3%' }}>
                    <Button
                        style={{ width: '68%', alignSelf: 'center' }}
                        icon="check-all" mode="contained"
                        color='#1e1e46'
                        loading={this.props.loadingUser}
                        loadingProps={{ size: "large", color: '#16273f' }}
                        onPress={() => {
                            if (!this.props.loadingUser) {
                                this.logar()
                            }
                        }} >
                        Entrar
                    </Button>
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => ({
    login: state.userReducer.login,
    senha: state.userReducer.senha,
    usuario: state.userReducer.usuario,
    unidade: state.userReducer.unidade,
    loadingUser: state.userReducer.loadingUser,
    infoSistema: state.registerReducer.infoSistema,
    realm: state.registerReducer.realm,
})

export default connect(mapStateToProps, {
    setLogin,
    setSenha,
    setUsuario,
    setLoadingUser,
    setUnidade
})(formLogin);