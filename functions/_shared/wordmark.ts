// supabase/functions/_shared/wordmark.ts
//
// GENERATED FILE -- DO NOT EDIT BY HAND.
// Source: the Certidemy wordmark, dark-on-light variant, trimmed to its ink.
//
// WHY INLINE
//   Same reasoning as badges.ts: Deno at the edge cannot read the web repo's
//   public/ directory, and this project has twice paid for render-time external
//   dependencies on exactly these functions. ~29 kB of bundle buys that failure
//   mode going away.
//
// WHY A RASTER
//   pdf-lib embeds PNG and JPG only -- there is no SVG path. The frame and the
//   signature are vector (see cert-art.ts); the wordmark and the badges are the
//   only two rasters on the certificate.
//
// GEOMETRY
//   989 x 178 px, trimmed to the ink with no transparent margin, so the drawn
//   rectangle IS the visible mark -- no offset arithmetic at the call site.
//   Native resolution, never upscaled. At the certificate's 193pt width this
//   renders at ~369 dpi.

/** Aspect ratio, width / height. Multiply a target height by this for width. */
export const WORDMARK_ASPECT = 989 / 178;

/** Base64 PNG, dark wordmark with the magenta mark, on transparency. */
export const WORDMARK_B64 =
  "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" +
  "BO6n/JYfTVt+1A8N+mttn5aA0zoisUwpYdPvqqF6LZoRIxjHKPeBmMoP6lXVDcUNjq1tp9HUXUI319aPWYbkqzBbpYp9t75l" +
  "zqvBrkBLbR+h7h74ewfVzdihe2cFX7heV3Gnld9LajX9aND0o6XlgX/bj5Y/ym4otEKox/M1Ih57RvGa6qs8azA8bLzK4joE" +
  "GcuLZUvnucIx4nbCqFf5lneifB+n22ZV0rbzUjYjZ1fUtlo6OeyGEXLLx0STCpZfV8ZrdtWkXo2PCN39I4/xGy8+CsEtw4bq" +
  "kFHuWF/WSlLS9KNx7G/px1mYH/yF643FglLP1Yl14FOmI6E0nfQHZY8HTCUtD/0uw/T3Vnh1Cujo9p1zQ8O1BAYlqQKPyu4M" +
  "7zPd8vvLIzv5DeN2NXbAWFbslC6607RSvJlI1nXnuW1nI+fyfghlO1V243l6SHsU2s6Gsueii2g7b51zgxI/J5r3TYqytYGW" +
  "WeHUa2H6jH9rtQjpjXOuVbHnmS37EXXaJmy8pV5cbk4xDzNyn6r7D+ERhsNDt2xXe9x5YVm4XhLppH2U1D1gtXRT/9iPpr90" +
  "vU6ogCwsVS48AlDeRnube0npc6YtfRzON7Z46OZ0jl4quyP67PKKsPDJoW3peN1ht3pGPRync8Rn70j6yupDee87nMLfKdu8" +
  "rlcrZTfPJusgGHtxS+u6Y6Cv+NPKH0I/5OQtfDbazvFGWXY32s88psYPVK6RxLmkfhFTacvcBob31g5teienuvHks7YHfvY0" +
  "LMh2WdN6uuu76hrnrtpsE+a9Xzrn7rdcD7sbbWF/yyEOuvlwETF0pwdU1Bgd9U7egXvtJ360vPajrmy3JjgnrUjHnVK0Zo12" +
  "I3L4u5P0Q+9917pz471feu9T731X0g+Vz2MhfaPj5HVRnyvb1eEH3vu2937gvR9HXBQOxYfA2B4kfea9b4Tzeui9n5zpbhJJ" +
  "5HJ+6b3vhHbOtHxDO5Do20fqYt/Mvg03G8tgJalbg2dXY4SVSTinu/p2raN5yc+loeH76FZo+zDr9n5Ys+q87fzuHpCTD2ob" +
  "Pg7dVlOI7nY9Qx1plPu+6Udd62e3T/GJHyUE71KF7iVFW/pO+ip0GJM8pmp572fe+0EI3/cRf9Sl0WIrsUP3StJr730rdKA4" +
  "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" +
  "gWGXBQAAAABJRU5ErkJggg==";

/** Bytes for pdf-lib's embedPng. */
export function wordmarkBytes(): Uint8Array {
  const bin = atob(WORDMARK_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
