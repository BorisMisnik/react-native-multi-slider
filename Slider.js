'use strict';

var React = require('react');
var ReactNative = require('react-native');
var PropTypes = require('prop-types');

var {
  StyleSheet,
  PanResponder,
  View,
  TouchableHighlight,
  ViewPropTypes
} = ReactNative;

var converter = require('./converter.js');
var mockProps = require('./mockProps.js');

var sliderProps = {
  values: PropTypes.arrayOf(PropTypes.number),

  onValuesChangeStart: PropTypes.func,
  onValuesChange: PropTypes.func,
  onValuesChangeFinish: PropTypes.func,

  sliderLength: PropTypes.number,
  sliderOrientation: PropTypes.string,
  touchDimensions: PropTypes.object,

  customMarker: PropTypes.func,

  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,

  optionsArray: PropTypes.array,

  containerStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
  trackStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
  selectedStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
  unselectedStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
  markerStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
  pressedMarkerStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style
};

class Slider extends React.Component {
  constructor(props) {

    super(props);
    this.optionsArray = this.props.optionsArray || converter.createArray(this.props.min,this.props.max,this.props.step);
    this.stepLength = this.props.sliderLength/this.optionsArray.length;

    var initialValues = this.props.values.map(value => converter.valueToPosition(value,this.optionsArray,this.props.sliderLength));

    this.state = {
      pressedOne: true,
      valueOne: this.props.values[0],
      valueTwo: this.props.values[1],
      pastOne: initialValues[0],
      pastTwo: initialValues[1],
      positionOne: initialValues[0],
      positionTwo: initialValues[1]
    };

    this.startTwo = this.startTwo.bind(this);
    this.startOne = this.startOne.bind(this);
    this.moveOne = this.moveOne.bind(this);
    this.moveTwo = this.moveTwo.bind(this);
    this.endOne = this.endOne.bind(this);
    this.endTwo = this.endTwo.bind(this);
  }

