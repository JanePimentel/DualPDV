import React, { createRef } from 'react';
import { ScrollView, View, Platform, FlatList, Alert, Dimensions, StatusBar } from 'react-native';
import { Icon, ListItem, SearchBar } from 'react-native-elements';
import { connect } from 'react-redux';
import { Text, TextInput, RadioButton, List, HelperText, Menu, Button, IconButton, Modal, Portal, Divider } from 'react-native-paper';
import styleMain from '../../necessary/style/styleMain';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import Spinner from 'react-native-loading-spinner-overlay';
import { Plane, Circle, Flow, Chase, Swing, Grid, Wave } from 'react-native-animated-spinkit';
import styleGlobal from '../../necessary/style/styleGlobal';
import {
    addTitulo,
    delTitulo,
    setTotal,
    addFormaRecebimento,
    delFormaRecebimento,
    setLoadingReceive,
    limparDados,
    addTransacoes,
    limparTitulos,
} from '../../actions/receiveAction'
import { TB_Caixa, TB_Clientes, TB_ContasAReceber, TB_Estoque } from '../../database/DBTables';
import { showMessage, hideMessage } from "react-native-flash-message";
import style from '../../necessary/style/styleLogin';
import { MaskService, TextInputMask } from 'react-native-masked-text';
import Toast from 'react-native-tiny-toast';
import LinearGradient from 'react-native-linear-gradient';
import pickerSelectStylesCloseSale from '../../necessary/style/stylePickerSelectSale';
import RNPickerSelect from 'react-native-picker-select';
import { formatDateToAAAAMMDD, getHoraAtual } from '../../necessary/dateAndHour/dateHour';
import Axios from 'axios';
import {
    headers
} from '../../config/security';
import { getToken } from '../../necessary/Token';
import { printComprovanteRecebimento } from '../../necessary/Print';
import GravarErro  from '../../necessary/errorServer';
import { gravaAlteracoesContasAReceber } from '../../controller/controllerSync';



const actionSheetRef = createRef();


