import React, { createRef } from 'react';
import { ScrollView, View, Platform, Alert, Dimensions, StatusBar } from 'react-native';
import {  ListItem} from 'react-native-elements';
import { connect } from 'react-redux';
import { Text, Surface, TextInput, Badge, Appbar, HelperText, Menu, Divider, Paragraph, DataTable, Dialog, Button, ProgressBar, IconButton, Modal, FAB, TouchableRipple, Portal, Snackbar } from 'react-native-paper';
import { showMessage, hideMessage } from "react-native-flash-message";
import styleMain from '../../necessary/style/styleMain';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { formatDateToAAAAMMDD, getHoraAtual } from '../../necessary/dateAndHour/dateHour';
import Spinner from 'react-native-loading-spinner-overlay';
import { Plane, Circle, Flow, Chase, Swing, Grid, Wave } from 'react-native-animated-spinkit';
import styleGlobal from '../../necessary/style/styleGlobal';
import {
    setLoadingCloseSale,
    limpar,
    setClient,
    addFormaPagamento,
    delFormaPagamento,
    setLoadingStore,
    setLoadingAdd,
    addSacola,
    setIsVendaDireta,
    delItemSacola,
    calcularTotaisSacola,
    limparSacola,
    limparRecebimentos,
    calcularTotalRecebimentos,
    setDesconto,
} from '../../actions/salesAction';
import { TB_Clientes, TB_Pedidos,  TB_FormasPagamento, TB_Caixa, TB_Vendas } from '../../database/DBTables';
import {
    headers
} from '../../config/security';
import Axios from 'axios';
import style from '../../necessary/style/styleLogin';
import { MaskService, TextInputMask } from 'react-native-masked-text';
import Toast from 'react-native-tiny-toast';
import pickerSelectStylesCloseSale from '../../necessary/style/stylePickerSelectSale';
import RNPickerSelect from 'react-native-picker-select';
import { printVenda } from '../../necessary/Print';
import { getToken } from '../../necessary/Token';

const actionSheetRef = createRef();

