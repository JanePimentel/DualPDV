import React, { createRef } from 'react';
import { ScrollView, FlatList, View, Platform, PermissionsAndroid, TouchableOpacity, Alert, Dimensions, StatusBar, Modal } from 'react-native';
import { connect } from 'react-redux';
import { Text, TextInput, Divider, Button, Menu, IconButton, FAB } from 'react-native-paper';
import styleMain from '../../necessary/style/styleMain';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { formatStringDateToDDMMAAAA } from '../../necessary/dateAndHour/dateHour';
import { Wave, Grid } from 'react-native-animated-spinkit';
import styleGlobal from '../../necessary/style/styleGlobal';
import { TB_Vendas, TB_ConfigPrint } from '../../database/DBTables';
import { MaskService } from 'react-native-masked-text';
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import {
    BluetoothManager,
} from 'react-native-bluetooth-escpos-printer';
import { setPrint } from '../../actions/configAction';
import DatePicker from 'react-native-datepicker';
import Icon from 'react-native-vector-icons/FontAwesome5'
import {
    ListItem,
} from 'react-native-elements'
import { printVenda, bluetoothEnable, enableBluetooth } from '../../necessary/Print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const actionSheetRef = createRef();

class formReport extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isVisible: true,
            vendas: [],
            filePath: '',
            data: '',
            loadingSearch: false,
            isModalVisible: false,
            venda: null,
            filePathDetail: ''
        }
        this.getSales();
        this.checkBluetooth();
    }

    /**
     * Verifica conexão bluetooth para impressora
     */
    async checkBluetooth() {
        let size = await this.props.realm.objects(TB_ConfigPrint.name).length;
        const configPrint = (size > 0 ? JSON.parse(JSON.stringify(Array.from(await this.props.realm.objects(TB_ConfigPrint.name))[0])) : null)
        this.props.setPrint(configPrint);

        if (this.props.print != null) {
            BluetoothManager.connect(this.props.print.mac)
        }
    }


    async printSale(venda) {
        let bluetoothEnabled = await bluetoothEnable();
        if (bluetoothEnabled == false) {
            Alert.alert('Atenção!', 'Ligue o bluetooth para seguir com a impressão.');
        } else {
            this.checkBluetooth();
            if (this.props.print == null) {
                Alert.alert('Atenção!', 'A impressora não foi definida nas configurações do aplicativo.');
            } else {
                printVenda(venda)
            }
        }
    }

    /**
     * Concede permissão ao armazenamento do celular para criar pdf 
     */
    requestRunTimePermission = () => {
        var that = this;
        async function externalStoragePermission() {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Permissão para armazenamento interno',
                        message: 'Permitir app acessar armazenamento do celular?',
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    that.createPDF_File();
                } else {
                    alert('WRITE_EXTERNAL_STORAGE permission denied');
                }
            } catch (err) {
                Alert.alert('Write permission err', err);
                console.warn(err);
            }
        }
        if (Platform.OS === 'android') {
            externalStoragePermission();
        } else {
            this.createPDF_File();
        }
    }


    /**Gera pdf com total vendas */
    async createPDF_File() {
        let vend = this.state.vendas;
        let qt = 0;

        vend.forEach(i => { qt = qt + i.total })

        const ht = vend.reduce((ht, vendas) => {
            var cs = vendas.itens.map(function (elem) {
                return `
                     <tr>
                      <td> ${elem.produto.nome}</td>
                      <td> ${elem.qtd}</td>
                      <td> ${MaskService.toMask('money', parseFloat(elem.precoVenda), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}</td>
                      </tr>
                    `
            })

            var pg = vendas.recebimentos.map(function (elem) {
                return `
                <li style="text-align:  left;color: gray;">Forma pagamento.:${elem.formaPagamento.nome}</li>
                    `
            })

            return ht + `
                      <li style="text-align:  left; color: blue; padding-top: 12px";><b>${(vendas.id ? vendas.id : '***')} - ${Number(parseInt(vendas.idCliente)) <= 0 ? 'CONSUMIDOR FINAL' : vendas.cliente.pessoa.nome}</b></li>
                        <ul>
                          <li style="text-align:  left;color: gray;">Data Entrega.:${formatStringDateToDDMMAAAA(vendas.dataEntrega)}</li>
                          ${pg}
                          ${!this.state.dataVendas ? `<li style="text-align:  left;color: gray;">Data Venda.:${formatStringDateToDDMMAAAA(vendas.dataVenda)}</li>` : ''}
                          <li style="text-align:  left;color: gray;">Endereco.:${(vendas.idEnderecoEntrega > 0 ? vendas.cliente.pessoa.endereco.map(e => { if (e.id == vendas.idEnderecoEntrega) return `${e.logradouro}, ${e.numero}, ${e.bairro} - ${e.cidade.mun}/${e.uf}` }) : '***')}</li>
                        </ul>

                 <table border="0.4" width="100%"  
                        border-collapse= "separate"
                        border-spacing= "2px"
                        border-color= "gray">
                      <tr>
                          <td><b>Produto</b></td>
                          <td><b>Quantidade</b></td>
                          <td><b>Preço</b></td>
                      </tr>
                     ${cs}  
                 </table>
                <h3 style="text-align:  right; padding-right: 26px;">${MaskService.toMask('money', parseFloat(vendas.total).toFixed(2), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}</h3>
                <hr size="2" width="100%">
            `;
        }, '');


        let options = {
            // HTML Content for PDF.
            // I am putting all the HTML code in Single line but if you want to use large HTML code then you can use + Symbol to add them.
            html:
                `<h1 style="text-align: center;"><strong>Relatório de Vendas</strong></h1>
                 <h3 style="text-align: left;"><strong>${this.state.dataVendas ? this.state.dataVendas : ''}</strong></h3>
                      <hr size="2" width="100%">
    
                      <p>${ht}</p>
                      <br/>
                      <h2 style="text-align: right;">${MaskService.toMask('money', parseFloat(qt).toFixed(2), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}    </h2>
                     
                      <hr size="2" width="100%">
                      `,
            fileName: `relatorio_vendas`,
            directory: 'Documents',
        };

        let file = await RNHTMLtoPDF.convert(options);
        Alert.alert('Sucesso!', 'Relatório gerado na pasta "Documents".');
        this.setState({ filePath: file.filePath });
    }



    /**Obtém vendas da tabela local */
    async getSales() {
        let vendas = [];

        this.setState({ loadingSearch: true })
        let size = await this.props.realm.objects(TB_Vendas.name).length;
        let tbSales = Array.from(await this.props.realm.objects(TB_Vendas.name).sorted('id', true));
        if (size > 0) {
            for (let i = 0; i < tbSales.length; i++) {
                let value = JSON.parse(tbSales[i].json);
                vendas.push(value);
            }
        }
        vendas.sort((a, b) => a.cliente.pessoa.nome.localeCompare(b.cliente.pessoa.nome))
        this.setState({ vendas: vendas, loadingSearch: false })
    }

    /**Obtém venda por data do usuário */
    async getSaleDate() {
        let venda = [];

        let arrayFormatado = await this.props.realm.objects(TB_Vendas.name);
        for (let i = 0; i < arrayFormatado.length; i++) {
            let value = await JSON.parse(arrayFormatado[i].json);
            if (formatStringDateToDDMMAAAA(value.dataVenda.valueOf()) == this.state.data.valueOf()) {
                venda.push(value)
            }
        }
        this.setState({ vendas: venda.sort((a, b) => a.dataVenda < b.dataVenda) })
    }


    componentDidMount() {
        setTimeout(() => this.setState({ isVisible: !this.state.isVisible }), 2500);
    }


    requestRunTimePermission_detail = () => {
        var that = this;
        async function externalStoragePermission() {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Permissão para armazenamento interno',
                        message: 'Permitir app acessar armazenamento do celular?',
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    that.createPDF_File_Detail();
                } else {
                    alert('WRITE_EXTERNAL_STORAGE permission denied');
                }
            } catch (err) {
                Alert.alert('Write permission err', err);
                console.warn(err);
            }
        }

        if (Platform.OS === 'android') {
            externalStoragePermission();
        } else {
            this.createPDF_File_Detail();
        }
    }

    /**
     * Gera pdf com detalhamento da venda
     */
    async createPDF_File_Detail() {
        let nome = (this.state.venda.cliente && this.state.venda.cliente.id > 0 ? `${String(this.state.venda.cliente.pessoa.nome).toUpperCase()} - ${this.state.venda.cliente.pessoa.cpf_cnpj}` : `Consumidor Final`);
        let venda = (this.state.venda.id ? this.state.venda.id : 'Venda não sincronizada');
        let faturamento = formatStringDateToDDMMAAAA(this.state.venda.dataVenda);
        let entrega = formatStringDateToDDMMAAAA(this.state.venda.dataEntrega);
        let produtos = this.state.venda.itens;
        let endereco = (this.state.venda.idEnderecoEntrega > 0 ? this.state.venda.cliente.pessoa.endereco.map(e => { if (e.id == this.state.venda.idEnderecoEntrega) return `${e.logradouro}, ${e.numero}, ${e.bairro} - ${e.cidade.mun}/${e.uf}` }) : '***')
        let pg = this.state.venda.recebimentos


        const ht = produtos.reduce((ht, product) => {
            return ht + `
                      <li style="text-align:  left; color: blue";><b>${product.produto.nome}</b></li>
                        <ul>
                            <li style="text-align:  left;color: gray">Quantidade - ${product.qtd}
                            <li style="text-align:  left;color: gray">Preço - ${MaskService.toMask('money', parseFloat(product.precoVenda), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}
                        </ul>
            `;
        }, '');

        const pl = pg.reduce((pl, pagamento) => {
            return pl + `
                      <li style="text-align:  left; color: black";><b>${pagamento.formaPagamento.nome}</b></li>
                        <ul>
                            <li style="text-align:  left;">Parcelas - ${pagamento.parcelamento ? pagamento.parcelamento : 0}
                            <li style="text-align:  left;">Valor - ${MaskService.toMask('money', parseFloat(pagamento.valorRecebimento), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}

                        </ul>
            `;
        }, '');

        let options = {
            // HTML Content for PDF.
            // I am putting all the HTML code in Single line but if you want to use large HTML code then you can use + Symbol to add them.
            html:
                `<h1 style="text-align: center;"><strong>Detalhamento de venda</strong></h1>
                <br/>
                      <p style="text-align:  left;"><strong>Cliente.: </strong>${nome}</p>
                      <p style="text-align:  left;"><strong>Venda nº.: </strong>${venda}</p>
                      <p style="text-align:  left;"><strong>Data faturamento.: </strong>${faturamento}</p>
                      <p style="text-align:  left;"><strong>Data Entrega.: </strong>${entrega}</p>
                      <p style="text-align:  left;"><strong>Endereco.: </strong>${endereco}</p>
                      <br/>
                      <hr size="2" width="100%">
    
                      <p>${ht}</p>
                       
                      <hr size="2" width="100%">
                      <br/>
                      <hr size="2" width="100%">

                      <p>${pl}</p>

                      <hr size="2" width="100%">
                      <br/>

                      <hr size="2" width="100%">
                      <h3 style="text-align:  left; padding-left: 12px;">Total</h3>
                      <p style="text-align: left;padding-left: 12px;">${MaskService.toMask('money', parseFloat(this.state.venda.total).toFixed(2), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}</p>
                      <hr size="2" width="100%">
                      `,
            // Setting UP File Name for PDF File.
            fileName: 'detalhamento_venda',
            //File directory in which the PDF File Will Store.
            directory: 'Documents',
        };

        let file = await RNHTMLtoPDF.convert(options);

        Alert.alert('Sucesso!', 'PDF gerado na pasta "Documents".');

        this.setState({ filePathDetail: file.filePathDetail });
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
                    </SkeletonPlaceholder>
                    :
                    <SkeletonPlaceholder highlightColor='#002269' backgroundColor='#d7d6e5'>
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item marginTop={16} width={'95%'} height={56} borderRadius={4} alignSelf={'center'} />
                        <SkeletonPlaceholder.Item
                            marginTop={'5%'}
                            alignSelf="flex-end"
                            width={Dimensions.get("screen").width * 2 / 8}
                            height={Dimensions.get("screen").width * 2 / 8}
                            borderRadius={50}
                        />
                    </SkeletonPlaceholder>
            )
        } else {
            return (
                <View style={styleMain.viewMain}>
                    <StatusBar
                        hidden={false}
                        backgroundColor='#1e1e46' />
                    <View style={{ margin: 12, alignItems: 'center' }}>
                        <DatePicker
                            style={{ width: '98%' }}
                            date={this.state.data}
                            androidMode={'default'}
                            mode="date"
                            placeholder="Data venda"
                            format="DD/MM/YYYY"
                            confirmBtnText="OK"
                            cancelBtnText="Cancelar"
                            showIcon={true}
                            customStyles={{
                                dateIcon: {
                                    position: 'absolute',
                                    left: 0,
                                    top: 4,
                                    marginLeft: 0
                                },
                                dateInput: {
                                    marginLeft: 36,
                                    backgroundColor: 'white',
                                    borderRadius: 7,
                                    backgroundColor: 'white'
                                }
                            }}
                            onDateChange={(date) => {
                                this.setState({ data: date });
                                this.getSaleDate();
                            }}
                        />
                    </View>

                    {this.props.loadingSearch == true ?
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View>
                                <Grid size={Dimensions.get("screen").width * 2 / 6} color='#1e1e46' />
                            </View>
                            <Text style={styleGlobal.titleDateReportManagement, { fontFamily: 'FiraSans-Bold' }}>Carregando vendas...</Text>
                        </View>

                        :

                        (this.state.vendas.length <= 0 ?
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <View>
                                    <Icon size={Dimensions.get("screen").width * 2 / 18} color='#1e1e46' name="sitemap" type={'font-awesome-5'} />
                                </View>
                                <Text style={styleGlobal.titleReportSale}>Não há vendas para essa data!</Text>
                                <FAB
                                    style={{ backgroundColor: 'white' }}
                                    label='Atualizar página'
                                    small
                                    icon="cached"
                                    onPress={() => {
                                        this.getSales();
                                        this.setState({ data: '' })
                                    }}
                                />
                            </View>
                            :
                            <View style={{ flex: 5, marginTop: '3%' }}>
                                <FlatList
                                    scrollEnabled={true}
                                    data={this.state.vendas}
                                    renderItem={({ item, index }) => (
                                        <ListItem key={index}
                                            bottomDivider
                                            containerStyle={{ elevation: 3, borderRadius: 5 }}
                                            onPress={() => {
                                                this.setState({ isModalVisible: true, venda: item });
                                            }}
                                        >
                                            {/* <Avatar rounded icon={{ name: 'home', color:'#800000' }} /> */}
                                            <ListItem.Content>
                                                <ListItem.Title style={{ fontFamily: 'Montserrat-Bold' }}>{`${`${item.id ? 'Venda nº ' + item.id : '*Falta sincronizar'}`}`} </ListItem.Title>
                                                <ListItem.Subtitle>{
                                                    <View>
                                                        {/*   <Text>{`Venda nº ${(item.id ? item.id : 'Falta Sincronizar')}`}</Text> */}
                                                        <Text>{`${Number(parseInt(item.idCliente)) <= 0 ? 'Consumidor Final' : item.cliente.pessoa.nome}`}</Text>
                                                    </View>
                                                }</ListItem.Subtitle>
                                            </ListItem.Content>
                                            <ListItem.Chevron name='print' containerStyle={{ justifyContent: 'flex-end' }} color='#1e1e46' size={Dimensions.get("screen").width * 2 / 29}
                                                onPress={() => {
                                                    this.printSale(item);
                                                }} />
                                        </ListItem>)
                                    }
                                    keyExtractor={(item, index) => index.toString()}
                                    refreshing={this.state.loadingSearch}
                                    onRefresh={() => {
                                        this.getSales()
                                    }}
                                />
                            </View>
                        )
                    }
                    {
                        this.state.vendas.length > 0 ?
                            <IconButton
                                icon='file-pdf-box'
                                color={'red'}
                                style={{ borderWidth: 0, elevation: 2, backgroundColor: 'white', alignSelf: 'flex-end', margin: '7%' }}
                                size={Dimensions.get("screen").width * 2 / 18}
                                onPress={this.requestRunTimePermission}
                            />
                            :
                            <View />
                    }

                    <View>
                        <Modal
                            animationType="slide"
                            transparent={true}
                            visible={this.state.isModalVisible} >
                            <View style={styleGlobal.boxModal}>
                                <View style={styleGlobal.topo}>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({ isModalVisible: false })
                                    }} style={styleGlobal.buttonFechar}>
                                        <Icon color="white" size={30} name="times" type={'font-awesome-5'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styleGlobal.viewContainerHistorico}>
                                <ScrollView>
                                    <Text style={styleGlobal.titleReportSale}>{`DETALHE VENDA`}</Text>
                                    <View style={{ margin: '4%' }}>
                                        <Text >▪ Cliente.: {this.state.venda ? (this.state.venda.cliente && this.state.venda.cliente.id > 0 ? `${String(this.state.venda.cliente.pessoa.nome).toUpperCase()} - ${this.state.venda.cliente.pessoa.cpf_cnpj}` : `Consumidor Final`) : ''}</Text>
                                        <Text >▪ Venda nº.: {this.state.venda ? (this.state.venda.id ? this.state.venda.id : '** Falta sincronizar com o servidor') : ''}</Text>
                                        <Text >▪ Faturado em.:{this.state.venda ? formatStringDateToDDMMAAAA(this.state.venda.dataVenda) : ''} </Text>
                                        <Text >▪ Entrega.: {this.state.venda ? formatStringDateToDDMMAAAA(this.state.venda.dataEntrega) : ''} </Text>
                                        <Text >▪ Endereço entrega.: {this.state.venda ? (this.state.venda.idEnderecoEntrega > 0 ? this.state.venda.cliente.pessoa.endereco.map(e => { if (e.id == this.state.venda.idEnderecoEntrega) return `${e.logradouro}, ${e.numero}, ${e.bairro} - ${e.cidade.mun}/${e.uf}` }) : '***') : '***'}</Text>

                                        <Divider />
                                        <Text style={styleGlobal.titleResum} > {`Itens`}</Text>
                                        <Divider style={{ borderBottomWidth: 1 }} />
                                        {(this.state.venda ? this.state.venda.itens : []).map((item, i) => (
                                            <ListItem key={i}
                                                bottomDivider
                                                containerStyle={{ elevation: 1, backgroundColor: '#f1efee', borderRadius: 5, marginTop: 3 }}
                                            >
                                                {/* <Avatar rounded icon={{ name: 'home', color:'#800000' }} /> */}
                                                <ListItem.Content>
                                                    <ListItem.Title style={{ fontFamily: 'Montserrat-Regular', fontSize: RFPercentage(2.2) }}>{item.produto.nome}</ListItem.Title>
                                                    <ListItem.Subtitle>{
                                                        <View>
                                                            <Text>{`Quantidade: ${item.qtd}  Preço: ${MaskService.toMask('money', parseFloat(item.precoVenda).toFixed(2), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}`}</Text>
                                                        </View>
                                                    }</ListItem.Subtitle>
                                                </ListItem.Content>
                                            </ListItem>
                                        ))
                                        }


                                        <Text style={styleGlobal.titleResum} > {`Formas Pagamento`}</Text>
                                        <Divider style={{ borderBottomWidth: 1 }} />
                                        {(this.state.venda ? this.state.venda.recebimentos : []).map((item, i) => (
                                            <ListItem key={i}
                                                bottomDivider
                                                containerStyle={{ borderRadius: 5, marginTop: 3 }}
                                            >
                                                {/* <Avatar rounded icon={{ name: 'home', color:'#800000' }} /> */}
                                                <ListItem.Content>
                                                    <ListItem.Title style={{ fontFamily: 'Montserrat-Bold' }}>{item.formaPagamento.nome}</ListItem.Title>
                                                    <ListItem.Subtitle>{
                                                        <View>
                                                            <Text>{`Parcelas: ${item.parcelamento ? item.parcelamento : 0}  Valor: ${MaskService.toMask('money', parseFloat(item.valorRecebimento).toFixed(2), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}`}</Text>
                                                            <Text>
                                                                {(
                                                                    item.contaAReceber && item.contaAReceber.titulos ?
                                                                        item.contaAReceber.titulos.map(t => { return `Vencimento: ${formatStringDateToDDMMAAAA(t.dataVencimento)}  Valor: ${MaskService.toMask('money', parseFloat(item.valor).toFixed(2), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' })}\n` })
                                                                        : 'Para mais informações ligue para o setor\nfinanceiro da sua empresa.'
                                                                )}
                                                            </Text>
                                                        </View>
                                                    }</ListItem.Subtitle>
                                                </ListItem.Content>
                                            </ListItem>
                                        ))
                                        }

                                        <Text style={styleGlobal.titleResum} > {`Total`}</Text>
                                        <Divider style={{ borderBottomWidth: 1 }} />
                                        <Text style={{ marginLeft: 9 }}>{this.state.venda ? MaskService.toMask('money', parseFloat(this.state.venda.total).toFixed(2), { precision: 2, delimiter: '.', separator: ',', unit: 'R$' }) : ''}</Text>


                                    </View>
                                    {/**MENU RESUMO, LIMPAR E IMPRIMIR */}
                                    <View style={{ alignSelf: 'center' }}>
                                        <Menu.Item icon="file-pdf-box" onPress={this.requestRunTimePermission_detail} title="PDF" />
                                    </View>
                                </ScrollView>
                            </View>
                        </Modal>
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
    print: state.configReducer.print,
})

export default connect(mapStateToProps, {
    setPrint,
})(formReport);