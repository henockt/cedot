import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { getSettings } from './lib/storage'
import { applyTheme } from './lib/util'

applyTheme(getSettings().theme)

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
