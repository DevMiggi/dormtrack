import type { ToastTone } from '../components/ui/Toast'

// What AppLayout shares with every page inside it. In a page:
//   const { showToast } = useOutletContext<LayoutContext>()
//   showToast('Room saved')
export type LayoutContext = {
  showToast: (message: string, tone?: ToastTone) => void
}
