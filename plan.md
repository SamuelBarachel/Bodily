1. **Add `summarize-bodily-recording` endpoint to API Spec:**
   - Update `lib/api-spec/openapi.yaml` to include a POST route that takes `bodyPart` and `transcript`.
   - Run `pnpm codegen` in `lib/api-spec` to generate types.
2. **Implement API endpoint in `api-server`:**
   - Install `groq-sdk` in `artifacts/api-server`.
   - Create `src/routes/summarize.ts` and set up the `groq-sdk` client to summarize symptoms using `llama3-8b-8192`.
   - Update `src/routes/index.ts` to use this new router.
3. **Add Body Tab in the mobile app:**
   - Add `react-native-body-highlighter` and `expo-speech-recognition` to `artifacts/mobile`.
   - Create `app/(tabs)/body.tsx` where users can toggle male/female, select a body part using `react-native-body-highlighter`.
   - Add recording functionality using `expo-speech-recognition`.
   - On stop recording, call the new `/summarize-bodily-recording` endpoint.
   - Save the summary directly to the journal.
4. **Update Navigation (`_layout.tsx`):**
   - Add the new body tab to both `NativeTabs` and `ClassicTabLayout`.
5. **Complete pre commit steps**
   - Ensure `pnpm run typecheck` works without issues and everything is well-linted.
6. **Submit changes.**
