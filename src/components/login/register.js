import React from 'react';
import {
    View,
    Alert,
    StatusBar,
    KeyboardAvoidingView,
    Dimensions,
    Platform,
} from 'react-native'
import { connect } from 'react-redux';
import Axios from 'axios';
import { TB_InfoSistema } from '../../database/DBTables';
import { headers } from '../../config/security';
import {
    setChave,
    setLoading,
    setInfoSistema
} from '../../actions/registerAction';
import InfoSistema from '../../config/hosts';
import Base64 from '../../necessary/base64';
import { Button, TextInput } from 'react-native-paper';
import style from '../../necessary/style/styleLogin';
import { showMessage } from "react-native-flash-message";

class formRegistro extends React.Component {
    constructor(props) {
        super(props)
    }


    async verificarChave() {
        if (this.props.chave == '') {
            showMessage({
                message: "Atenção!", description: 'Informe a chave.', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else {
            try {
                this.props.setLoading(true);
                let host = `${new InfoSistema().gestor}assinaturas/getLicenca/dual/${this.props.chave}`
                const response = await Axios.get(host, headers);
                if (response.status == 200) {
                    const infoSistema = {
                        hostServidor: `***************************`,
                        dbName: new Base64().criptografar(response.data.nomeBaseDados),
                        licenca: response.data.chaveAssinatura,
                        jsonUnidade: ''
                    }

                    console.log(response.data.chaveAssinatura)
                    this.props.setInfoSistema(infoSistema);
                    await this.props.realm.write(async () => {
                        await this.props.realm.create(TB_InfoSistema.name, this.props.infoSistema)
                    });
                    this.props.navigation.navigate('login');
                } else {
                    Alert.alert('Ops...', 'Verifique a chave e tente novamente.');
                }
                this.props.setLoading(false);
            } catch (error) {
                if (!!error.isAxiosError && !error.response) {
                    showMessage({
                        message: "Atenção...", description: 'Verifique sua conexão com a internet.', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                } else {
                    showMessage({
                        message: "Atenção...", description: 'Não foi possível registrar chave', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                }
            }
        }

    }


    render() {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS == "ios" ? "padding" : "height"}
                style={style.viewMainRegister}
            >
                <StatusBar
                    hidden={false}
                    backgroundColor='#eef1f1' />
                <View style={{ flex: 5, justifyContent: 'center' }}>
                    <TextInput
                        label='Chave de acesso'
                        style={{ borderBottomWidth: 1, backgroundColor: 'transparent', margin: 6, color: 'black' }}
                        keyboardType='default'
                        value={this.props.chave}
                        autoCorrect={false}
                        activeUnderlineColor='blue'
                        onChangeText={(text) => {
                            this.props.setChave(text);
                        }}
                        right={<TextInput.Icon name="key" />}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Button
                        style={{ width: '68%', alignSelf: 'center' }}
                        icon="check-all" mode="contained"
                        color='#1e1e46'
                        loading={this.props.loading}
                        loadingProps={{ size: "large", color: '#16273f' }}
                        onPress={() => {
                            if (!this.props.loading) {
                                this.verificarChave();
                            }
                        }} >
                        Registrar
                    </Button>
                </View>
            </KeyboardAvoidingView>
        )
    }
}


const mapStateToProps = (state) => {
    return ({
        loading: state.registerReducer.loading,
        infoSistema: state.registerReducer.infoSistema,
        chave: state.registerReducer.chave,
        realm: state.registerReducer.realm,
    })
}

export default connect(mapStateToProps, {
    setLoading,
    setChave,
    setInfoSistema
})(formRegistro);