class formReceive extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            especie: 'Dinheiro',
            clientes: [],
            cliente: null,
            loadingBills: false,
            bills: [],
            moreOneSale: 0,
            valorAReceber: 0,
            totalPendente: 0.0,
            total: 0.0,
            totalRecebimentos: 0.0,
            isVisible: true,
        }
        this.getClients();
    }

    componentDidMount() {
        setTimeout(() => this.setState({ isVisible: !this.state.isVisible }), 2500);
    }

    async getClients() {
        let clientes = [];
        let size = await this.props.realm.objects(TB_Clientes.name).length;
        let cli = await this.props.realm.objects(TB_Clientes.name);
        if (size > 0) {
            for (let i = 0; i < cli.length; i++) {
                let value = JSON.parse(cli[i].json);
                clientes.push({
                    label: value.pessoa.nome,
                    value: value
                })
            }
        } else {
            showMessage({
                message: "Atenção!", description: 'Não há clientes disponíveis. Faça a sincronização total para atualizar seu app.', type:"info", icon: "info", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        }
        await clientes.sort((a, b) => a.label.localeCompare(b.label))
        this.setState({ clientes: clientes })
    }


    /** Obtém titulo a partir de cliente escolhido */
    async getBillsForClient(cli) {
        let titulos = [];
        this.setState({ loadingBills: true })

        if (cli) {
            let size = await this.props.realm.objects(TB_ContasAReceber.name).length
            let tit = Array.from(await this.props.realm.objects(TB_ContasAReceber.name))
            if (size > 0) {
                for (let i = 0; i < tit.length; i++) {
                    let t = JSON.parse(tit[i].json);

                    if (t.conta.idPessoa == cli.id) {
                        titulos.push({
                            label: `Parcela nº ${t.titulo} no valor de ${MaskService.toMask('money', parseFloat(t.valorAberto).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$' })} ${(t.conta && t.conta.idVenda > 0 ? `da venda n˚ ${t.conta.idVenda}` : (t.conta && t.conta.idAcordoFinanceiro > 0 ? `do acordo ${t.conta.idAcordoFinanceiro}` : (t.conta && t.conta.idChequeDevolvido > 0 ? `do cheque cód. ${t.conta.idChequeDevolvido}` : (t.conta && t.conta.idReceita > 0 ? ` da receita fixa cód. ${t.conta.idReceita}` : (t.conta && t.conta.idfechamentoLote > 0 ? `do fechamento de lote cód. ${t.conta.idfechamentoLote}` : '')))))}`,
                            selected: false,
                            aReceber: t.valorAberto,
                            value: t,
                        })
                    }
                }
            }
        }
        this.setState({ bills: titulos, loadingBills: false })
    }



    async salvar() {
        let tudoCertoServer = false;
        let transacoes = [];

        if (this.props.titulos.length <= 0) {
            showMessage({
                message: "Atenção!", description: 'Adicione os títulos.', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (this.props.formasRecebimento.length <= 0) {
            showMessage({
                message: "Atenção!", description: 'Adicione os pagamentos.', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else {
            let rec = [];
            let saldo = 0;
            let idConta = 0;
            let idVenda = 0;
            let saldoDevedor = 0;
            let valorPago = 0;
            let qtdParcelas = 0;

            this.props.setLoadingReceive(true);

            /**Verifica se recebimento tem parcelas de mais de uma venda; imprime comprovante de pendência apenas se
             * parcelar de uma única venda for informada */
            try {
                const t = Array.from(this.props.titulos);
                let firstId = t[0].titulo.conta.idVenda;
                for (let index of this.props.titulos) {
                    if (firstId != index.titulo.conta.idVenda) {
                        this.state = { ...this.state, moreOneSale: 1 }
                        break;
                    }
                }

                if (this.state.moreOneSale == 0) {
                    saldoDevedor = this.state.total;
                    valorPago = this.state.totalRecebimentos;
                    idConta = t[0].titulo.idConta ? t[0].titulo.idConta : 0;
                    idVenda = t[0].titulo.conta.idVenda ? t[0].titulo.conta.idVenda : 0
                }

                /**
                 * Verifica se divida maior e subtrai valor; se menor, zera divida e subtrai do valor do recebimento inserido
                 */
                for (let i = 0; i < this.props.titulos.length; i++) {
                    let t = this.props.titulos[i];
                    saldo = parseFloat(t.total).toFixed(2);
                    for (let index = 0; index < this.props.formasRecebimento.length; index++) {
                        let f = this.props.formasRecebimento[index];
                        if (saldo > 0.01 && parseFloat(Number(f.valor)).toFixed(2) > 0.01) {
                            if (saldo >= f.valor) {
                                const adiantamento = {
                                    idCliente: this.state.cliente.id,
                                    idContasAReceber: t.titulo.idConta,
                                    tituloContaAReceber: t.titulo.titulo,
                                    dataAdiantamento: formatDateToAAAAMMDD(new Date()),
                                    dataTransacao: formatDateToAAAAMMDD(new Date()),
                                    valor: parseFloat(Number(f.valor)).toFixed(2),
                                    tipoRecebimento: f.especie,
                                    registroCheque: (f.cheque != null ? f.cheque.id : 0)
                                }
                                const transacao = {
                                    id: 0,
                                    idContaAReceber: t.titulo.idConta,
                                    contaAReceber: t.titulo.conta,
                                    idTituloContaAReceber: t.titulo.titulo,
                                    und: this.props.unidade.unidade,
                                    entrada: true,
                                    dataInformada: formatDateToAAAAMMDD(new Date()),
                                    dataTransacao: formatDateToAAAAMMDD(new Date()),
                                    horaTransacao: getHoraAtual(),
                                    pessoa: this.state.cliente.pessoa,
                                    idPessoa: this.state.cliente.id,
                                    valor: parseFloat(Number(f.valor)).toFixed(2),
                                    especieTransitada: f.especie,
                                    cheque: f.cheque,
                                    registroCheque: (f.cheque != null ? f.cheque.id : 0),
                                    opcaoUsada: 'RECEBER_CONTAS',
                                    historico: `Rec. da conta, cód.: ${t.titulo.idConta}, referente a(o) ${(Number(t.titulo.conta.idVenda) > 0 ? "venda nº " + t.titulo.conta.idVenda : (Number(t.titulo.conta.idAcordoFinanceiro) > 0 ? "acordo financeiro nº " + t.titulo.conta.idAcordoFinanceiro : (Number(t.titulo.conta.idChequeDevolvido) > 0 ? "cheque devolvido, cód.: " + t.titulo.conta.idChequeDevolvido : ((t.titulo.conta.idFechamentoLote) > 0 ? "fechamento do lote " + t.titulo.conta.fechamentoLote.idPreAlojamento : (Number(t.titulo.conta.idReceita) > 0 ? "receita fixa \"" + t.titulo.conta.receita.nome + "\"" : "conta incluída manualmente")))))}.`,
                                    idMovimentacao: this.props.caixa.idMovimentacaoCaixa,
                                    adiantamento: adiantamento,
                                    token: getToken(this.props.usuario.id, `${t.titulo.idConta}/${t.titulo.titulo}-${f.valor}`)
                                }
                                //  this.props.addTransacoes(transacao)
                                transacoes.push(transacao)
                                saldo -= parseFloat(Number(f.valor)).toFixed(2);
                                f.valor = 0;
                            } else {
                                const adiantamento = {
                                    idCliente: this.state.cliente.id,
                                    idContasAReceber: t.titulo.idConta,
                                    tituloContaAReceber: t.titulo.titulo,
                                    dataAdiantamento: formatDateToAAAAMMDD(new Date()),
                                    dataTransacao: formatDateToAAAAMMDD(new Date()),
                                    valor: parseFloat(saldo).toFixed(2),
                                    tipoRecebimento: f.especie,
                                    registroCheque: (f.cheque != null ? f.cheque.id : 0)
                                }
                                const transacao = {
                                    id: 0,
                                    idContaAReceber: t.titulo.idConta,
                                    contaAReceber: t.titulo.conta,
                                    idTituloContaAReceber: t.titulo.titulo,
                                    und: this.props.unidade.unidade,
                                    entrada: true,
                                    dataInformada: formatDateToAAAAMMDD(new Date()),
                                    dataTransacao: formatDateToAAAAMMDD(new Date()),
                                    horaTransacao: getHoraAtual(),
                                    pessoa: this.state.cliente.pessoa,
                                    idPessoa: this.state.cliente.id,
                                    valor: parseFloat(saldo).toFixed(2),
                                    especieTransitada: f.especie,
                                    cheque: f.cheque,
                                    registroCheque: (f.cheque != null ? f.cheque.id : 0),
                                    opcaoUsada: 'RECEBER_CONTAS',
                                    historico: `Rec. da conta, cód.: ${t.titulo.idConta}, referente a(o) ${(Number(t.titulo.conta.idVenda) > 0 ? "venda nº " + t.titulo.conta.idVenda : (Number(t.titulo.conta.idAcordoFinanceiro) > 0 ? "acordo financeiro nº " + t.titulo.conta.idAcordoFinanceiro : (Number(t.titulo.conta.idChequeDevolvido) > 0 ? "cheque devolvido, cód.: " + t.titulo.conta.idChequeDevolvido : ((t.titulo.conta.idFechamentoLote) > 0 ? "fechamento do lote " + t.titulo.conta.fechamentoLote.idPreAlojamento : (Number(t.titulo.conta.idReceita) > 0 ? "receita fixa \"" + t.titulo.conta.receita.nome + "\"" : "conta incluída manualmente")))))}.`,
                                    idMovimentacao: this.props.caixa.idMovimentacaoCaixa,
                                    adiantamento: adiantamento,
                                    token: getToken(this.props.usuario.id, `${t.titulo.idConta}/${t.titulo.titulo}-${f.valor}`)
                                }
                                // this.props.addTransacoes(transacao)
                                transacoes.push(transacao)
                                f.valor -= saldo
                                saldo = 0
                            }
                        }
                    }
                }
         

                /**
                 * Envia transacções formatadas para server
                 */
                if (transacoes.length > 0) {
                    for (let indexT = 0; indexT < transacoes.length; indexT++) {
                        let v = transacoes[indexT];
                        /**Altera valor aberto na tabela contas a receber antes mesmo do cliente sincronizar */
                        gravaAlteracoesContasAReceber(v);
                        if (v) {
                            const ppd = {
                                dbName: this.props.infoSistema.dbName,
                                objetoNovo: JSON.stringify(v),
                                und: this.props.unidade.unidade,
                                usuario: this.props.usuario.login,
                                usuarioPC: Platform.OS,
                                nomePC: Platform.OS,
                                sistemaOperacionalPC: `${Platform.OS} ${Platform.Version}`,
                                nomeJanela: 'PDV - Recebimento de Contas'
                            }
                            try {
                                const response = await Axios.post(`${this.props.infoSistema.hostServidor}financeiro/caixa/receberContas`, JSON.stringify(ppd), headers);
                                if (response.status == 200 && response.data && response.data.id > 0) {
                                    v = response.data;
                                    tudoCertoServer = true;
                                }
                            } catch (error) {
                                tudoCertoServer = false;
                               // console.log('Dentro do Envio para o servidor!\n\nErro: ' + error);
                                Alert.alert('Atenção!', 'Registro gravado apenas no dispositivo, mas falhou no envio para a central.\n\nAcesse o menu \"Sincronizar\" e faça o envio manual no botão "Parcial".');
                                let gravarErro = new GravarErro();
                                gravarErro.licenca = this.props.registro
                                gravarErro.dbName = this.props.infoSistema.dbName
                                gravarErro.sistema = 'Dual PDV'
                                gravarErro.erro = error.message
                                gravarErro.logErro = JSON.stringify(error.config)
                                gravarErro.localErro = 'Finalizar Recebimentos'
                                gravarErro.dataErro = formatDateToAAAAMMDD(new Date())
                                gravarErro.horaErro = getHoraAtual()
                                gravarErro.mobile = true
                                gravarErro.cliente = false
                                gravarErro.servidor = false
                                gravarErro.enviarLogErro()
                            }
                            if (this.props.caixa.lancamentos) {
                                this.props.caixa.lancamentos.push(v);
                            }
                            else {
                                this.props.caixa.lancamentos = [v];
                            }
                        }
                    }


                    if (tudoCertoServer == true) {
                        Alert.alert('Confirmação', `Recebimento realizado com sucesso!`)
                        Toast.showSuccess('Recebimento enviado com sucesso!', {
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
                            message: "Sucesso!", description: 'Recebimento realizado com sucesso.', type: "success", icon: "success", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                        });
                        this.props.limparDados();
                        this.props.navigation.navigate('main');
                    } else {
                        showMessage({
                            message: "Ops", description: 'Faça a sincronização manual do registro!', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                        });
                        this.props.limparDados();
                        this.props.navigation.navigate('main');
                    }

                    /**
                     * Grava as modificações no banco local de caixa*/
                    this.props.realm.write(() => {
                        this.props.realm.create(TB_Caixa.name, {
                            id: parseInt(this.props.caixa.idMovimentacaoCaixa),
                            json: JSON.stringify(this.props.caixa),
                            sincronizado: true
                        }, true)
                    })

                    printComprovanteRecebimento(rec, this.props.unidade, this.state.cliente, saldo, idConta, idVenda, qtdParcelas, this.state.totalPendente, this.state.total);
                }
            } catch (error) {
                if (!!error.isAxiosError && !error.response) {
                    showMessage({
                        message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente.', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                } else {
                    Alert.alert('Falha!', `Falha!\n\nEntre em contato com nosso time de Suporte e informe a mensagem abaixo:\n\nMsg.: ${error}`);
                }
                console.log(error)
            }
        }
        this.props.setLoadingReceive(false);
    }



    async addFormaPagamento() {
        console.log(this.state.totalRecebimentos)
        let total = this.state.valorAReceber + this.state.totalRecebimentos;

        if (this.state.especie == '') {
            showMessage({
                message: "Atenção!", description: `Selecione a espécie do pagamento.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (!this.state.cliente) {
            showMessage({
                message: "Atenção!", description: `Informe o cliente. `, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (this.props.titulos.length <= 0) {
            showMessage({
                message: "Atenção!", description: `Informe os títulos a receber.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (this.state.valorAReceber <= 0 && this.state.totalPendente > 0) {
            showMessage({
                message: "Atenção!", description: `Informe o valor a receber.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (this.state.totalPendente <= 0) {
            showMessage({
                message: "Atenção!", description: 'Valor total já foi inserido na(s) forma(s) de pagamento abaixo.', type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (total > this.state.total) {
            showMessage({
                message: "Atenção!", description: `Valor informado ultrapassa o valor total da compra\n\n Total da compra é de R$${this.state.total.toFixed(2)}`, type: "danger", icon: 'info', duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else {
            const formaRecebimento = {
                especie: this.state.especie,
                valor: this.state.valorAReceber,
                cheque: null
            }
            this.props.addFormaRecebimento(formaRecebimento);
            this.setState({
                ...this.state, valorAReceber: 0.0, totalPendente: (this.state.totalPendente - formaRecebimento.valor),
                totalRecebimentos: (this.state.totalRecebimentos + formaRecebimento.valor)
            })
        }

    }

    /**Calcula total das parcelas escolhidas e totalpendente */
    calcularTotalContas() {
        let t = 0;
        let r = 0;
        for (let i = 0; i < this.props.titulos.length; i++) {
            t += this.props.titulos[i].total
        }
        for (let i = 0; i < this.props.formasRecebimento.length; i++) {
            r += this.props.formasRecebimento[i].valor
        }

        if (this.props.formasRecebimento.length <= 0) {
            this.setState({ total: t, totalPendente: t })
        } else {
            this.setState({ total: t, totalPendente: (t - r) })
        }

    }

    /*** Calcula formas o total das formas de recebimento */
    calcularTotalFormasPg() {
        let t = 0;
        for (let i = 0; i < this.props.formasRecebimento.length; i++) {
            t += this.props.formasRecebimento[i].valor
        }
        console.log(t)
        this.setState({ totalRecebimentos: t })
    }


    render() {
        const { height: DEVICE_HEIGHT } = Dimensions.get('window');

        if (this.state.isVisible == true) {
            return (
                DEVICE_HEIGHT > 1100 ?
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={120} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={120} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={120} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'45%'} width={'65%'} height={90} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
                    :
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" marginTop='4%'>
                        </SkeletonPlaceholder.Item>
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={80} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={80} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={6} width={'95%'} height={80} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={'45%'} width={'65%'} height={70} borderRadius={4} alignSelf={'center'} />
                    </SkeletonPlaceholder>
            )
        } else {
            return (
                <View style={styleMain.viewMain}>
                    <StatusBar
                        hidden={false}
                        backgroundColor='#1e1e46' />
                    <Spinner
                        visible={this.props.loadingReceiveBill}
                        textContent={'Enviando recebimento...'}
                        textStyle={{ color: 'white', fontSize: RFPercentage(2.9), fontFamily: 'Roboto-Light' }}
                        customIndicator={<Flow size={Dimensions.get("screen").width * 2 / 11} color='#040739' />}
                    />
                    <ScrollView>
                        <List.AccordionGroup >
                            <List.Accordion title="Cliente / Títulos" id="1" titleStyle={{ fontFamily: 'Montserrat-Bold', fontSize: RFPercentage(2.8) }} >
                                <View style={{ margin: '5%' }}>

                                    <Text> {`Selecione o cliente`}</Text>
                                    <View style={{ margin: '3%' }}>
                                        <RNPickerSelect
                                            placeholderTextColor='black'
                                            placeholder={{
                                                label: 'Selecione o cliente',
                                                value: null
                                            }}
                                            items={this.state.clientes}
                                            value={this.state.cliente}
                                            onValueChange={v => {
                                                this.setState({
                                                    valorAReceber: 0,
                                                    totalPendente: 0.0,
                                                    total: 0.0,
                                                    totalRecebimentos: 0.0,
                                                    cliente: v
                                                });
                                                this.props.limparTitulos();
                                                this.getBillsForClient(this.state.cliente);
                                            }}
                                            style={pickerSelectStylesCloseSale}
                                            useNativeAndroidPickerStyle={false}
                                        />
                                    </View>
                                    {
                                        this.state.bills.length > 0 ?
                                            <Text style={styleGlobal.titleQtdCart}>Títulos</Text>
                                            : (
                                                this.state.bills.length <= 0 && this.state.cliente ? <Text style={{ textAlign: 'center', color: 'red' }}> Não há títulos para esse cliente!</Text>
                                                    : <View />
                                            )
                                    }
                                    <View>
                                        {(this.state.bills ? this.state.bills : []).map((item, i) => (
                                            <ListItem key={i}
                                                bottomDivider
                                                containerStyle={{ elevation: 3, borderRadius: 5, margin: 2 }}
                                                onPress={() => {
                                                    //  this.setState({ isModalVisible: true, venda: item });
                                                }}
                                            >
                                                <RadioButton
                                                    value="first"
                                                    color='green'
                                                    status={this.state.bills[i].selected == true ? 'checked' : 'unchecked'}
                                                    onPress={async () => {
                                                        this.state.bills[i].selected = !this.state.bills[i].selected
                                                        this.setState({ ...this.state })
                                                        if (this.state.bills[i].selected == true) {
                                                            this.props.addTitulo({
                                                                titulo: item.value,
                                                                total: item.aReceber,
                                                            })
                                                            this.props.setTotal();
                                                            this.calcularTotalContas();
                                                        } else {
                                                            this.props.delTitulo(item.value);
                                                            this.calcularTotalContas();
                                                            this.calcularTotalFormasPg();
                                                        }
                                                    }}
                                                />
                                                {/* <Avatar rounded icon={{ name: 'home', color:'#800000' }} /> */}
                                                <ListItem.Content>
                                                    <ListItem.Title style={{ fontFamily: 'Montserrat-Bold' }}>{item.label} </ListItem.Title>
                                                    <ListItem.Subtitle>{

                                                    }</ListItem.Subtitle>
                                                </ListItem.Content>
                                            </ListItem>
                                        ))
                                        }
                                    </View>



                                </View>
                            </List.Accordion>
                            <Divider style={{ borderBottomWidth: 1 }} />

                            <List.Accordion title="Pagamento" id="3" titleStyle={{ fontFamily: 'Montserrat-Bold', fontSize: RFPercentage(2.8) }}>
                                <View style={{ margin: '5%' }}>

                                    <View style={{ flexDirection: 'row', margin: '3%' }}>
                                        <View>
                                            <Text> {`Total`}</Text>
                                            <TextInput
                                                mode="flat"
                                                style={styleGlobal.inputStore}
                                                disabled={true}
                                                render={props =>
                                                    <TextInputMask
                                                        {...props}
                                                        type={'money'}
                                                        value={parseFloat(Number(this.state.total)).toFixed(2)}
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

                                        <View>
                                            <Text> {`Pendente`}</Text>
                                            <TextInput
                                                mode="flat"
                                                style={styleGlobal.inputStore}
                                                disabled={true}
                                                render={props =>
                                                    <TextInputMask
                                                        {...props}
                                                        type={'money'}
                                                        value={parseFloat(Number(this.state.totalPendente)).toFixed(2)}
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

                                    <View style={{ flexDirection: 'row', margin: '3%' }}>
                                        <View>
                                            <Text> {`Valor a receber`}</Text>
                                            <TextInput
                                                mode="flat"
                                                style={styleGlobal.inputStore}
                                                render={props =>
                                                    <TextInputMask
                                                        {...props}
                                                        type={'money'}
                                                        value={this.state.valorAReceber}
                                                        includeRawValueInChangeText={true}
                                                        onChangeText={(masked, rowValue) => {
                                                            this.setState({
                                                                valorAReceber: Number(rowValue)
                                                            })
                                                        }}
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

                                    <View style={{ margin: '3%' }}>
                                        <Text> {`Espécie`}</Text>
                                        <RNPickerSelect
                                            placeholderTextColor='black'
                                            placeholder={{
                                                label: 'Selecione a espécie',
                                                value: null
                                            }}
                                            items={[{ label: 'Dinheiro', value: 'Dinheiro' }]}
                                            value={this.state.especie}
                                            onValueChange={v => {
                                                this.setState({ especie: value })
                                            }}
                                            style={pickerSelectStylesCloseSale}
                                            useNativeAndroidPickerStyle={false}
                                        />
                                    </View>
                                    <IconButton
                                        icon='plus-thick'
                                        color={'white'}
                                        size={Dimensions.get("screen").width * 2 / 29}
                                        animated={true}
                                        style={{ backgroundColor: '#1e1e46', alignSelf: 'flex-end' }}
                                        onPress={() => {
                                            this.addFormaPagamento();
                                            this.calcularTotalFormasPg();
                                        }}
                                    />

                                    {
                                        this.props.formasRecebimento.length > 0 ?
                                            <Text style={styleGlobal.titleQtdCart}>Formas Pagamento</Text>
                                            :
                                            <View />
                                    }
                                    {(this.props.formasRecebimento ? this.props.formasRecebimento : []).map((item, i) => (
                                        <ListItem key={i}
                                            bottomDivider
                                            containerStyle={{ elevation: 3, borderRadius: 5, margin: 2 }}
                                            onPress={() => {
                                                //  this.setState({ isModalVisible: true, venda: item });
                                            }}
                                        >

                                            {/* <Avatar rounded icon={{ name: 'home', color:'#800000' }} /> */}
                                            <ListItem.Content>
                                                {/*                                                     <ListItem.Title style={{ fontFamily: 'Montserrat-Bold' }}>{item.label} </ListItem.Title> */}
                                                <ListItem.Subtitle>
                                                    {`Valor: ${MaskService.toMask('money', parseFloat(item.valor).toFixed(2), { unit: 'R$ ', delimiter: '.', separator: ',', })}`}
                                                </ListItem.Subtitle>
                                            </ListItem.Content>
                                            <ListItem.Chevron name='delete-sweep' containerStyle={{ justifyContent: 'flex-end' }} color='#800000' size={Dimensions.get("screen").width * 2 / 29}
                                                onPress={() => {
                                                    this.props.delFormaRecebimento(item);
                                                    this.setState({
                                                        totalPendente: this.state.totalPendente + item.valor
                                                    })
                                                }} />
                                        </ListItem>
                                    ))
                                    }
                                </View>
                            </List.Accordion>
                        </List.AccordionGroup>
                    </ScrollView>

                    <View style={[style.viewButtonRegister,{margin:4} ]}>
                        <Button
                            style={{ width: '58%', alignSelf: 'center', borderWidth: 3 }}
                            icon="cart-arrow-right" mode="outlined"
                            color='#1e1e46'
                            loading={this.props.loadingReceiveBill}
                            loadingProps={{ size: "large", color: '#1e1e46' }}
                            onPress={async () => {
                                if (!this.props.loadingReceiveBill) {
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
    titulos: state.receiveReducer.titulos,
    formasRecebimento: state.receiveReducer.formasRecebimento,
    total: state.receiveReducer.total,
    loadingReceiveBill: state.receiveReducer.loadingReceiveBill,
    transacoes: state.receiveReducer.transacoes,
})

export default connect(mapStateToProps, {
    addTitulo,
    delTitulo,
    setTotal,
    addFormaRecebimento,
    delFormaRecebimento,
    setLoadingReceive,
    limparDados,
    addTransacoes,
    limparTitulos,
})(formReceive);