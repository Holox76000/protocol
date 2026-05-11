declare namespace JSX {
  interface IntrinsicElements {
    "wistia-player": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      "media-id"?: string;
      aspect?: string;
      autoplay?: string;
      "silent-autoplay"?: string;
      "end-video-behavior"?: string;
      "player-color"?: string;
    };
  }
}