class formCloseSale extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visibleDescontoJaAplicado: false,
            visibleTable: false,
            clientes: [],
            formasPagamento: [],
            formaPagamento: null,
            especies: [
                { label: 'Dinheiro', value: 'Dinheiro' },
                { label: 'Cheque', value: 'Cheque' },
                { label: 'Depósito', value: 'Crédito em Conta' },
            ],
            especie: null,
            valorAReceber: props.totalRecebimentos == props.total ? 0 : (props.total > props.totalRecebimentos ? (props.total - props.totalRecebimentos) : 0),
            valorPendente: props.totalRecebimentos == props.total ? 0 : (props.total > props.totalRecebimentos ? (props.total - props.totalRecebimentos) : 0),
            numeroParcelas: 0,
            cliente: props.cliente,
            isVendaDireta: props.isVendaDireta,
            isVendaSalva: false,
        }
        this.getClients();
    }


    async getClients() {
        /**Obtem lista clientes da tabela local */
        let size = await this.props.realm.objects(TB_Clientes.name).length;
        let cliente = await this.props.realm.objects(TB_Clientes.name);
        let clientes = [];
        if (size > 0) {
            for (let i = 0; i < cliente.length; i++) {
                let v = cliente[i];
                let cli = await JSON.parse(v.json);
                clientes.push({
                    label: cli.pessoa.nome,
                    value: cli
                })
            }
            await clientes.sort((a, b) => a.value.pessoa.nome.localeCompare(b.value.pessoa.nome))
            this.setState({ clientes: clientes })
        }

        /**Obtem lista formas pg da tabela local */
        let rowCount = await this.props.realm.objects(TB_FormasPagamento.name).length
        let rs = await this.props.realm.objects(TB_FormasPagamento.name);
        let formasPagamento = [];
        if (rowCount > 0) {
            for (let i = 0; i < rs.length; i++) {
                let fp = await JSON.parse(rs[i].json);
                if (String(fp.inativo) === 'false') {
                    formasPagamento.push({
                        label: fp.nome,
                        value: fp
                    })
                }
            }
            this.setState({ formasPagamento: formasPagamento })
        }
    }


    async addFormaPagamento() {
        let total = this.state.valorAReceber + this.props.totalRecebimento;
        let exist = false;

        if (!this.state.formaPagamento) {
            showMessage({
                message: "Atenção!", description: 'Selecione a forma de pagamento.', type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else {
            for (let ii of this.props.recebimentos) {
                if (this.state.formaPagamento.id == ii.idFormaPagamento) {
                    exist = true;
                    break;
                }
            }
            if (this.state.valorPendente <= 0) {
                showMessage({
                    message: "Atenção!", description: 'Valor total já foi inserido na(s) forma(s) de pagamento abaixo.', type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            } else if (total > this.props.total) {
                showMessage({
                    message: "Atenção!", description: `Valor informado ultrapassa o valor total da compra\n\n Total da compra é de R$${this.props.total.toFixed(2)}`, type: "danger", icon: 'info', duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            } else if (exist) {
                showMessage({
                    message: "Atenção!", description: `Forma de pagamento já inserida.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            } else if (!this.state.especie) {
                showMessage({
                    message: "Atenção!", description: `Selecione a espécie do pagamento.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            } else if (Number(this.state.valorAReceber) <= 0.01 && this.state.valorPendente > 0) {
                showMessage({
                    message: "Atenção!", description: `Informe o valor que foi recebido nessa forma de pagamento.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
                this.setState({ valorAReceber: this.state.valorPendente });
            } else if (this.props.cliente == null && String(this.state.formaPagamento.prazo) == 'true') {
                showMessage({
                    message: "Atenção!", description: `Pagamento a prazo só podem ser utilizadas quando o cliente é selecionado!`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            } else if (this.state.formaPagamento != null && String(this.state.formaPagamento.prazo) == 'true' && Number(this.state.numeroParcelas) <= 0) {
                showMessage({
                    message: "Atenção!", description: `Informe o numero de parcelas.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            } else if (this.state.formaPagamento && String(this.state.formaPagamento.prazo) == 'true'
                && (this.props.cliente.limiteFinanceiro
                    && String(this.props.cliente.limiteFinanceiro.limiteAtivo) == "true"
                    && Number(this.props.cliente.limiteFinanceiro.saldoLimite) < Number(this.state.valorAReceber))) {
                showMessage({
                    message: "Atenção!", description: `O cliente não possui limite financeiro suficiente.`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                });
            } else {
                const fr = {
                    especie: this.state.especie,
                    formaPagamento: this.state.formaPagamento,
                    idFormaPagamento: this.state.formaPagamento.id,
                    numeroParcelas: this.state.numeroParcelas,
                    valorRecebimento: Number(this.state.valorAReceber)
                }

                this.props.addFormaPagamento(fr);
                this.props.calcularTotalRecebimentos();
                let t = (Number(this.state.valorPendente) - Number(fr.valorRecebimento));
                let u = (Number(this.state.valorPendente) - Number(fr.valorRecebimento));
                this.setState({
                    valorPendente: t,
                    valorAReceber: u,
                })
            }
        }
    }

    async imprimir() {
        /*   let bluetoothEnabled = await bluetoothEnable();
          if (bluetoothEnabled == false) {
              Alert.alert('Atenção!', 'Ligue o bluetooth para seguir com a impressão!');
          } else {
              this.verificarConexaoBlu();
              if (this.props.print == null) {
                  Alert.alert('Atenção!', 'A impressora não foi definida nas configurações do aplicativo!');
                  //this.props.navigation.navigate('configuracoes');
              } else {
                  const objetoVisita = {
                      token: getToken(this.props.usuario.id, getDataAtual() + getHoraAtual()),
                      dataVisita: formatStringDateToAAAAMMDD(this.props.dataVisita),
                      horaVisita: getHoraAtual(),
                      user: this.props.usuario.grupoAcesso2_0.nome,
                      alojamentoAves: this.props.alojamentoVisita,
                      idAlojamento: this.props.alojamentoVisita.id,
                      und: this.props.unidade.unidade,
                      idGalpao: this.props.galpaoVisita.id,
                      galpao: this.props.galpaoVisita,
                      desperdicioRacao: this.props.checkDesperdicio,
                      obsDesperdicioRacao: this.props.obsDesperdicioRacao,
                      faltaRacao: this.props.checkFalta,
                      obsFaltaRacao: this.props.obsFaltaRacao,
                      alturaComedouroErrado: this.props.checkAltura,
                      obsAlturaComedouroErrado: this.props.obsAlturaComedouro,
                      qualidadeRacao: this.props.checkQualidade,
                      obsQualidadeRacao: this.props.obsQualidadeRacao,
                      avaliarAgua: this.props.checkAvaliarAgua,
                      cloro: this.props.cloro,
                      ph: this.props.ph,
                      alcalinidade: this.props.alcalinidade,
                      dureza: this.props.dureza,
                      obsQualidadeAgua: this.props.obsQualidadeAgua,
                      faltaAgua: this.props.checkFaltaAgua,
                      alturaBebedouroErrada: this.props.checkAlturaBebedouro,
                      aquecimentoIrregular: this.props.checkAquecimento,
                      obsAquecimentoIrregular: this.props.obsAquecimento,
                      cortinas: this.props.checkCortinas,
                      obsCortina: this.props.obsCortinas,
                      ventilacaoIrregular: this.props.checkVentilacao,
                      obsVentilacaoIrregular: this.props.obsVentilacao,
                      encarregadoAusente: this.props.checkEncarregado,
                      obsSobreEncarregado: this.props.obsEncarregado,
                      espacamentoIrregular: this.props.checkEspacamento,
                      obsEspacamentoIrregular: this.props.obsEspacamento,
                      mortalidade: this.props.mortalidade ? this.props.mortalidade : 0,
                      sacrificios: this.props.sacrificios ? this.props.sacrificios : 0,
                      pesos: this.props.listaPesagem,
                      pesoMaximo: this.props.pesoMaximo,
                      pesoMinimo: this.props.pesoMinimo,
                      pesoMedio: this.props.pesoMedio,
                      qtdAvesPesadas: this.props.totalAves,
                      empenamentoRuim: this.props.checkEmpenamento,
                      obsEmpenamento: this.props.obsEmpenamento,
                      presencaEspirros: this.props.checkEspirros,
                      avesTrites: this.props.checkAvesTristes,
                      pigmentacaoAlterada: this.props.checkPigmentacao,
                      uniformidade: this.props.uniformidade,
                      observacoesGerais: this.props.obsGeral,
                      recomendacoes: this.props.obsRecomendacao,
                      espacamentoIrregular: this.props.checkEspacamento,
                      obsEspacamentoIrregular: this.props.obsEspacamento,
                  }
                  printVisita(objetoVisita);
                  if (this.state.visitaSalva == true) {
                      this.props.limparVisita();
                      this.props.navigation.navigate('main');
                  }
              }
          } */
    }


    /*   async verificarConexaoBlu() {
          let size = await this.props.realm.objects(TB_ConfigPrint.name).length;
          const configPrint = (size > 0 ? JSON.parse(JSON.stringify(Array.from(await this.props.realm.objects(TB_ConfigPrint.name))[0])) : null)
          this.props.setPrint(configPrint)
  
          if (this.props.print != null) {
              BluetoothManager.connect(this.props.print.mac)
          }
      } */

    async salvar() {
        let tudoCertoServer = false;
        let idVenda = 0;

        if (!this.props.configComercial | (this.props.configComercial && this.props.configComercial.idTipoVendaPadraoPDV <= 0)) {
            showMessage({
                message: "Atenção!", description: `Faça uma sincronização completa para carregar os parametros comerciais!`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (this.props.recebimentos.length <= 0) {
            showMessage({
                message: "Atenção!", description: `Inclua as formas de recebimento clicando no "+"!`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else if (this.state.valorPendente > .05) {
            this.setState({ valorAReceber: this.state.valorPendente });
            showMessage({
                message: "Atenção!", description: `Ainda falta informar como será recebido ${MaskService.toMask('money', parseFloat(this.state.valorPendente).toFixed(2), { separator: ',', delimiter: '.', unit: 'R$ ' })}`, type: "danger", icon: 'info', duration: 5000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
            });
        } else {
            this.props.setLoadingCloseSale(true);
            try {
                let formasPagamento = [];
                let totalRecebido = 0.0;
                let recebimentos = this.props.recebimentos;

                for (let indexR = 0; indexR < recebimentos.length; indexR++) {
                    let v = recebimentos[indexR];
                    if (String(v.formaPagamento.prazo) == 'true') {
                        formasPagamento.push({
                            formaPagamento: v.formaPagamento,
                            idFormaPagamento: v.idFormaPagamento,
                            numeroParcelas: v.numeroParcelas,
                            totalAPagar: v.valorRecebimento,
                            porcentagemPagamento: ((Number(v.valorRecebimento) * 100) / Number(this.props.total)),
                            idSolicitacao: 0,
                        })
                    } else {
                        totalRecebido += Number(v.valorRecebimento);

                        v.transacaoCaixa = {
                            und: this.props.unidade.unidade,
                            idMovimentacao: this.props.caixa.idMovimentacaoCaixa,
                            entrada: true,
                            dataInformada: formatDateToAAAAMMDD(new Date()),
                            dataTransacao: formatDateToAAAAMMDD(new Date()),
                            horaTransacao: getHoraAtual(),
                            pessoa: (!this.props.cliente ? null : this.props.cliente.pessoa),
                            idPessoa: (!this.props.cliente ? 0 : this.props.cliente.id),
                            nomePessoa: (!this.props.cliente ? 'Consumidor final' : ''),
                            valor: v.valorRecebimento,
                            especieTransitada: this.state.especie,
                            cheque: null,
                            registroCheque: 0,
                            contaBancariaOrigem: null,
                            idContaBancariaOrifem: 0,
                            planoFinanceiro: null,
                            idPlanoFinanceiro: 0,
                            centroCusto: null,
                            idCentroCusto: 0,
                            opcaoUsada: 'VENDAS',
                            historico: `Rec. de ${MaskService.toMask('money', parseFloat(v.valorRecebimento).toFixed(2), { separator: ',', delimiter: '.', unit: 'R$ ' })} da Venda ${this.props.id} no PDV.`,
                        }
                    }
                }

                const venda = {
                    unidade: this.props.unidade,
                    und: this.props.unidade.unidade,
                    cliente: this.props.cliente,
                    idCliente: (!this.props.cliente ? 0 : this.props.cliente.id),
                    pedido: this.props.pedido,
                    idPedido: (this.props.pedido ? this.props.pedido.id : 0),
                    entrega: (this.props.pedido ? this.props.pedido.isEntrega : false),
                    tipoVenda: this.props.configComercial.tipoVendaPadraoPDV,
                    idTipoVenda: this.props.configComercial.idTipoVendaPadraoPDV,
                    idEnderecoEntrega: (this.props.pedido ? this.props.pedido.idEnderecoEntrega : 0),
                    gerarFreteCarrego: (this.props.pedido ? this.props.pedido.naoGerarFreteCarrego : false),
                    gerarFreteEntrega: (this.props.pedido ? this.props.pedido.naoGerarFreteEntrega : false),
                    dataVenda: formatDateToAAAAMMDD(new Date()),
                    dataEntrega: formatDateToAAAAMMDD(new Date()),
                    mobile: true,
                    vendedor: (this.props.pedido ? this.props.pedido.vendedor : null),
                    idVendedor: (this.props.pedido && this.props.pedido.vendedor ? this.props.pedido.vendedor.id : 0),
                    atacado: (!this.props.cliente ? false : this.props.cliente.clienteAtacado),
                    liberado: true,
                    fechado: true,
                    subtotal: this.props.subtotal,
                    desconto: this.props.desconto,
                    total: this.props.total,
                    totalRecebido: totalRecebido,
                    idCaixa: this.props.caixa.idMovimentacaoCaixa,
                    itens: this.props.sacola,
                    recebimentos: recebimentos,
                    formasPagamento: formasPagamento,
                    token: getToken(this.props.usuario.id, (this.props.realm.objects(TB_Vendas.name).length + 1))
                }

                const ppd = {
                    dbName: this.props.infoSistema.dbName,
                    objetoNovo: JSON.stringify(venda),
                    und: this.props.unidade.unidade,
                    usuario: this.props.usuario.login,
                    usuarioPC: Platform.OS,
                    nomePC: Platform.OS,
                    sistemaOperacionalPC: `${Platform.OS} ${Platform.Version}`,
                    nomeJanela: 'PDV - Vendas'
                }
                // console.log(ppd.objetoNovo)
                //return
                /**  Grava venda no dispositivo */
                let idVendaLocal = 0
                await this.props.realm.write(() => {
                    let size = this.props.realm.objects(TB_Vendas.name).length;
                    idVendaLocal = (size + 1);
                    this.props.realm.create(TB_Vendas.name, {
                        id: idVendaLocal,
                        json: JSON.stringify(venda)
                    })
                })

                /**  Marca liberado==true se pedido liberado na entrega */
                if (this.props.isVendaDireta == false) {
                    await this.props.realm.write(() => {
                        let ped = this.props.realm.objects(TB_Pedidos.name);
                        for (let pedido of ped) {
                            let tb = JSON.parse(pedido.json);
                            if (tb.id == this.props.pedido.id) {
                                tb.liberado = true;
                                pedido.json = JSON.stringify(tb);
                                this.props.realm.create(TB_Pedidos.name, pedido, true)
                            }
                        }
                    });
                }

                try {
                    const response = await Axios.post(`${this.props.infoSistema.hostServidor}comercial/liberacaoLancamentoVendas/inserir`, ppd, headers);
                    if (response.status == 200 && response.data) {
                        tudoCertoServer = true;
                        let vRet = await JSON.parse(JSON.stringify(response.data));
                        if (!Array.isArray(vRet.recebimentos)) {
                            vRet.recebimentos = [vRet.recebimentos]
                        }

                        /**Grava os dados da venda atualizada e as Transações no caixa /
                         * Update na venda 
                         * */
                        this.props.realm.write(() => {
                            this.props.realm.create(TB_Vendas.name, {
                                id: idVendaLocal,
                                json: JSON.stringify(vRet)
                            }, true)

                            /**  Inserção das transações na tabela caixa e props caixa*/
                            for (let indexRR = 0; indexRR < vRet.recebimentos.length; indexRR++) {
                                let v = vRet.recebimentos[indexRR];
                                if (v.transacaoCaixa != null) {
                                    this.props.caixa.lancamentos.push(v.transacaoCaixa)
                                }
                            }
                            this.props.realm.create(TB_Caixa.name, {
                                id: parseInt(this.props.caixa.idMovimentacaoCaixa),
                                json: JSON.stringify(this.props.caixa),
                                sincronizado: true
                            }, true)
                        })

                        /** Imprime venda*/
                        vRet.subtotalSemPerdas = this.props.subtotalSemPerdas;
                        vRet.totalDescontoPerdas = this.props.totalDescontoPerdas;
                        idVenda = vRet.id;

                        printVenda(vRet);
                    }
                } catch (error) {
                    tudoCertoServer = false;
                    console.log('Dentro do Envio para o servidor!\n\nErro: ' + error);
                    Alert.alert('Atenção!', 'Registro gravado apenas no dispositivo, mas falhou no envio para a central.\n\nAcesse o menu \"Sincronizar\" e faça o envio manual no botão "Parcial".');
                }

                if (tudoCertoServer == true) {
                    Alert.alert('Confirmação', `Venda realizada com sucesso!\n\nId.: ${idVenda}`)
                    Toast.showSuccess('Venda enviada com sucesso!', {
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
                        message: "Sucesso!", description: 'Venda enviada com sucesso!', type: "success", icon: "success", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                    this.props.limpar();
                    this.props.navigation.navigate('main');
                } else {
                    showMessage({
                        message: "Ops", description: 'Faça a sincronização manual do registro!', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                    this.props.limpar();
                    this.props.navigation.navigate('main');
                }
            } catch (error) {
                console.log(error)
                if (!!error.isAxiosError && !error.response) {
                    showMessage({
                        message: "Atenção!", description: 'Verifique sua conexão com a internet e tente novamente!', type: "warning", icon: "warning", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                    });
                } else {
                    Alert.alert('Falha!', `Falha!\n\nEntre em contato com nosso time de Suporte e informe a mensagem abaixo:\n\nMsg.: ${error}`);
                }
            }
        }
        this.props.setLoadingCloseSale(false);
    }


    render() {
        const { height: DEVICE_HEIGHT } = Dimensions.get('window');

        return (
            <View style={styleMain.viewMain}>
                <StatusBar
                    hidden={false}
                    backgroundColor='#1e1e46' />
                <Spinner
                    visible={this.props.loadingCloseSale}
                    textContent={'Enviando venda...'}
                    textStyle={{ color: 'white', fontSize: RFPercentage(2.9), fontFamily: 'Roboto-Light' }}
                    customIndicator={<Wave size={Dimensions.get("screen").width * 2 / 8} color='#040739' />}
                />
                <ScrollView>
                    <View style={{ margin: '5%' }}>
                        <Text> {`Selecione o Cliente`}</Text>
                        <View style={{ flex: 1, margin: '3%' }}>
                            <RNPickerSelect
                                placeholderTextColor='black'
                                placeholder={{
                                    label: 'Consumidor final',
                                    value: null
                                }}
                                value={this.state.cliente}
                                items={this.state.clientes}
                                onValueChange={value => {
                                    if (value) {
                                        this.setState({ cliente: value });
                                        this.props.setClient(value);
                                    }
                                }}
                                style={pickerSelectStylesCloseSale}
                                useNativeAndroidPickerStyle={false}
                            />
                        </View>
                        <View>
                            <Text> {`Selecione forma pagamento`}</Text>
                            <View style={{ flex: 1, margin: '3%' }}>
                                <RNPickerSelect
                                    placeholderTextColor='black'
                                    placeholder={{
                                        label: 'Selecione pagamento',
                                        value: null
                                    }}
                                    value={this.state.formaPagamento}
                                    items={this.state.formasPagamento}
                                    onValueChange={value => {
                                        this.setState({
                                            formaPagamento: value,
                                            numeroParcelas: (this.state.formaPagamento != null && this.state.formaPagamento.prazo == 'true' ?
                                                1 : 0)
                                        })
                                    }}
                                    style={pickerSelectStylesCloseSale}
                                    useNativeAndroidPickerStyle={false}
                                />
                            </View>
                        </View>
                        <View>
                            <Text> {`Selecione a espécie`}</Text>
                            <View style={{ flex: 1, margin: '3%' }}>
                                <RNPickerSelect
                                    placeholderTextColor='black'
                                    placeholder={{
                                        label: 'Selecione espécie',
                                        value: null
                                    }}
                                    value={this.state.especie}
                                    items={this.state.especies}
                                    onValueChange={value => {
                                        this.setState({ especie: value })
                                    }}
                                    style={pickerSelectStylesCloseSale}
                                    useNativeAndroidPickerStyle={false}
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', margin: 7 }}>
                            <View>
                                <Text> {`Aplicar desconto?`}</Text>
                                <TextInput
                                    mode="flat"
                                    style={styleGlobal.inputStore}
                                    render={props =>
                                        <TextInputMask
                                            {...props}
                                            type={'money'}
                                            value={parseFloat(this.props.desconto).toFixed(2)}
                                            onChangeText={(masked, rowValue) => {

                                                if (this.props.subtotal == this.props.totalRecebimentos) {
                                                    this.setState({  visibleDescontoJaAplicado: true })

                                                } else {
                                                    this.props.setDesconto(parseFloat(rowValue).toFixed(2));
                                                    this.props.calcularTotaisSacola();
                                                    this.props.calcularTotalRecebimentos();
                                                }
                                            }}
                                            onEndEditing={(masked, rowValue) => {
                                                this.setState({
                                                    valorAReceber: this.props.total == this.props.totalRecebimentos ? 0 : (this.props.total > this.props.totalRecebimentos ? this.props.total - this.props.totalRecebimentos : 0),
                                                    valorPendente: this.props.total == this.props.totalRecebimentos ? 0 : (this.props.total > this.props.totalRecebimentos ? this.props.total - this.props.totalRecebimentos : 0),
                                                })
                                                if (this.props.desconto > this.props.subtotal) {
                                                    showMessage({
                                                        message: "Atenção!", description: 'Desconto não permitido.', type: "danger", icon: 'info', duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                                    });
                                                    Alert.alert('Atenção!', 'Desconto não pode ser maior que o total da sacola.');
                                                }
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
                            <Portal>
                                <Dialog visible={this.state.visibleDescontoJaAplicado} onDismiss={() => {
                                    this.setState({  visibleDescontoJaAplicado: false })
                                }}>
                                    <Dialog.Title>Atenção!</Dialog.Title>
                                    <Dialog.Content>
                                        <Paragraph>O total da compra já foi informado nas formas de pagamento.</Paragraph>
                                        <Paragraph>Deseja limpar os recebimentos para reaplicar o desconto ?</Paragraph>
                                    </Dialog.Content>
                                    <Dialog.Actions>
                                        <Button onPress={() => {
                                            this.setState({  visibleDescontoJaAplicado: false });
                                        }}>Cancelar</Button>
                                    </Dialog.Actions>
                                    <Dialog.Actions>
                                        <Button onPress={() => {
                                            this.props.limparRecebimentos();
                                            this.props.calcularTotalRecebimentos();
                                            this.props.setDesconto(0.0);
                                            this.setState({  visibleDescontoJaAplicado: false });
                                        }}>OK</Button>
                                    </Dialog.Actions>
                                </Dialog>
                            </Portal>
                            <View>
                                <Text style={{ textAlign: 'center' }}> {`Total`}</Text>
                                <TextInput
                                    mode="flat"
                                    disabled={true}
                                    style={styleGlobal.inputStore}
                                    render={props =>
                                        <TextInputMask
                                            {...props}
                                            type={'money'}
                                            value={this.props.total}
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
                        <View style={{ flexDirection: 'row', margin: 7 }}>
                            <View>
                                <Text> {`Valor a Receber`}</Text>
                                <TextInput
                                    mode="flat"
                                    style={styleGlobal.inputStore}
                                    render={props =>
                                        <TextInputMask
                                            {...props}
                                            type={'money'}
                                            value={parseFloat(this.state.valorAReceber).toFixed(2)}
                                            onChangeText={(masked, rowValue) => {
                                                let total = this.state.valorAReceber + this.props.totalRecebimentos;
                                                if (rowValue < total) {
                                                    this.setState({
                                                        valorAReceber: Number(rowValue)
                                                    })
                                                } else {
                                                    showMessage({
                                                        message: "Atenção!", description: 'Valor não pode ser maior que total venda!', type: "danger", icon: "danger", duration: 4000, titleStyle: { fontFamily: 'FiraSans-ExtraBold' },
                                                    });
                                                }
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
                            <View>
                                <Text style={{ textAlign: 'center' }}> {`Parcelas`}</Text>
                                <TextInput
                                    mode="flat"
                                    style={styleGlobal.inputStore}
                                    editable={(this.state.formaPagamento && String(this.state.formaPagamento.prazo) == 'true')}
                                    render={props =>
                                        <TextInputMask
                                            {...props}
                                            type={'only-numbers'}
                                            value={this.state.numeroParcelas}
                                            onChangeText={(value) => {
                                                this.setState({ numeroParcelas: Number(value) })
                                            }}
                                        />
                                    }
                                />
                            </View>
                            <IconButton
                                icon='plus-thick'
                                color={'white'}
                                size={Dimensions.get("screen").width * 2 / 29}
                                animated={true}
                                style={{ backgroundColor: '#1e1e46', marginTop: 21 }}
                                onPress={() => {
                                    this.addFormaPagamento();
                                    this.props.calcularTotalRecebimentos();
                                }}
                            />
                        </View>
                    </View>

                    <View style={{ flex: 6, marginTop: 12 }}>
                        {
                            this.props.recebimentos.length > 0 ?
                                <Text style={styleGlobal.titleHousing}>{`Formas pagamento`}</Text>
                                :
                                <View />
                        }

                        {(this.props.recebimentos ? this.props.recebimentos : []).map((item, i) => (
                            <ListItem key={i}
                                bottomDivider
                                containerStyle={{ elevation: 2, borderRadius: 5, marginTop: 3, margin: 7 }}
                            >
                                <ListItem.Content>
                                    <ListItem.Title style={{ fontFamily: 'Montserrat-Bold', }}>{item.formaPagamento.nome}</ListItem.Title>
                                    <ListItem.Subtitle>{
                                        <View>
                                            <Text>{`Valor: ${MaskService.toMask('money', parseFloat(item.valorRecebimento).toFixed(2), { unit: 'R$ ', delimiter: '.', separator: ',', })}${(item.numeroParcelas > 0 ? ' em ' + item.numeroParcelas + 'x' : '')}`}</Text>
                                        </View>
                                    }</ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Chevron name='delete-sweep' containerStyle={{ justifyContent: 'flex-end' }} color='#800000' size={Dimensions.get("screen").width * 2 / 29}
                                    onPress={() => {
                                        this.setState({
                                            ...this.state,
                                            valorPendente: Number(this.state.valorPendente) + Number(item.valorRecebimento),
                                            valorAReceber: Number(this.state.valorPendente) + Number(item.valorRecebimento)
                                        })
                                        this.props.delFormaPagamento(item);
                                        this.props.calcularTotalRecebimentos();
                                    }} />
                            </ListItem>))
                        }
                        {
                            this.props.recebimentos.length > 0 ?
                                <Menu.Item icon="view-list" onPress={() => {
                                    this.setState({ visibleTable: true })
                                }} title="Resumo itens" style={{ alignSelf: 'center' }} />
                                :
                                <View />
                        }
                    </View>
                    <Portal>
                        <Dialog visible={this.state.visibleTable} onDismiss={() => {
                            this.setState({ visibleTable: false })
                        }}>
                            <Dialog.ScrollArea>
                                <ScrollView contentContainerStyle={{ paddingHorizontal: 3 }}>
                                    <DataTable style={{width:'103%'}}>
                                        <DataTable.Header>
                                            <DataTable.Title>Nome</DataTable.Title>
                                            <DataTable.Title numeric>Preço</DataTable.Title>
                                            <DataTable.Title numeric>Qtd</DataTable.Title>
                                        </DataTable.Header>

                                        {this.props.sacola.map((item, key) => (
                                            <DataTable key={key}>
                                                <DataTable.Row>
                                                    <DataTable.Cell>{item.produto.nome}</DataTable.Cell>
                                                    <DataTable.Cell numeric>{item.precoVenda}</DataTable.Cell>
                                                    <DataTable.Cell numeric>{item.qtd}</DataTable.Cell>
                                                </DataTable.Row>
                                            </DataTable>))}
                                        <Divider />
                                        {/*      <DataTable.Row>
                                                <DataTable.Cell >TOTAL</DataTable.Cell>
                                                <DataTable.Cell numeric >234</DataTable.Cell>
                                                <DataTable.Cell numeric>456</DataTable.Cell>
                                            </DataTable.Row> */}
                                    </DataTable>
                                </ScrollView>
                            </Dialog.ScrollArea>
                        </Dialog>
                    </Portal>
                    <View style={[style.viewButtonRegister, { flex: 1, margin: 12 }]}>
                        <Button
                            style={{ width: '58%', alignSelf: 'center', borderWidth: 3 }}
                            icon="cash-plus" mode="outlined"
                            color='#1e1e46'
                            loading={this.props.loadingCloseSale}
                            loadingProps={{ size: "large", color: '#16273f' }}
                            onPress={async () => {
                                if (!this.props.loadingCloseSale) {
                                    this.salvar();
                                }
                            }} >
                            Finalizar
                        </Button>
                    </View>
                </ScrollView>
            </View >
        )
    }
    // }
}

const mapStateToProps = (state) => ({
    usuario: state.userReducer.usuario,
    realm: state.registerReducer.realm,
    caixa: state.pdvReducer.caixa,
    caixaAberto: state.pdvReducer.caixaAberto,
    infoSistema: state.registerReducer.infoSistema,
    unidade: state.userReducer.unidade,
    configComercial: state.configReducer.configComercial,
    loadingCloseSale: state.salesReducer.loadingCloseSale,
    sacola: state.salesReducer.sacola,
    pedido: state.salesReducer.pedido,
    total: state.salesReducer.total,
    subtotal: state.salesReducer.subtotal,
    desconto: state.salesReducer.desconto,
    totalItensSacola: state.salesReducer.totalItensSacola,
    subtotalSemPerdas: state.salesReducer.subtotalSemPerdas,
    totalDescontoPerdas: state.salesReducer.totalDescontoPerdas,
    isVendaDireta: state.salesReducer.isVendaDireta,
    recebimentos: state.salesReducer.recebimentos,
    totalRecebimentos: state.salesReducer.totalRecebimentos,
    cliente: state.salesReducer.cliente,
})

export default connect(mapStateToProps, {
    setLoadingCloseSale,
    limpar,
    setClient,
    addFormaPagamento,
    delFormaPagamento,
    setLoadingStore,
    setLoadingAdd,
    addSacola,
    delItemSacola,
    setIsVendaDireta,
    calcularTotaisSacola,
    limparSacola,
    limparRecebimentos,
    calcularTotalRecebimentos,
    setDesconto
})(formCloseSale);