import { doLogout } from './auth.js'
import { exportJSON, importJSON, loadMoreProjects, save } from './db.js'
import { closeModal, esc, showModal } from '../../utils/js/helpers.js'
import { navigate, navigateBack, render } from '../../utils/js/navigation.js'
import { showGuide } from '../../utils/js/guide.js'
import { wrappedDoLogin } from './app.js'
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
)

globalThis.doLogin = wrappedDoLogin
globalThis.doLogout = doLogout
globalThis.exportJSON = exportJSON
globalThis.importJSON = importJSON
globalThis.showModal = showModal
globalThis.closeModal = closeModal
globalThis.navigate = navigate
globalThis.navigateBack = navigateBack
globalThis.render = render
globalThis.Chart = Chart
globalThis.loadMoreProjects = loadMoreProjects
globalThis.save = save
globalThis.showGuide = showGuide
globalThis.esc = esc
