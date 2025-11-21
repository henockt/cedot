import Home from './lib/Home.svelte';
import Editor from './lib/Editor.svelte';
// import NotFound from './NotFound.svelte';

export const routes = {
    '/': Home,

    // sessionId: unique ID for the document being edited
    '/session/:sessionId': Editor,

    // '*': NotFound,
};