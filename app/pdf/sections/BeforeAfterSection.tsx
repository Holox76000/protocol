import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";
import { C, F, PAGE } from "../pdfTheme";

type Props = {
  photoFront:     string | null;  // original front photo data URI
  beforeAfterUri: string | null;  // AI-generated before/after preview data URI
};

export function BeforeAfterSection({ photoFront, beforeAfterUri }: Props) {
  if (!photoFront && !beforeAfterUri) return null;

  const photoHeight = 320;

  return (
    <View style={{ marginTop: 16 }}>
      {/* Label row */}
      <View style={{ flexDirection: "row", marginBottom: 6, gap: 8 }}>
        {photoFront && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 7, color: C.mute, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Before
            </Text>
          </View>
        )}
        {beforeAfterUri && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 7, color: C.mute, letterSpacing: 1.5, textTransform: "uppercase" }}>
              After
            </Text>
          </View>
        )}
      </View>

      {/* Image row */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {photoFront && (
          <View style={{ flex: 1, height: photoHeight, backgroundColor: C.ash, overflow: "hidden" }}>
            <Image
              src={photoFront}
              style={{ width: "100%", height: photoHeight, objectFit: "cover", objectPosition: "top center" }}
            />
          </View>
        )}
        {beforeAfterUri && (
          <View style={{ flex: 1, height: photoHeight, backgroundColor: C.ash, overflow: "hidden" }}>
            <Image
              src={beforeAfterUri}
              style={{ width: "100%", height: photoHeight, objectFit: "cover", objectPosition: "top center" }}
            />
          </View>
        )}
      </View>

      {/* Bottom rule */}
      <View style={{ height: 1, backgroundColor: C.wire, marginTop: 8 }} />
    </View>
  );
}
