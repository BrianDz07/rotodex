# Third-party components

- Kokoro-82M model by hexgrad: Apache-2.0, https://huggingface.co/hexgrad/Kokoro-82M . Prerecorded audio in this project was generated locally using the American-English `am_puck` voice and the v1.0 quantized ONNX export.
- kokoro-onnx generation library by thewh1teagle: MIT, https://github.com/thewh1teagle/kokoro-onnx . This is a build-time dependency; the model and Python runtime are not deployed to the phone.
- Pokémon metadata: PokéAPI CSV export, https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv . Narration uses a short English Pokédex description. Displayed narration text is included in `dist/voice-catalog.json`.
- Pokémon characters, names, and artwork belong to their respective rights holders. This is an unofficial personal family fan project.
- OpenCV.js: Apache-2.0, https://opencv.org/license/ . Used for on-device card location and perspective correction.
- Tesseract.js and Tesseract.js-core: Apache-2.0, https://github.com/naptha/tesseract.js . Used for on-device printed-name recognition.
- Scan confirmation sound: original three-note synthesized motif created for this project. It is not a recording sampled from a Pokémon game or television episode.
- Transformers.js 2.17.2 by Hugging Face: Apache-2.0, https://github.com/huggingface/transformers.js . Browser image inference runs in a dedicated worker.
- ONNX Runtime Web 1.14.0: MIT, https://github.com/microsoft/onnxruntime . Single-threaded WASM and SIMD WASM are hosted in this app.
- OpenAI CLIP ViT-B/32: MIT, https://github.com/openai/CLIP . Quantized image encoder distributed by Xenova at https://huggingface.co/Xenova/clip-vit-base-patch32 . Downloaded directly to the visitor's browser only after grown-up setup. Precomputed language/reference-art embeddings are included with the app. There is no OpenAI API integration or paid inference service.
- Trainer placeholder: original generic SVG; personal family assets are excluded.
