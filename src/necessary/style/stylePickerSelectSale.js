import { StyleSheet, Dimensions, PixelRatio } from "react-native";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

const widthPercentageToDP = widthPercent => {
    const screenWidth = Dimensions.get('window').width;
    return PixelRatio.roundToNearestPixel(screenWidth * parseFloat(widthPercent) / 100);
};

const heightPercentageToDP = heightPercent => {
    const screenHeight = Dimensions.get('window').height;
    return PixelRatio.roundToNearestPixel(screenHeight * parseFloat(heightPercent) / 100);
};


const pickerSelectStylesCloseSale = StyleSheet.create({
    inputIOS: {
        fontFamily: 'FiraSans-Regular',
        fontSize: RFValue(12, 570),
        textTransform: 'capitalize',
        borderRadius: 7,
        borderWidth: 0.5,
        paddingVertical:13,
        borderColor: 'gray',
        fontFamily: 'Montserrat-Regular',
        // width: widthPercentageToDP('45%'),
        //width: Dimensions.get("screen").width * 2 / 2.4,
        //height: Dimensions.get("screen").height * 1 / 16,
        textAlign: 'center',
        color: 'black',
        backgroundColor: 'white'
    },
    inputAndroid: {
        fontFamily: 'FiraSans-Regular',
        fontSize: RFValue(12, 570),
        textTransform: 'capitalize',
        paddingVertical:14,
        elevation: 4,
        borderRadius: 7,
        borderWidth: 0.5,
        borderColor: 'gray',
        fontFamily: 'Montserrat-Regular',
        // width: widthPercentageToDP('45%'),
      //width: Dimensions.get("screen").width * 2 / 2.4,
        //height: Dimensions.get("screen").height * 1 / 16,
        textAlign: 'center',
        color: 'black',
        backgroundColor: 'white'
    },
});

export default pickerSelectStylesCloseSale;