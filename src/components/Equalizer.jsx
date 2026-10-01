// Petit égaliseur CSS (4 barres animées). Se fige si `playing` est faux.
export default function Equalizer({ playing = true }) {
  return (
    <span
      className={"equalizer" + (playing ? " is-active" : "")}
      aria-hidden="true"
    >
      <i></i>
      <i></i>
      <i></i>
      <i></i>
    </span>
  );
}
