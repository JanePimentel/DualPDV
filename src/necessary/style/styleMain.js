import { StyleSheet, Dimensions, PixelRatio } from "react-native";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

const largura = Dimensions.get("screen").width * 2 / 3;
const altura = Dimensions.get("screen").height * 1 / 13;
const { height: DEVICE_HEIGHT } = Dimensions.get('window');


const widthPercentageToDP = widthPercent => {
    const screenWidth = Dimensions.get('window').width;
    return PixelRatio.roundToNearestPixel(screenWidth * parseFloat(widthPercent) / 100);
};

const heightPercentageToDP = heightPercent => {
    const screenHeight = Dimensions.get('window').height;
    return PixelRatio.roundToNearestPixel(screenHeight * parseFloat(heightPercent) / 100);
};

const styleMain = StyleSheet.create({

    viewMain: {
        flex: 1,
    },
    viewHeader: {
        height: Dimensions.get('window').height / 8.2,
        backgroundColor: 'transparent',
        justifyContent: 'center'
    },
    viewDetailHorizontal: {
        flexDirection: 'row',
         margin: 3,
        justifyContent: 'space-around',
    },
    titleHeader: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: RFPercentage(3.4),
        fontFamily: 'FiraSans-Bold'
    },
    textUserHeader: {
        fontSize: RFPercentage(2.7),
        textAlign: 'center',
       // color: 'white',
       // fontFamily: 'Roboto-Thin'
    },
    buttonMain: {
        alignItems: 'center',
        backgroundColor: '#fffafa',
        width: 90,
        height:90,
        borderRadius: 50,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 7
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.44,
        elevation: 3,  
    },
    buttonMain_II: {
        alignItems: 'center',
        backgroundColor: '#fffafa',
        width: Dimensions.get("screen").width * 1 / 3,
        height: Dimensions.get("screen").width * 2 / 7,
        //  margin: 5,
        borderRadius: 8,
        //padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 7
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.44,
        elevation: 3,
    },

    

    viewButtonMain: {
        flexDirection: "row",
        //flexWrap:'wrap',
        justifyContent: 'space-around',
        alignItems: 'center',
        flex: 3,
        marginTop: '32%'
    },

    viewDetailHeader: {
        width: Dimensions.get("screen").width * 2 / 2,
        height: Dimensions.get("screen").height * 1 / 5,
        top: Dimensions.get('window').height / 3 - 85,
        justifyContent: 'center',
        backgroundColor: '#fffafa',
        position: 'absolute',
        alignSelf: 'center',
        elevation: 3,
        borderRadius: 8,
        borderColor: '#06686c'
    },
    viewOverlay: {
        height: Dimensions.get("screen").height * 2 / 4
    },
    textOverlay: {
        color: 'black',
        fontFamily: 'FiraSans-Bold',
        textAlign: 'center'
    },
    titleButtonOverlay: {
        color: '#fffafa',
        fontFamily: 'FiraSans-Bold',
        fontSize: RFPercentage(2.6),
    },
    buttonOverlay: {
        borderRadius: 8,
        width: Dimensions.get("screen").width * 2 / 6,
        height: Dimensions.get("screen").height * 1 / 14,
        elevation: 8,
        alignSelf: 'center',
        marginBottom: 5,
        marginTop: 16,
    },
    textUserHeader: {
        fontSize: RFPercentage(2),
        alignSelf: 'center',
        color: 'white',
        fontFamily: 'FiraSans-SemiBold'
    },
    textDetailHeader: {
        fontSize: RFValue(12, 590),
        color: 'black',
        textAlign: 'center',
        padding: 12,
        fontFamily: 'FiraSans-SemiBold'
    },
    textDetailHeaderDate: {
        fontFamily: 'FiraSans-Regular',
        fontSize: RFValue(11, 520),
        color: 'black',
        textAlign: 'center',
    },


    titleButtonMain: {
        fontSize: RFPercentage(2),
        color: 'black',
        fontFamily: 'FiraSans-ExtraBold',
    },
    viewFooter: {
        //flex:1,
        // backgroundColor: "white",
        borderRadius: 9,
        margin: 11,
        justifyContent: "center",
        borderColor: 'gray',
        borderWidth: 0.5,
        height: Dimensions.get("screen").height * 1 / 9,
    },
    textFooterHeader: {
        fontFamily: 'FiraSans-SemiBold',
        fontSize: RFValue(11, 700),
        color: '#1e1e46',
        paddingLeft: 20
    },
    textFooterDetails: {
        fontFamily: 'FiraSans-Regular',
        fontSize: RFValue(11, 700),
        color: '#1e1e46',
        paddingLeft: 20
    }
});

export default styleMain;