  componentWillMount() {
    var customPanResponder = function (start,move,end) {
      return PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => true,
        onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => true,
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
        onPanResponderGrant: (evt, gestureState) => start(),
        onPanResponderMove: (evt, gestureState) => move(gestureState),
        onPanResponderTerminationRequest: (evt, gestureState) => false,
        onPanResponderRelease: (evt, gestureState) => end(gestureState),
        onPanResponderTerminate: (evt, gestureState) => end(gestureState),
        onShouldBlockNativeResponder: (evt, gestureState) => true
      })
    };

    this._panResponderOne = customPanResponder(this.startOne, this.moveOne, this.endOne);
    this._panResponderTwo = customPanResponder(this.startTwo, this.moveTwo, this.endTwo);

  }

  componentWillReceiveProps(nextProps) {
    var { values } = this.props;
    if (nextProps.values.join() !== values.join()) {
      this.set(nextProps);
    }
  }

  set(config) {
    var { max, min, optionsArray, step, values } = config || this.props;
    this.optionsArray = optionsArray || converter.createArray(min, max, step);
    this.stepLength = this.props.sliderLength/this.optionsArray.length;

    var initialValues = values.map(value => converter.valueToPosition(value,this.optionsArray,this.props.sliderLength));

    this.setState({
      pressedOne: true,
      valueOne: values[0],
      valueTwo: values[1],
      pastOne: initialValues[0],
      pastTwo: initialValues[1],
      positionOne: initialValues[0],
      positionTwo: initialValues[1]
    });
  }

  startOne () {
    this.props.onValuesChangeStart();
    this.setState({
      onePressed: !this.state.onePressed
    });
  }

  startTwo () {
    this.props.onValuesChangeStart();
    this.setState({
      twoPressed: !this.state.twoPressed
    });
  }

  moveOne(gestureState) {
    var unconfined = gestureState.dx + this.state.pastOne;
    var bottom     = 0;
    var top        = (this.state.positionTwo - this.stepLength) || this.props.sliderLength;
    var confined   = unconfined < bottom ? bottom : (unconfined > top ? top : unconfined);
    var value      = converter.positionToValue(this.state.positionOne, this.optionsArray, this.props.sliderLength);

    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (Math.abs(gestureState.dy) < slipDisplacement || !slipDisplacement) {
      this.setState({
        positionOne: confined
      });
    }
    if ( value !== this.state.valueOne ) {
      this.setState({
        valueOne: value
      }, function () {
        var change = [this.state.valueOne];
        if (this.state.valueTwo) {
          change.push(this.state.valueTwo);
        }
        this.props.onValuesChange(change);
      });
    }
  }

  moveTwo(gestureState) {
    var unconfined  = gestureState.dx + this.state.pastTwo;
    var bottom      = this.state.positionOne + this.stepLength;
    var top         = this.props.sliderLength;
    var confined    = unconfined < bottom ? bottom : (unconfined > top ? top : unconfined);
    var value       = converter.positionToValue(this.state.positionTwo, this.optionsArray, this.props.sliderLength);
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (Math.abs(gestureState.dy) < slipDisplacement || !slipDisplacement) {
      this.setState({
        positionTwo: confined
      });
    }
    if ( value !== this.state.valueTwo ) {
      this.setState({
        valueTwo: value
      }, function () {
        this.props.onValuesChange([this.state.valueOne,this.state.valueTwo]);
      });
    }
  }

  endOne(gestureState) {
    this.setState({
      pastOne: this.state.positionOne,
      onePressed: !this.state.onePressed
    }, function () {
      var change = [this.state.valueOne];
      if (this.state.valueTwo) {
        change.push(this.state.valueTwo);
      }
      this.props.onValuesChangeFinish(change);
    });
  }

  endTwo(gestureState) {
    this.setState({
      twoPressed: !this.state.twoPressed,
      pastTwo: this.state.positionTwo,
    }, function () {
      this.props.onValuesChangeFinish([this.state.valueOne,this.state.valueTwo]);
    });
  }

  render() {
    var {positionOne, positionTwo} = this.state;
    var {selectedStyle, unselectedStyle, sliderLength} = this.props;
    var twoMarkers = positionTwo;

    var fixedPositionOne = Math.floor(positionOne / this.stepLength) * this.stepLength;
    var fixedPositionTwo = Math.floor(positionTwo / this.stepLength) * this.stepLength;

    var trackOneLength = fixedPositionOne;
    var trackOneStyle = twoMarkers ? unselectedStyle : selectedStyle;
    var trackThreeLength = twoMarkers ? sliderLength - (fixedPositionTwo) : 0;
    var trackThreeStyle = unselectedStyle;
    var trackTwoLength = sliderLength - trackOneLength - trackThreeLength;
    var trackTwoStyle = twoMarkers ? selectedStyle : unselectedStyle;
    var Marker = this.props.customMarker;
    var {top, slipDisplacement, height, width, borderRadius} = this.props.touchDimensions;
    var touchStyle = {
      top: top || -10,
      height: height,
      width: width,
      borderRadius: borderRadius || 0
    };
    return (
      <View style={[styles.container, this.props.containerStyle]}>
        <View style={[styles.fullTrack, { width: sliderLength }]}>
          <View style={[this.props.trackStyle, styles.track, trackOneStyle, { width: trackOneLength }]} />
          <View style={[this.props.trackStyle, styles.track, trackTwoStyle, { width: trackTwoLength }]} />
          { twoMarkers && (
            <View style={[this.props.trackStyle, styles.track, trackThreeStyle, { width: trackThreeLength }]} />
          ) }


          <View
            style={[styles.touch, touchStyle, {left: -(trackTwoLength + trackThreeLength + width / 2)}]}
            ref={component => this._markerOne = component}
            {...this._panResponderOne.panHandlers}
            >
            <Marker
              pressed={this.state.onePressed}
              value={this.state.valueOne}
              markerStyle={this.props.markerStyle}
              pressedMarkerStyle={this.props.pressedMarkerStyle}
              />
          </View>

          { twoMarkers && (positionOne !== this.props.sliderLength) && (
            <View
              style={[styles.touch, touchStyle, {left: -(trackThreeLength + width * 1.5)}]}
              ref={component => this._markerTwo = component}
              {...this._panResponderTwo.panHandlers}
              >
              <Marker
                pressed={this.state.twoPressed}
                value={this.state.valueOne}
                markerStyle={this.props.markerStyle}
                pressedMarkerStyle={this.props.pressedMarkerStyle}
                />
            </View>
          ) }

        </View>
      </View>
    );
  }
};

Slider.propTypes = sliderProps
Slider.defaultProps = mockProps;
export default Slider;


var styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  fullTrack: {
    flexDirection: 'row',
  },
  track: {
    justifyContent: 'center'
  },
  touch: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  }
});
