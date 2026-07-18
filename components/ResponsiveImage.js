// components/ResponsiveImage.js
import React from "react";
import { Image, Dimensions, StyleSheet } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function ResponsiveImage({
  source,
  ratio = 0.6,
  widthPercent = 0.9,
  padding = 30, // <-- adjust if your card has more/less padding
  resizeMode = "cover",
  style,
}) {
  // subtract horizontal padding from screen width
  const imageWidth = screenWidth * widthPercent - padding;
  const imageHeight = imageWidth * ratio;

  return (
    <Image
      source={source}
      style={[
        styles.image,
        { width: imageWidth, height: imageHeight },
        style,
      ]}
      resizeMode={resizeMode}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
    borderRadius: 10,
  },
});
