
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  useWindowDimensions,
} from "react-native";

import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";

import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

import { wordsLearningActions } from "../store/wordsLearningSlice";
import { playSound } from "../services/soundHandler";

function WordCard({ wordInfo, nextWordInfo, setNext }) {
  const [showFullInfo, setShowFullInfo] = useState(false);

  const colors = useSelector((state) => state.theme.colors);
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();

  const styles = useMemo(
    () => getStyles(colors),
    [colors]
  );

  const translateX = useSharedValue(0);
  const flipRotation = useSharedValue(0);

  const threshold = width / 2.3;

  const flipCard = () => {
    if (showFullInfo) return;

    setShowFullInfo(true);

    flipRotation.value = withTiming(180, {
      duration: 500,
    });
  };

  const resetCard = () => {
    translateX.value = withSpring(0);
    flipRotation.value = withTiming(0, {
      duration: 250,
    });
    setShowFullInfo(false);
  };

  const skipWord = () => {
    resetCard();
    setNext();
  };

  const knowWord = () => {
    resetCard();

    dispatch(
      wordsLearningActions.updateWordLearnInfo(wordInfo.word)
    );
  };

  const finishSwipe = (direction) => {
    if (direction === "right") {
      knowWord();
    } else {
      skipWord();
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(true)
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) < threshold) {
        translateX.value = withSpring(0);
        return;
      }

      const direction =
        event.translationX > 0 ? "right" : "left";

      const destination =
        direction === "right"
          ? width * 1.5
          : -width * 1.5;

      translateX.value = withTiming(
        destination,
        { duration: 300 },
        (finished) => {
          if (finished) {
            runOnJS(finishSwipe)(direction);
          }
        }
      );
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const tilt = interpolate(
      translateX.value,
      [-width, 0, width],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${tilt}deg` },
      ],
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(
          flipRotation.value,
          [0, 180],
          [0, 180]
        )}deg`,
      },
    ],
    opacity: interpolate(
      flipRotation.value,
      [0, 90, 180],
      [1, 0, 0],
      Extrapolation.CLAMP
    ),
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(
          flipRotation.value,
          [0, 180],
          [180, 360]
        )}deg`,
      },
    ],
    opacity: interpolate(
      flipRotation.value,
      [0, 90, 180],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const leftTipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-threshold, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const rightTipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, threshold],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.abs(translateX.value) / threshold,
      1
    );

    return {
      transform: [
        { scale: 0.94 + progress * 0.06 },
        { translateY: 12 - progress * 12 },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[styles.nextCard, nextCardStyle]}
      >
        <Text style={styles.nextWord}>
          {nextWordInfo?.word || ""}
        </Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.card, cardAnimatedStyle]}
        >
          <Animated.View
            style={[
              styles.cardFace,
              frontAnimatedStyle,
            ]}
            pointerEvents={showFullInfo ? "none" : "auto"}
          >
            <Pressable
              style={styles.wordContainer}
              onPress={flipCard}
            >
              <Text style={styles.word}>
                {wordInfo.word}
              </Text>

              <Text style={styles.hint}>
                Натисни, щоб побачити пояснення
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[
              styles.cardFace,
              backAnimatedStyle,
            ]}
            pointerEvents={showFullInfo ? "auto" : "none"}
          >
            <View style={styles.wordContainer}>
              {wordInfo.image && (
                <Image
                  style={styles.image}
                  source={{ uri: wordInfo.image }}
                />
              )}

              <Text style={styles.word}>
                {wordInfo.word}
              </Text>

              {!!wordInfo.phonetics && (
                <Text style={styles.phonetics}>
                  {wordInfo.phonetics}
                </Text>
              )}

              {!!wordInfo.audio && (
                <Pressable
                  style={styles.playPressable}
                  onPress={() => playSound(wordInfo.audio)}
                >
                  <Ionicons
                    name="volume-medium-outline"
                    size={28}
                    color={colors.primary900}
                  />
                </Pressable>
              )}

              <Text style={styles.meaning}>
                {wordInfo.meaning || "No definition available"}
              </Text>

              <View style={styles.buttonsContainer}>
                <Pressable
                  onPress={skipWord}
                  style={[
                    styles.remember,
                    { backgroundColor: colors.secondary800 },
                  ]}
                >
                  <Text style={styles.rememberText}>
                    Didn't know it
                  </Text>
                </Pressable>

                <Pressable
                  onPress={knowWord}
                  style={[
                    styles.remember,
                    { backgroundColor: colors.primary900 },
                  ]}
                >
                  <Text style={styles.rememberText}>
                    Knew it
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <Animated.View
        pointerEvents="none"
        style={[styles.leftTip, leftTipStyle]}
      >
        <Text style={styles.tipText}>
          Didn't know it
        </Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.rightTip, rightTipStyle]}
      >
        <Text style={styles.tipText}>
          Knew it!
        </Text>
      </Animated.View>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingBottom: 20,
    },
    card: {
      flex: 1,
      margin: 10,
    },
    nextCard: {
      position: "absolute",
      top: 10,
      bottom: 30,
      left: 20,
      right: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary200,
      backgroundColor: colors.fontInverse,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
    nextWord: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.fontMain,
    },
    cardFace: {
      ...StyleSheet.absoluteFillObject,
      backfaceVisibility: "hidden",
      borderColor: colors.primary200,
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: colors.fontInverse,
      elevation: 4,
    },
    wordContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-evenly",
      padding: 15,
    },
    word: {
      fontSize: 28,
      color: colors.fontMain,
      fontWeight: "800",
      textAlign: "center",
    },
    hint: {
      fontSize: 16,
      color: colors.fontMain,
      opacity: 0.7,
      textAlign: "center",
    },
    phonetics: {
      fontSize: 18,
      color: colors.fontMain,
    },
    playPressable: {
      padding: 10,
    },
    meaning: {
      fontSize: 18,
      color: colors.fontMain,
      padding: 5,
      textAlign: "center",
    },
    buttonsContainer: {
      flexDirection: "row",
      width: "100%",
      minHeight: 60,
    },
    remember: {
      flex: 1,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
      margin: 5,
      padding: 5,
    },
    rememberText: {
      fontSize: 16,
      color: colors.fontInverse,
      textAlign: "center",
    },
    image: {
      width: 120,
      height: 120,
      resizeMode: "contain",
    },
    leftTip: {
      position: "absolute",
      top: 35,
      left: 30,
      zIndex: 3,
      backgroundColor: colors.secondary800,
      padding: 12,
      borderRadius: 8,
    },
    rightTip: {
      position: "absolute",
      top: 35,
      right: 30,
      zIndex: 3,
      backgroundColor: colors.primary900,
      padding: 12,
      borderRadius: 8,
    },
    tipText: {
      color: colors.fontInverse,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}

export default WordCard;
