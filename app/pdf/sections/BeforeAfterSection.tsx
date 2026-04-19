import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";
import { C, F, PAGE } from "../pdfTheme";

type Props = {
  photoFront:     string | null;
  beforeAfterUri: string | null;
};

// react-pdf flex+percentage widths are unreliable — use explicit pixel math.
const CONTENT_W = PAGE.width - 2 * PAGE.marginX; // 499.28 pt
const GAP       = 10;
const BOTH_W    = (CONTENT_W - GAP) / 2;         // ~244.64 pt each
const PHOTO_H   = 320;

export function BeforeAfterSection({ photoFront, beforeAfterUri }: Props) {
  if (!photoFront && !beforeAfterUri) return null;

  const bothPresent = !!(photoFront && beforeAfterUri);
  const wFront  = bothPresent ? BOTH_W : CONTENT_W;
  const wAfter  = bothPresent ? BOTH_W : CONTENT_W;

  return (
    <View style={{ marginTop: 16 }}>

      {/* Label row — same explicit widths as images */}
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {photoFront && (
          <View style={{ width: wFront }}>
            <Text style={{ fontFamily: F.mono, fontSize: 7, color: C.mute, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Before
            </Text>
          </View>
        )}
        {beforeAfterUri && (
          <View style={{ width: wAfter, marginLeft: photoFront ? GAP : 0 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 7, color: C.mute, letterSpacing: 1.5, textTransform: "uppercase" }}>
              After
            </Text>
          </View>
        )}
      </View>

      {/* Image row */}
      <View style={{ flexDirection: "row" }}>
        {photoFront && (
          <View style={{ width: wFront, height: PHOTO_H, backgroundColor: C.ash, overflow: "hidden" }}>
            <Image
              src={photoFront}
              style={{ width: wFront, height: PHOTO_H, objectFit: "cover", objectPosition: "top center" }}
            />
          </View>
        )}
        {beforeAfterUri && (
          <View style={{ width: wAfter, height: PHOTO_H, backgroundColor: C.ash, overflow: "hidden", marginLeft: photoFront ? GAP : 0 }}>
            <Image
              src={beforeAfterUri}
              style={{ width: wAfter, height: PHOTO_H, objectFit: "cover", objectPosition: "top center" }}
            />
          </View>
        )}
      </View>

      {/* Bottom rule */}
      <View style={{ width: CONTENT_W, height: 1, backgroundColor: C.wire, marginTop: 8 }} />
    </View>
  );
}
