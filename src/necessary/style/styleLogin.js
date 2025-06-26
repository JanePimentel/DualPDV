import { StyleSheet, Dimensions, PixelRatio} from "react-native";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

const largura = Dimensions.get("screen").width * 2 / 3;
const altura = Dimensions.get("screen").height * 1 / 13;
const { height: DEVICE_HEIGHT } = Dimensions.get('window');

const style = StyleSheet.create({
    /**Splash */
    viewMainSplash: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoSplash: {
        flex: 1,
        width: Dimensions.get("screen").width * 2 / 3.6,
        resizeMode: 'contain'
    },

    /**Splash Screen */
    logoSplashScreen: {
        flex: 1,
        width: '100%',
        resizeMode: 'contain'
    },

    /**Register */
    viewMainRegister: {
        flex: 1,
        justifyContent: "center",
    },
    viewButtonRegister: {
        justifyContent: "center",
        alignItems: "center",
    },
    viewRegister: {
       flex: 1,
        flexDirection: "row",
    },
    messageText: {
        color: 'black',
        fontFamily: 'FiraSans-Bold',
        fontSize: RFPercentage(3),
    },
    descritptionMessageText: {
        color: 'black',
        fontFamily: 'FiraSans-Regular',
        fontSize: RFPercentage(2.7),
        textAlign: 'center'
    },
    messageButtonTextStyle:{
        fontFamily: 'FiraSans-Regular',
         fontSize: RFPercentage(2)
    },

    /*Login  */
    viewMainLogin: {
        flex: 1,
        justifyContent: "center",
        alignItems: "stretch",
    },
    logoLogin: {
        flex: 2,
        width: Dimensions.get("screen").width * 2 / 2.1,
        alignSelf: "center",
        resizeMode: 'contain'
    },
    titleLogin: {
        flex: 1,
        textAlign: "center",
        textTransform:'uppercase',
        color: '#2b2b2b',
        fontSize: RFValue(14, 420),
    },
});

export default style;