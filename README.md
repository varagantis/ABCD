
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

Access the deployed app directly with this link: https://buildsync-ai-alpha-654672133317.us-central1.run.app

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the root directory and set your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   **Note:** In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code. You can also use `GEMINI_API_KEY` and it will be automatically mapped, but `VITE_GEMINI_API_KEY` is recommended.
3. Run the app:
   `npm run dev`
