# Rotodex

A talking, camera-powered Pokémon explorer built by a dad for his kid. Scan English Pokémon cards, discover evolution families, collect discoveries, create a Trainer ID, and play “Who’s that Pokémon?”—with free on-device recognition and prerecorded narration.

## Run locally

Run `python -m http.server 8000 --directory dist` from this repository, then open http://localhost:8000. Camera access requires localhost or HTTPS. No npm build or API key is required.

## Public edition

This is the v0.8 source backup. Family names, portraits, hosting identity, and three personalized recordings are excluded. This edition uses a generic trainer placeholder. Welcome, correct-answer, and Trainer ID narration stay silent until their generic clips are regenerated with the included Kokoro scripts. All 1,025 Pokémon narrations are included.


Buildless static web app with Explore, Trainer ID, and Who’s that Pokémon? apps. Serve `dist/` with any static HTTPS host.

## Child-facing behavior

Start Rotom once to open the rear camera. English card-name OCR runs automatically; recent sharp frames, perspective correction, orientation retries and a wider-frame fallback handle motion and partially visible cards. The wider fallback also recovers when a rectangular artwork border was mistaken for the whole card. Exact names need two agreeing observations; fuzzy names need three. Recognized scans save a discovery, play the original confirmation chime, then prerecorded Kokoro narration. Repeated readings of the same species are suppressed; Read to me repeats intentionally. Camera close, navigation, hidden tabs and voice mute cancel or suppress stale output.

Trainer ID uses a generic portrait, nickname, fictional trainer number, partner Pokémon, discoveries and quiz stars. No original child photograph, birthdate, address or location is included. Progress stays in this browser. Grown-up settings export/restore a JSON backup including learned toy embeddings; restoration merges discoveries. Imported data is validated and bounded.

A large in-camera discovery badge shows the recognized Pokémon and repeats its introduction when tapped, so a child does not need to scroll down.

The picture-choice silhouette game starts with familiar Pokémon and adds discovered species. No timer or penalties; incorrect choices invite another try, correct choices reveal the artwork, award one star, and speak the result. Animations respect reduced-motion settings.

Evolution tiles open and narrate the selected Pokémon. Every local entry includes the correct stage and root species, with branches and baby Pokémon handled through parent links. Mega/Gigantamax artwork appears in a separate optional Special forms gallery, labeled as temporary transformations.

## Free local visual recognition (beta)

A grown-up explicitly chooses **Set up toy & artwork recognition** over Wi-Fi. The browser downloads a pinned, quantized CLIP ViT-B/32 vision encoder (89,117,001 bytes) from Hugging Face and caches it when browser storage permits. The single-threaded ONNX WASM runtime is bundled. All image inference runs in a dedicated local worker: no camera frames, photographs, learned embeddings, API keys or inference fees are sent to a service.

Language embeddings for all 1,025 species plus background negatives, and reference-art embeddings for all 1,025 species, are precomputed. The phone downloads only the vision encoder, not a separate text model. Similarity scores are NOT probabilities. Strict confidence/margin rules reject ambiguous guesses; near-exact reference artwork can match even when the language encoder does not know a species name. Agreement is accumulated across independent frames. Recent contradictory strong OCR blocks a visual announcement. An unrecognized or ambiguous toy may need grown-up teaching: choose its species and save 3–5 views/angles with different backgrounds. Up to 100 normalized 512-value vectors are stored locally, not the original photos. Similar toys and clutter can still confuse the model.

Generic CLIP is not a specialist trained on every Pokémon toy. Unfamiliar plushies, unusual poses, shiny/special forms and later-generation characters are not guaranteed. Setup can fail when the external model host is unavailable, browser storage is restricted, or the phone lacks sufficient memory. Bounded startup/inference timeouts leave OCR available. On older phones the model may be slow and warm the device. Parent can pause it. Camera scanning stops on navigation; new visual submissions pause when hidden, and pending results are discarded. No blanket offline-app promise: artwork and uncached audio still require a connection; model caching can be evicted by the browser.

## Voice and pronunciation

Kokoro `am_puck` recordings are generated once at build time. All 1,025 recordings include evolution stage and description. Common Pokémon names and the word Pokémon use explicit phoneme overrides; display names remain unchanged. There is no browser speechSynthesis or paid TTS API. Pronunciation of every less-common species has not been individually audited. Recordings live at `dist/audio/kokoro-v8/`; `voice-catalog.json` contains their exact text. Rapid taps, mute, and tab navigation cancel queued speech.

Rebuild from the PokéAPI CSV exports:

```
python scripts/prepare-voice-catalog.py /path/to/csvs dist
python scripts/prepare-local-pokedex.py /path/to/csvs dist
python scripts/prepare-v8-data.py /path/to/csvs
python scripts/generate-kokoro-audio.py dist /path/to/kokoro.int8.onnx /path/to/voices.bin
python scripts/verify-voice-library.py dist
```

Generation is resumable; remove an affected v8 MP3 before regenerating a changed recording. Kokoro model files and Python dependencies remain outside the repository. Python dependencies are in `scripts/requirements-kokoro.txt`.

To rebuild CLIP embeddings, create a scratch directory containing `clip-model/text_model_quantized.onnx`, `clip-model/vision_model_quantized.onnx`, and `clip-model/tokenizer.json` from Xenova/clip-vit-base-patch32 revision `6b7c523703ae26e39be4b03774966f8571c7f523`. Install onnxruntime, numpy, pillow, tokenizers. Then run:

```
python scripts/prepare-visual-labels.py /path/to/scratch dist
python scripts/prepare-art-prototypes.py /path/to/scratch dist
```

The image model SHA-256 is `583fd1110a514667812fee7d684952aaf82a99b959760c8d7dca7e0ab9839299`. Reference art downloads are cached in scratch only. The app references public PokéAPI artwork URLs; embeddings are included, not 1,025 duplicate PNG files.

## Checks

```
node --test tests/*.test.cjs
node --check dist/app.js
node --check dist/features.js
node --check dist/visual-recognition.js
python scripts/verify-voice-library.py dist
python scripts/verify-visual-data.py dist
```

Browser QA uses an isolated sibling static checkout so synthetic cameras/test fixtures/private uploads are never packaged. Tests cover OCR name matching, sharp-frame selection, card perspective correction, evidence aggregation, stale timers, repeated suppression, voice cancellation, chime, local metadata, and visual confidence/branch-stage semantics. Target Android camera speed, focus, battery use and recognition of Your actual toys still require testing on that device.
