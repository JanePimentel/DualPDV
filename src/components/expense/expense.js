import React, { createRef } from 'react';
import { ScrollView, View, Platform, Alert, Dimensions, StatusBar } from 'react-native';
import { connect } from 'react-redux';
import { Text, TextInput, Button } from 'react-native-paper';
import { showMessage, hideMessage } from "react-native-flash-message";
import styleMain from '../../necessary/style/styleMain';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { formatDateToAAAAMMDD, getHoraAtual } from '../../necessary/dateAndHour/dateHour';
import Spinner from 'react-native-loading-spinner-overlay';
import { Wave } from 'react-native-animated-spinkit';
import styleGlobal from '../../necessary/style/styleGlobal';
import { TB_CentroCusto, TB_PlanoFinanceiro, TB_Caixa } from '../../database/DBTables';
import {
    headers
} from '../../config/security';
import Axios from 'axios';
import style from '../../necessary/style/styleLogin';
import { MaskService, TextInputMask } from 'react-native-masked-text';
import Toast from 'react-native-tiny-toast';
import pickerSelectStylesCloseSale from '../../necessary/style/stylePickerSelectSale';
import RNPickerSelect from 'react-native-picker-select';
import SkeletonPlaceholder from "react-native-skeleton-placeholder";

const actionSheetRef = createRef();

