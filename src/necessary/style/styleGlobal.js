import { StyleSheet, Dimensions, PixelRatio, Appearance, Platform } from "react-native";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

const l = Appearance.getColorScheme();
const largura = Dimensions.get("screen").width * 2 / 3;
const altura = Dimensions.get("screen").height * 1 / 13;
const { height: DEVICE_HEIGHT } = Dimensions.get('window');

{/**Para imagem
const width = Dimensions.get("screen");
height:568/678 * width
Altura da imagem dividida pela largura e multiplicada pelo width */}

const widthPercentageToDP = widthPercent => {
    const screenWidth = Dimensions.get('window').width;
    return PixelRatio.roundToNearestPixel(screenWidth * parseFloat(widthPercent) / 100);
};

const heightPercentageToDP = heightPercent => {
    const screenHeight = Dimensions.get('window').height;
    return PixelRatio.roundToNearestPixel(screenHeight * parseFloat(heightPercent) / 100);
};

const styleGlobal = StyleSheet.create({


    /**SYNC */
    titleSyn: {
        fontSize: RFPercentage(2.6),
        margin: 3
    },
    viewSyn: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        alignSelf: 'stretch',
        padding: 12
    },

    /**MAIN */
    viewMain: {
        flex: 1,
        marginTop: '3%'
    },
    titleSyncMain: {
        fontSize: RFPercentage(2.4),
        textAlign: 'center',
        margin: 6
    },

    containerModal: {
        backgroundColor: 'white',
        padding: 20
    },



    /**VENDA */
    titleInformation: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: RFValue(11, 490),
        textAlign: 'left',
        color: 'black',
    },
    viewStore: {
        paddingLeft: 33,
        flexDirection: 'row',
        marginTop: 6
    },
    titleTableResum: {
        fontSize: RFPercentage(3.4),
        fontFamily: 'Montserrat-Bold',
    },
    inputStore: {
        width: Dimensions.get("screen").width * 2 / 6,
        height: Dimensions.get("screen").width * 2 / 15,
        margin: '2%',
        elevation: 0,
        // backgroundColor: 'white'
    },
    viewHeader: {
        flex: 1,
        flexDirection: "column",
        alignItems: 'flex-start',
    },
    viewFlatlist: {
        flexDirection: 'row',
        backgroundColor: "#FFFAFA",
        borderRadius: 6,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 6.84,
        elevation: 7,
        width: '95%',
        minHeight: 190,
        // borderWidth: 0.3,
    },
    viewPrice: {
        width: '97%',
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
        borderBottomWidth: 0.7
    },
    titlePriceItem: {
        fontSize: RFPercentage(2.4),
        fontFamily: 'Montserrat-Light',
    },

    viewBottomStore: {
        margin: 1,
        marginRight: '4%',
        paddingBottom: 4,
        flexDirection: 'column',
        borderWidth: 0.5,
        borderRadius: 6,
    },

    titleQtdCart: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFPercentage(2.6),
        color: '#1C1C1C',
        textAlign: 'center',
        marginBottom: 3,
        marginTop: 4,
        marginRight: 4,
        marginLeft: 3,
        borderBottomWidth: 0.5
    },

    viewBoxSubTotal: {
        flex: 1,
        borderBottomWidth: 0,
        borderColor: '#040739'
    },


    /**DESPESA */
    inputStoreExpense: {
        width: Dimensions.get("screen").width * 2 / 2.4,
        // height: Dimensions.get("screen").width * 2 / 15,
        margin: '2%',
        elevation: 0,
        // backgroundColor: 'white'
    },


    /**
     * RELATORIO DE VENDA
     */

    titleReportSale: {
        borderBottomWidth: 0.5,
        textAlign: 'center',
        paddingVertical: 12,
        margin: 6
    },
    titleResum: {
        fontFamily: 'Montserrat-SemiBold',
        textTransform: 'capitalize',
        fontSize: RFPercentage(2.6),
        padding: 8
    },




    /**BOX MODAL*/
    viewContainerHistorico: {
        backgroundColor: 'white',
        width: "100%",
        flex: 8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.32,
        shadowRadius: 5.46,
    },
    viewTopHistorico: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        margin: 15,
        alignItems: 'center'
    },
    boxModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    topo: {
        height: "80%",
    },
    buttonFechar: {
        padding: 10,
        alignItems: "flex-end",
        // flex: 1
    },




    /**ALOJAMENTO */
    viewMainHousing: {
        flex: 1,
        borderBottomWidth: 3,
        borderBottomColor: '#06686c',
        marginTop: '3%'
    },
    titleHousing: {
        borderBottomWidth: 0.5,
        textAlign: 'center',
        paddingVertical: 12,
        margin: 6
    },

    /**COMPLEMENTO */
    titleHeader: {
        fontSize: RFPercentage(2.6),
        color: '#1d1b1b',
        fontFamily: 'Montserrat-Regular',
        textAlign: 'left',
        marginTop: '3%'
    },
    titleItems: {
        fontSize: RFPercentage(2.4),
        borderBottomWidth: 2,
        textAlign: 'center',
        paddingVertical: 12,
        margin: 6
    },




    /**ESTOQUE */
    buttonStock: {
        alignItems: 'center',
        backgroundColor: '#fffafa',
        width: Dimensions.get("screen").width * 1 / 2,
        height: Dimensions.get("screen").width * 2 / 6.7,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 7
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.44,
        elevation: 5,
    },

    flatlistStock: {
        borderBottomWidth: 0.7,
        backgroundColor: 'white',
        margin: 2
    },


    /**ENVIO PRODUTO */



    /**VISITA */

    commentInput: {
        borderWidth: 0.4,
        borderRadius: 5,
        backgroundColor: 'white',
        margin: 6,
        color: 'black'
    },

    valueInput: {
        color: 'black',
        borderWidth: 0.4,
        backgroundColor: 'white',
        margin: 6,
        backgroundColor: 'white',
        textAlign: 'center'
    },

    resum: {
        fontFamily: 'Montserrat-SemiBold', textTransform: 'capitalize'
    },

   


    /**EDITAR VISITA */

    viewSurface: {
        padding: 8,
        elevation: 1,
        margin: '1%',
        borderRadius: 5
    },


    /////  X /////////
    /**LOJA*/
    subtitleHeader: {
        fontSize: RFPercentage(2.6),
        color: '#1d1b1b',
        fontFamily: 'Montserrat-Bold',
        textAlign: 'center'
    },

    viewSecondary: {
        flex: 5,
        // alignItems: 'center',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 5,
        backgroundColor: '#fffafa',
        borderRadius: 6,
        elevation: 8,
        //padding: 12
    },
    viewDetails: {
        marginTop: 17,
        padding: 9,
        alignSelf: 'center'
    },

    viewInformation: {
        marginHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderColor: 'gray',
        marginTop: 5,
        marginBottom: 5,
        width: Dimensions.get("screen").width * 2 / 3,
    },
    viewDetailsInformation: {
        paddingLeft: 12,
    },

    inputStyle: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C0C0C0',
        width: Dimensions.get("screen").width * 2 / 3,
        // width: widthPercentageToDP('45%'),
        height: Dimensions.get("screen").height * 1 / 13,
        textAlign: 'center',
        borderColor: 'gray',
    },
    inputTextStyle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: RFValue(11, 420),
        color: 'black',
        textAlign: 'center',
    },
    viewCheckBox: {
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'flex-start'
    },
    checkBoxStyle: {
        borderWidth: 0,
        backgroundColor: 'transparent',
        alignSelf: 'flex-start',
        width: '31.6%'
    },
    textCheckBox: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFPercentage(2.2),
        color: '#1b1c1d'
    },
    datePicker: {
        paddingTop: '4%',
        width: Dimensions.get("screen").width * 2 / 3,
    },
    buttonProduction: {
        borderRadius: 8,
        width: Dimensions.get("screen").width * 2 / 3,
        elevation: 8,
        alignSelf: 'center',
        marginBottom: 5
    },
    titleButtonProduction: {
        color: '#fffafa',
        fontFamily: 'Montserrat-Bold',
        fontSize: RFPercentage(4),
    },

    /**EDICAO LIMITE */
    inputStyleMaskLimit: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(12, 470),
        paddingHorizontal: 10,
        marginRight: '6%',
        paddingVertical: 8,
        borderBottomWidth: 1,
        width: widthPercentageToDP('45%'),
        height: Dimensions.get("screen").height * 1 / 12,
        // width: Dimensions.get("screen").width * 2 / 3,
        //height: heightPercentageToDP('9%'),
        borderRadius: 8,
        color: 'black',
        textAlign: 'center'
    },
    viewTopLimit: {
        flexDirection: 'row',
        marginTop: '6%',
        borderBottomWidth: 1,
        marginRight: 12,
        marginLeft: 12
    },
    viewInputLimite: {
        // margin: 1,
        // marginRight: '4%',
        paddingBottom: 4,
        flexDirection: 'column',
        // borderWidth: 0.5,
        // borderRadius: 6,
        width: '30%',
        margin: '5%',
        marginLeft: '11%'
    },

    subtitleLimit: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 530),
        color: '#434e51',
        textAlign: 'center',
        marginTop: '4%',
        marginLeft: '15%'
    },


    /**CADASTRO CLIENTE */
    inputCadastro: {
        borderRadius: 12,
        color: 'black',
        fontFamily: 'Montserrat-Regular',
        textTransform: 'capitalize'
    },

    /**CONSULTA CLIENTE */
    titleReportClient: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 480),
        textAlign: 'left',
        color: 'black',
        textTransform: 'uppercase',
    },
    chevronStore: {
        padding: 11,
        backgroundColor: 'white',
        borderRadius: 45,
        width: 50,
        height: 50,
        elevation: 12
    },


    /**RELATORIO GERENCIAL */
    titleDateReportManagement: {
        color: 'white',
        fontFamily: 'Montserrat-Light',
        fontSize: RFPercentage(2.2),
    },

    subtitleItensReportManagement: {
        color: '#414c4e',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: RFPercentage(1.3),
    },
    subtitleReportManagement: {
        color: '#414c4e',
        fontFamily: 'Montserrat-Regular',
        fontSize: RFPercentage(1.8),
    },
    titleListManagement: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFPercentage(2.4),
        color: '#1C1C1C',
        textAlign: 'left',
    },


    /**FUNCOES DE PRODUCAO */
    viewMainFunction: {
        flex: 1,
        backgroundColor: 'white'
    },
    viewSecondaryFunction: {
        flex: 4,
        justifyContent: 'center',
        marginLeft: 15,
        marginRight: 15,
        marginTop: 15,
        marginBottom: 15,
        backgroundColor: '#fffafa',
        borderRadius: 6,
        elevation: 8
    },
    viewStep: {
        flex: 1,
        justifyContent: 'flex-start',
        marginTop: 12
    },
    viewListItem: {
        flex: 1,
        // justifyContent:'space-around',
        // alignItems:'center',
        marginTop: 12,
        marginHorizontal: 12
    },

    titleListItemClient: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 480),
        textAlign: 'left',
        color: 'black',
        textTransform: 'uppercase',
    },
    subtitleListItem: {
        color: 'white',
        fontFamily: 'Montserrat-Regular',
        fontSize: RFPercentage(2.1),
    },
    subtitleDetailVenda: {
        textTransform: 'uppercase',
        fontFamily: 'Roboto-Bold',
        fontSize: RFPercentage(2.0),
        color: '#000000'
    },


    /**FINALIZAR PRODUCAO*/
    viewActionSheet: {
        height: heightPercentageToDP('76%'),
        marginTop: 20
    },
    viewSecondaryActionSheet: {
        flex: 5,
        alignItems: 'center',
        marginLeft: 6,
        marginRight: 6,
        marginTop: 6,
        marginBottom: 5,
        backgroundColor: '#fffafa',
        borderRadius: 6,
        elevation: 8,
        padding: 12
    },
    titleActionSheet: {
        fontSize: 14,
        fontFamily: 'Montserrat-ExtraBold',
    },
    subtTitleACtionSheet: {
        fontSize: 12,
        fontFamily: 'Montserrat-Regular'
    },


    /**RECEBIMENTO */
    /*  viewDetail: {
         padding: 16,
         alignSelf:'flex-start',
         //justifyContent:'flex-start',
         //flex:1
     }, */
    inputStyleMask: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(12, 470),
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        width: widthPercentageToDP('45%'),
        height: Dimensions.get("screen").height * 1 / 12,
        // width: Dimensions.get("screen").width * 2 / 3,
        //height: heightPercentageToDP('9%'),
        borderRadius: 8,
        color: 'black',
        textAlign: 'center'
    },
    viewDetailWeigth: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },


    /** */
    viewInput: {
        flexDirection: 'row',
        padding: 6,
        justifyContent: 'space-around',
        alignItems: 'flex-start'
    },
    inputStyleMaskLaunch: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(12, 470),
        //width: widthPercentageToDP('21%'),
        height: Dimensions.get("screen").height * 1 / 14,
        width: Dimensions.get("screen").width * 2 / 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'gray',
        // borderColor: this.state.peso <= 0 | isNaN(this.state.peso) ? 'gray' : '#048b79',
        borderRadius: 8,
        color: 'black',
        // paddingRight: 30,
        textAlign: 'center'
    },
    viewButtonsHorizontal: {
        //flex:1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 12
    },
    buttonHorizontal: {
        borderRadius: 200,
        // elevation: 8,
        alignSelf: 'center',
        margin: 10,
        backgroundColor: 'white',
    },
    subtitleButtonHorizontal: {
        fontSize: RFPercentage(1.9),
        color: 'black',
        fontFamily: 'Montserrat-Regular',
        textAlign: 'center'
    },
    viewBorderWidth: {
        borderWidth: 0.5,
        borderColor: 'gray'
    },
    accordionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // alignSelf:'flex-start',
        // borderBottomWidth: 0.9,
        width: Dimensions.get("screen").width * 2 / 2.2,
        // height: 86,
        // paddingLeft: 18,
        //paddingRight: 18,
        // alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        margin: 2,
        //elevation: 7,
    },
    accordionParentHr: {
        // height: 1,
        color: 'white',
        width: '100%',

    },
    accordionChild: {
        backgroundColor: '#f7f8f8',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 8,
        borderRadius: 5,
        elevation: 0,
        width: Dimensions.get("screen").width * 2 / 2,
    },

    viewSpinner: {
        flexDirection: 'row',
        borderWidth: 0,
        borderRadius: 7,
        borderColor: '#16273f',
        margin: 2,
    },
    textSpinner: {
        fontFamily: 'Montserrat-Bold',
        textAlign: 'center',
        margin: 5,
        color: 'green'
    },

    viewButton: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    button: {
        borderRadius: 8,
        width: Dimensions.get("screen").width * 2 / 6,
        height: Dimensions.get("screen").height * 1 / 13,
        elevation: 8,
        alignSelf: 'center',
        marginBottom: 10
    },

    /**STORE */
    viewMain: {
        flex: 1,
        alignItems: "center",
        //marginTop: 4,
        marginBottom: 4
    },
    viewSearch: {
        flex: 1,
        padding: 20,
        marginTop: 48
    },
    searchContainer: {
        width: "100%",
        flexDirection: "row",
        alignSelf: 'center',
        borderRadius: 10,
        elevation: 12
    },


    viewItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        // padding:24,

    },

    viewQtdDesc: {
        alignSelf: 'flex-end',
        margin: 2,
        backgroundColor: '#fffafa',
        borderRadius: 8,
        elevation: 8,
        padding: 8
    },
    titleQtd: {
        fontFamily: 'Montserrat-SemiBold',
        color: '#16273f',
        margin: 5,
        fontSize: RFPercentage(2.8),
        textAlign: 'center'
    },
    titleDecre: {
        fontSize: RFPercentage(2.2),
        color: 'red',
        paddingBottom: 3,
        fontFamily: 'Roboto-Medium',
    },
    titleIncre: {
        fontSize: RFPercentage(2.2),
        color: 'green',
        paddingBottom: 3,
        fontFamily: 'Roboto-Medium',
    },
    titlePrice: {
        fontSize: RFPercentage(2.4),
        color: 'blue',
        fontFamily: 'Montserrat-SemiBold',
        // borderBottomWidth: 0.5,
        textAlign: 'center',
        width: Dimensions.get("screen").width * 2 / 8,
    },

    titleButton: {
        color: '#fffafa',
        fontFamily: 'Montserrat-Bold',
        fontSize: RFPercentage(3),
    },

    viewQtd: {
        alignSelf: 'flex-end',
        margin: 5,
        marginLeft: 3,
        marginRight: 3,
        marginTop: 3,
        backgroundColor: '#fffafa',
        borderRadius: 8,
        elevation: 8,
        padding: 7
    },
    viewHorizontal: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 6
    },
    viewSemConexao: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    titleConexao: {
        color: 'black',
        textAlign: 'center',
        fontSize: RFPercentage(2.9),
        fontFamily: 'Montserrat-Regular',
        marginTop: 15
    },
    buttonConexao: {
        borderRadius: 44,
        width: Dimensions.get("screen").width * 2 / 3,
        elevation: 8,
        alignSelf: 'center',
        backgroundColor: '#003443',
        marginTop: 15
    },
    viewHeaderShimmer: {
        marginTop: 6,
        width: '95%',
        height: 200,
        marginRight: 12,
        marginLeft: 12,
        borderRadius: 7
    },
    viewAddcart: {
        top: Dimensions.get('window').height * (Platform.OS === 'ios' ? .7 : .8),
        backgroundColor: 'transparent',
        position: 'absolute',
        borderColor: '#06686c',
        paddingRight: 15,
        justifyContent: 'flex-end', alignSelf: 'flex-end'
    },
    inputContainer: {
        width: Dimensions.get("screen").width * 2 / 7,
        borderWidth: 0.4,
        borderRadius: 4
    },



    /**CART */
    buttonCart: {
        borderRadius: 8,
        width: Dimensions.get("screen").width * 2 / 3,
        //elevation: 8,
        alignSelf: 'center',
        marginBottom: 15,
    },
    titleButtonCart: {
        color: '#fffafa',
        fontFamily: 'Montserrat-Bold',
        fontSize: RFPercentage(3.6),
    },
    viewCartMain: {
        flex: 1,
        backgroundColor: '#003443'
    },
    viewCartTopo: {
        height: "5%",
    },
    viewContainer: {
        backgroundColor: "#ffff",
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.32,
        shadowRadius: 5.46,
    },
    viewBox: {
        width: "100%",
        flexDirection: "row",
        padding: 15
    },

    titleSubtotal: {
        color: '#040739',
        fontFamily: 'Montserrat-Regular',
        fontSize: RFPercentage(4),
    },
    titleCesta: {
        color: "#2c322a",
        fontSize: RFPercentage(3),
        fontFamily: 'Montserrat-SemiBold',
    },
    titleEsvaziar: {
        color: "#828282",
        fontSize: 18,
        fontFamily: 'Montserrat-SemiBold',
        textDecorationLine: 'underline',

    },
    viewNenhum: {
        padding: 50,
        alignItems: "center",
        justifyContent: "center"
    },

    boxEsvaziar: {
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f5f5f5",
    },



    /**SYNC */
    viewButtonSync: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        margin: 12
    },
    scrollStatus: {
        flex: 6,
        marginRight: 12,
        marginLeft: 12,
    },

    titleSync: {
        color: "black",
        fontSize: RFPercentage(2.8),
        fontFamily: 'Montserrat-Light',
        marginTop: '6%'
    },

    /**CHECKOUT */
    titleCheckout: {
        margin: 2,
        //  borderBottomWidth: 0.9,
        // borderBottomColor: '#040739',
        fontSize: RFPercentage(2.4),
        fontFamily: 'Montserrat-SemiBold',
        textTransform: 'uppercase',
        color: '#040739'
    },
    inputParcelamento: {
        color: '#16273f',
        borderWidth: 0.5,
        borderColor: '#040739',
        height: Dimensions.get("screen").height * 1 / 24,
        borderRadius: 5,
        textAlign: 'center',
        width: Dimensions.get("screen").width * 2 / 7,
        marginLeft: 3,
        fontSize: RFValue(12, 470),
    },
    inputObs: {
        height: '45%',
        borderColor: '#040739',
        borderRadius: 3,
        width: '96%',
        paddingBottom: 7
    },
    date: {
        backgroundColor: 'white',
        borderRadius: 8,
        color: '#16273f',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginHorizontal: 8,
        marginVertical: 8,
        borderWidth: 0.5,
        height: Dimensions.get("screen").height * 1 / 18,
        width: Dimensions.get("screen").width * 2 / 3,
        fontSize: RFValue(12, 470),
    },

    /**COBRANCA */
    titleTotalCollect: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 410),
        textAlign: 'left',
        color: '#fffafa',
        textTransform: 'capitalize',
        borderBottomColor: 'white',
        marginLeft: '8%'
    },
    subTitleCollect: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 480),
        textAlign: 'left',
        textTransform: 'capitalize',
    },
    titleListCollect: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFPercentage(2.4),
        color: '#1C1C1C',
        textAlign: 'left',
        borderBottomWidth: 0.5
    },

    /**DESEMPENHO */
    viewDatePerformance: {
        flexDirection: 'row',
        marginTop: '7%',
        justifyContent: 'center'
    },
    datePerformance: {
        backgroundColor: 'white',
        borderRadius: 3,
        color: '#16273f',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginHorizontal: 8,
        marginVertical: 8,
        height: Dimensions.get("screen").height * 1 / 16,
        width: Dimensions.get("screen").width * 2 / 7,
        fontSize: RFValue(12, 470),
    },
    titlePerformance: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 410),
        textAlign: 'left',
        // color: '#fffafa',
        //textTransform: 'capitalize',
        //borderBottomColor: 'white',
        // marginLeft: '8%'
    },
    subTitlePerformance: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 480),
        textAlign: 'left',
        textTransform: 'capitalize',
    },
    titleListPerformance: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFPercentage(2.4),
        color: '#1C1C1C',
        textAlign: 'left',
        //borderBottomWidth: 0.5
    },

    /**ORDER */
    titleTotal: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 410),
        textAlign: 'center',
        color: '#fffafa',
        textTransform: 'capitalize',
        borderBottomWidth: 0.5,
        borderBottomColor: 'white',
        lineHeight: 28,
        //paddingRight:34,
        marginRight: '8%',
        marginLeft: '8%'
    },
    viewDate: {
        // flex:1,
        flexDirection: 'row',
        marginTop: '14%',
        //margin: 12,
        justifyContent: 'center'
    },
    titleListItem: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 430),
        textAlign: 'left',
        color: 'black',
        textTransform: 'capitalize',
    },
    subTitlePedFinalizado: {
        color: '#008c06',
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 480),
        textAlign: 'left',
        textTransform: 'capitalize',

    },
    subTitlePedCancelado: {
        color: '#FF6347',
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 480),
        textAlign: 'left',
        textTransform: 'capitalize',
    },
    subTitlePedBloqueado: {
        color: '#D2691E',
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 480),
        textAlign: 'left',
        textTransform: 'capitalize',
    },
    subTitlePedAnalise: {
        color: '#008080',
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 480),
        textAlign: 'left',
        textTransform: 'capitalize',
    },

    /**DETAIL ORDER */
    subtitleItens: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(11, 530),
        textAlign: 'left',
        color: '#434e51',
    },
    viewDetail: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 22,
        margin: 5
    },
    viewDetailReport: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 2,
        margin: 3
    },
    titleDetail: {
        fontSize: RFValue(12, 450),
        borderBottomWidth: 0.5,
        color: '#16273f',
        marginRight: 12,
        marginLeft: 12,
        textTransform: 'capitalize',
        fontFamily: 'Montserrat-Regular',
    },
    titleDetailReport: {
        fontSize: RFValue(12, 520),
        margin: 2,
        //padding: 2,
        textTransform: 'capitalize',
        fontFamily: 'Montserrat-Regular',
    },


    



    /**TEMPERATURA */
    inputTextTemperature: {
        fontFamily: 'Montserrat-Regular',
        fontSize: RFValue(12, 570),
        textAlign: 'left'
    },
    inputStyleMaskAbsorption: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: RFValue(12, 610),
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        height: Dimensions.get("screen").height * 1 / 19,
        width: Dimensions.get("screen").width * 2 / 5,
        borderRadius: 6,
        color: 'black',
        textAlign: 'center',
    },
    viewSecondaryTemperature: {
        flex: 5,
        marginLeft: 7,
        marginRight: 7,
        marginTop: 10,
        marginBottom: 5,
        backgroundColor: '#fffafa',
        borderRadius: 6,
        elevation: 8,
    },

    viewWaste: {
        marginTop: '10%',
        alignItems: 'flex-end'
    }
    /**PROCESSAMENTO DE CARNE */
});

export default styleGlobal;