import type { AppProps } from 'next/app'
import { reportWebVitals } from '@/lib/performance'

export { reportWebVitals }

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