class formExpense extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            centrosCustos: [],
            planosFinanceiros: [],
            isCostCenterFull: false,
            isCostPlanFull: false,
            sendingExpense: false,
            valor: 0.0,
            centroCusto: null,
            planoFinanceiro: null,
            obs: '',
            isVisible: true,
        }
        this.getTables();
    }


    componentDidMount() {
        setTimeout(() => this.setState({ isVisible: !this.state.isVisible }), 2500);
    }

    async getTables() {
        let costC = [];
        let costP = [];

        let cost = await this.props.realm.objects(TB_CentroCusto.name);
        let plan = await this.props.realm.objects(TB_PlanoFinanceiro.name);

        if (cost.length > 0) {
            for (let i = 0; i < cost.length; i++) {
                let cc = JSON.parse(cost[i].json);
                costC.push({
                    label: `${cc.identificacao} - ${cc.nomeCentro}`,
                    value: cc,
                });
            }
            this.setState({ isCostCenterFull: true });
        }

        if (plan.length > 0) {
            for (let i = 0; i < plan.length; i++) {
                let pf = JSON.parse(plan[i].json);
                costP.push({
                    label: `${pf.identificacao} - ${pf.nomeConta}`,
                    value: pf,
                });
            }
            this.setState({ isCostPlanFull: true });
        }
        this.setState({ planosFinanceiros: costP, centrosCustos: costC });
    }



    async salvar() {
        let tudoCertoServer = false;

        if (!this.state.centroCusto && this.state.isCostCenterFull == true) {
            showMessage({
                message: "Atenção!", description: `Informe o centro de custo.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (!this.state.planoFinanceiro && this.state.isCostPlanFull == true) {
            showMessage({
                message: "Atenção!", description: `Informe o plano financeiro.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (this.state.obs == '') {
            showMessage({
                message: "Atenção!", description: `Informe onde foi gasto o valor.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (this.state.valor <= 0.0) {
            showMessage({
                message: "Atenção!", description: `Informe o valor gasto.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else {
            try {
                this.setState({ sendingExpense: true });
                const transacao = {
                    id: 0,
                    und: this.props.unidade.unidade,
                    entrada: false,
                    dataInformada: formatDateToAAAAMMDD(new Date()),
                    dataTransacao: formatDateToAAAAMMDD(new Date()),
                    horaTransacao: getHoraAtual(),
                    nomePessoa: this.state.obs,
                    valor: parseFloat(Number(this.state.valor)).toFixed(2),
                    especieTransitada: 'Dinheiro',
                    opcaoUsada: 'RECEITAS_DESPESAS',
                    historico: `Retirada de ${MaskService.toMask(
                        'money',
                        parseFloat(this.state.valor).toFixed(2),
                        { delimiter: '.', separator: ',', unit: 'R$ ' },
                    )} referente a(o) ${this.state.planoFinanceiro == null
                        ? '"Motivo desconhecido..."'
                        : this.state.planoFinanceiro.nomeConta
                        }.`,
                    centroCusto: this.state.centroCusto,
                    idCentroCusto:
                        this.state.centroCusto == null ? 0 : this.state.centroCusto.id,
                    planoFinanceiro: this.state.planoFinanceiro,
                    idPlanoFinanceiro:
                        this.state.planoFinanceiro == null
                            ? 0
                            : this.state.planoFinanceiro.id,
                    idMovimentacao: this.props.caixa.idMovimentacaoCaixa,
                };

                const ppd = {
                    dbName: this.props.infoSistema.dbName,
                    objetoNovo: JSON.stringify(transacao),
                    und: this.props.unidade.unidade,
                    usuario: this.props.usuario.login,
                    usuarioPC: Platform.OS,
                    nomePC: Platform.OS,
                    sistemaOperacionalPC: `${Platform.OS} ${Platform.Version}`,
                    nomeJanela: 'PDV - Despesas',
                };

                const response = await Axios.post(`${this.props.infoSistema.hostServidor}financeiro/caixa/lancarReceitasDespesas`, JSON.stringify(ppd), headers);
                if (response.status == 200 && response.data) {
                    this.props.caixa.lancamentos.push(response.data);
                    tudoCertoServer = true;
                    Alert.alert('Confirmação!', 'Despesa enviada com sucesso.');
                    Toast.showSuccess('Despesa enviada com sucesso!', {
                        position: Toast.position.CENTER,
                        containerStyle: {
                            backgroundColor: 'green',
                            borderRadius: 10,
                        },
                        textStyle: {
                            color: '#fff',
                        },
                        imgStyle: {},
                        mask: false,
                        maskStyle: {},
                        duration: 3000,
                        animation: true,
                    });
                    showMessage({
                        message: "Sucesso!", description: 'Despesa enviada com sucesso!', type: "success", icon: "success", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                } else {
                    this.props.caixa.lancamentos.push(transacao);
                    Alert.alert('Atenção!', 'Registro gravado apenas no dispositivo, mas falhou no envio para a central.\n\nAcesse o menu \"Sincronizar\" e faça o envio manual no botão "Parcial".');
                    showMessage({
                        message: "Ops...", description: 'Faça a sincronização manual do registro!', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                }

                /**Grava Tb caixa local. */
                this.props.realm.write(() => {
                    this.props.realm.create(TB_Caixa.name,
                        {
                            id: parseInt(this.props.caixa.idMovimentacaoCaixa),
                            json: JSON.stringify(this.props.caixa),
                            sincronizado: true,
                        },
                        true,
                    );
                });

                if (tudoCertoServer == true) {
                    this.props.navigation.navigate('main');
                }
            }
            catch (error) {
                if (!!error.isAxiosError && !error.response) {
                    showMessage({
                        message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente.', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                } else {
                    Alert.alert('Falha!', `Falha!\n\nEntre em contato com nosso time de Suporte e informe a mensagem abaixo:\n\nMsg.: ${error}`);
                }
            }
        }
        this.setState({ sendingExpense: false });
    }


    render() {
        const { height: DEVICE_HEIGHT } = Dimensions.get('window');
        if (this.state.isVisible == true) {
            return (
                DEVICE_HEIGHT > 1100 ?
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={80} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={150} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'34%'} width={'55%'} height={150} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
                    :
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'34%'} width={'55%'} height={56} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
            )
        } else {
            return (
                <View style={styleMain.viewMain}>
                    <StatusBar
                        hidden={false}
                        backgroundColor='#1e1e46' />
                    <Spinner
                        visible={this.state.sendingExpense}
                        textContent={'Enviando despesa...'}
                        textStyle={{ color: 'white', fontSize: RFPercentage(2.9), fontFamily: 'Roboto-Light' }}
                        customIndicator={<Wave size={Dimensions.get("screen").width * 2 / 8} color='#040739' />}
                    />
                    <ScrollView>
                        <View style={{ margin: '5%' }}>
                            <Text> {`Selecione o centro de custo`}</Text>
                            <View style={{ flex: 1, margin: '3%' }}>
                                <RNPickerSelect
                                    placeholderTextColor='black'
                                    placeholder={{
                                        label: 'Centro custo',
                                        value: null
                                    }}
                                    value={this.state.centroCusto}
                                    items={this.state.centrosCustos}
                                    onValueChange={value => {
                                        if (value) {
                                            this.setState({ centroCusto: value });
                                        }
                                    }}
                                    style={pickerSelectStylesCloseSale}
                                    useNativeAndroidPickerStyle={false}
                                />
                            </View>
                            <View>
                                <Text> {`Selecione o plano de contas`}</Text>
                                <View style={{ flex: 1, margin: '3%' }}>
                                    <RNPickerSelect
                                        placeholderTextColor='black'
                                        placeholder={{
                                            label: 'Plano Contas',
                                            value: null
                                        }}
                                        value={this.state.planoFinanceiro}
                                        items={this.state.planosFinanceiros}
                                        onValueChange={value => {
                                            this.setState({ planoFinanceiro: value })
                                        }}
                                        style={pickerSelectStylesCloseSale}
                                        useNativeAndroidPickerStyle={false}
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', margin: 7, flex: 1 }}>
                                <View>
                                    <Text> {`Valor`}</Text>
                                    <TextInput
                                        mode="flat"
                                        style={styleGlobal.inputStoreExpense}
                                        render={props =>
                                            <TextInputMask
                                                {...props}
                                                type={'money'}
                                                value={parseFloat(Number(this.state.valor)).toFixed(2)}
                                                onChangeText={(masked, rowValue) => {
                                                    this.setState({ valor: rowValue })
                                                }}
                                                includeRawValueInChangeText={true}
                                                options={{
                                                    precision: 2,
                                                    separator: ',',
                                                    delimiter: '.',
                                                    unit: '',
                                                }}
                                            />
                                        }
                                    />
                                </View>
                            </View>
                            <View style={{ margin: 7, }}>
                                {/* <Text> {`Onde foi gasto ?`}</Text> */}
                                <TextInput
                                    mode='flat'
                                    label={'Qual a despesa?'}
                                    style={{ backgroundColor: 'transparent', margin: 6, color: 'black' }}
                                    keyboardType='default'
                                    value={this.state.obs}
                                    autoCorrect={false}
                                    activeUnderlineColor='#1e1e46'
                                    onChangeText={(value) => {
                                        this.setState({ obs: value })
                                    }}
                                    right={<TextInput.Icon name="cash-multiple" />}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={[style.viewButtonRegister, { flex: 1, margin: 12 }]}>
                        <Button
                            style={{ width: '58%', alignSelf: 'center', borderWidth: 3 }}
                            icon="cash-plus" mode="outlined"
                            color='#1e1e46'
                            loading={this.state.sendingExpense}
                            loadingProps={{ size: "large", color: '#16273f' }}
                            onPress={async () => {
                                if (!this.state.sendingExpense) {
                                    this.salvar();
                                }
                            }} >
                            Finalizar
                        </Button>
                    </View>
                </View >
            )
        }
    }
}

const mapStateToProps = (state) => ({
    usuario: state.userReducer.usuario,
    realm: state.registerReducer.realm,
    caixa: state.pdvReducer.caixa,
    caixaAberto: state.pdvReducer.caixaAberto,
    infoSistema: state.registerReducer.infoSistema,
    unidade: state.userReducer.unidade,
    configComercial: state.configReducer.configComercial,
    cliente: state.salesReducer.cliente,
})

export default connect(mapStateToProps, {
})(formExpense);